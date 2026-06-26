const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=900",
    },
  });

const normalizeHandle = (handle: string) =>
  handle.trim().replace(/^https?:\/\/(www\.)?youtube\.com\//, "").replace(/^@?/, "@");

const decodeXml = (value = "") =>
  value
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();

const getTagText = (source: string, tagName: string) => {
  const escapedTagName = tagName.replace(":", "\\:");
  const match = source.match(
    new RegExp(`<${escapedTagName}[^>]*>([\\s\\S]*?)<\\/${escapedTagName}>`, "i"),
  );

  return decodeXml(match?.[1] || "");
};

const getAttribute = (source: string, tagName: string, attributeName: string) => {
  const escapedTagName = tagName.replace(":", "\\:");
  const match = source.match(
    new RegExp(`<${escapedTagName}[^>]*\\s${attributeName}="([^"]+)"`, "i"),
  );

  return decodeXml(match?.[1] || "");
};

const getVideoIdFromUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname.includes("youtu.be")) {
      return parsedUrl.pathname.split("/").filter(Boolean)[0] || "";
    }

    if (parsedUrl.hostname.includes("youtube.com")) {
      return parsedUrl.searchParams.get("v") || "";
    }
  } catch {
    return "";
  }

  return "";
};

const fetchText = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 AssembleiaDeDeusDaLapa/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed ${response.status}: ${await response.text()}`);
  }

  return response.text();
};

const findChannelIdByHandle = async (handle: string) => {
  const normalizedHandle = normalizeHandle(handle);
  const html = await fetchText(`https://www.youtube.com/${normalizedHandle}`);
  const match =
    html.match(/"channelId":"(UC[0-9A-Za-z_-]{20,})"/) ||
    html.match(/"externalId":"(UC[0-9A-Za-z_-]{20,})"/) ||
    html.match(/<meta itemprop="channelId" content="(UC[0-9A-Za-z_-]{20,})">/);

  return match?.[1] || "";
};

const parseYoutubeFeed = (xmlText: string, maxResults: number) => {
  const entries = Array.from(xmlText.matchAll(/<entry>([\s\S]*?)<\/entry>/g))
    .map((match) => match[1])
    .slice(0, maxResults);

  return entries
    .map((entry) => {
      const videoId =
        getTagText(entry, "yt:videoId") ||
        getTagText(entry, "videoId") ||
        getVideoIdFromUrl(getAttribute(entry, "link", "href"));
      const title = getTagText(entry, "title");
      const publishedAt = getTagText(entry, "published");
      const link =
        getAttribute(entry, "link", "href") ||
        (videoId ? `https://www.youtube.com/watch?v=${videoId}` : "");
      const thumbnail =
        getAttribute(entry, "media:thumbnail", "url") ||
        getAttribute(entry, "thumbnail", "url") ||
        (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "");

      return {
        videoId,
        title,
        date: publishedAt,
        url: link,
        thumbnail,
      };
    })
    .filter((video) => Boolean(video.videoId && video.title && video.url));
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const configuredChannelId = Deno.env.get("YOUTUBE_CHANNEL_ID")?.trim();
    const channelHandle =
      Deno.env.get("YOUTUBE_CHANNEL_HANDLE") || "@AssembleiadeDeusnaLapa";
    const maxResults = Math.min(
      Math.max(Number(Deno.env.get("YOUTUBE_MAX_RESULTS") || 3), 1),
      12,
    );

    const channelId =
      configuredChannelId || (await findChannelIdByHandle(channelHandle));

    if (!channelId) {
      return jsonResponse(
        {
          error:
            "Não foi possível descobrir o ID do canal. Configure YOUTUBE_CHANNEL_ID nos secrets do Supabase.",
        },
        404,
      );
    }

    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const feedXml = await fetchText(feedUrl);
    const videos = parseYoutubeFeed(feedXml, maxResults);

    return jsonResponse({ channelId, videos });
  } catch (error) {
    console.error(error);
    return jsonResponse(
      { error: "Não foi possível carregar o feed do YouTube." },
      500,
    );
  }
});
