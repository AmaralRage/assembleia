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
      "Cache-Control": "public, max-age=60",
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

const getYoutubeUrl = (videoId = "") =>
  videoId ? `https://www.youtube.com/watch?v=${videoId}` : "";

const getYoutubeThumbnail = (videoId = "") =>
  videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";

const cleanVideoId = (videoId = "") =>
  videoId.replace(/\\u0026/g, "&").split("&")[0].trim();

const getTimeZoneOffset = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const zonedUtcTime = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );

  return zonedUtcTime - date.getTime();
};

const zonedTimeToUtc = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
) => {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute);
  const offset = getTimeZoneOffset(new Date(utcGuess), timeZone);
  return new Date(utcGuess - offset);
};

const formatDateTimeInTimeZone = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    event_date: `${values.year}-${values.month}-${values.day}`,
    event_time: `${values.hour}:${values.minute}`,
  };
};

const parseScheduledDate = (text = "") => {
  const match = text.match(
    /(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s*(\d{1,2}):(\d{2})/,
  );

  if (!match) return { event_date: "", event_time: "" };

  const [, day, month, year, hour, minute] = match;
  const sourceTimeZone =
    Deno.env.get("YOUTUBE_SOURCE_TIME_ZONE") || "America/Los_Angeles";
  const targetTimeZone =
    Deno.env.get("YOUTUBE_DISPLAY_TIME_ZONE") || "America/Sao_Paulo";
  const scheduledDate = zonedTimeToUtc(
    Number(year),
    Number(month),
    Number(day),
    Number(hour),
    Number(minute),
    sourceTimeZone,
  );

  return formatDateTimeInTimeZone(scheduledDate, targetTimeZone);
};

const fetchText = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 AssembleiaDeDeusDaLapa/1.0",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
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
        getYoutubeUrl(videoId);
      const thumbnail =
        getAttribute(entry, "media:thumbnail", "url") ||
        getAttribute(entry, "thumbnail", "url") ||
        getYoutubeThumbnail(videoId);

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

const parseUpcomingStreams = (htmlText: string, maxResults: number) => {
  const matches = Array.from(
    htmlText.matchAll(
      /"title":\{"content":"([^"]+)"\}[\s\S]{0,1800}?"content":"(Programado para [^"]+)"/g,
    ),
  );

  const seenVideoIds = new Set<string>();

  return matches
    .map((match) => {
      const title = decodeXml(match[1]);
      const scheduleLabel = decodeXml(match[2]);
      const blockStart = Math.max(0, (match.index || 0) - 2200);
      const blockEnd = Math.min(htmlText.length, (match.index || 0) + 5200);
      const block = htmlText.slice(blockStart, blockEnd);
      const videoId = cleanVideoId(
        block.match(/"url":"\/watch\?v=([^"]+)"/)?.[1] ||
          block.match(/"videoId":"([^"]+)"/)?.[1] ||
          "",
      );
      const thumbnail =
        block
          .match(/"url":"(https:\/\/i\.ytimg\.com\/vi\/[^"]+)"/)?.[1]
          ?.replace(/\\u0026/g, "&") || getYoutubeThumbnail(videoId);
      const { event_date, event_time } = parseScheduledDate(scheduleLabel);

      return {
        videoId,
        title,
        scheduleLabel,
        event_date,
        event_time,
        url: getYoutubeUrl(videoId),
        thumbnail,
      };
    })
    .filter((stream) => {
      if (!stream.videoId || !stream.title || !stream.event_date) return false;
      if (seenVideoIds.has(stream.videoId)) return false;
      seenVideoIds.add(stream.videoId);
      return true;
    })
    .sort((first, second) =>
      `${first.event_date}T${first.event_time || "00:00"}`.localeCompare(
        `${second.event_date}T${second.event_time || "00:00"}`,
      ),
    )
    .slice(0, maxResults);
};

const decodeYoutubeJsonText = (value = "") => {
  try {
    return JSON.parse(`"${value}"`);
  } catch {
    return value.replace(/\\u0026/g, "&").replace(/\\"/g, '"');
  }
};

const parseLiveStream = (htmlText: string) => {
  const videoMatches = Array.from(
    htmlText.matchAll(/"videoId":"([0-9A-Za-z_-]{11})"/g),
  );

  for (const match of videoMatches) {
    const blockStart = Math.max(0, (match.index || 0) - 600);
    const blockEnd = Math.min(htmlText.length, (match.index || 0) + 7000);
    const block = htmlText.slice(blockStart, blockEnd);
    const isLive =
      /"style":"LIVE"/.test(block) ||
      /"label":"(?:AO VIVO|LIVE NOW|LIVE)"/i.test(block) ||
      /BADGE_STYLE_TYPE_LIVE_NOW/.test(block);

    if (!isLive) continue;

    const videoId = match[1];
    const titleMatch =
      block.match(/"title":\{"runs":\[\{"text":"((?:\\.|[^"])*)"/) ||
      block.match(/"title":\{"simpleText":"((?:\\.|[^"])*)"/);
    const thumbnail =
      block
        .match(/"url":"(https:\/\/i\.ytimg\.com\/vi\/[^\"]+)"/)?.[1]
        ?.replace(/\\u0026/g, "&") || getYoutubeThumbnail(videoId);

    return {
      videoId,
      title: decodeYoutubeJsonText(titleMatch?.[1] || "Culto ao vivo"),
      url: getYoutubeUrl(videoId),
      thumbnail,
      isLive: true,
    };
  }

  return null;
};

const findLiveVideoFromFeed = async (
  videos: Array<{ videoId: string; title: string; date: string; url: string; thumbnail: string }>,
) => {
  for (const video of videos.slice(0, 2)) {
    try {
      const videoHtml = await fetchText(video.url);
      if (/"isLive(?:Now)?":true/.test(videoHtml)) {
        return { ...video, isLive: true };
      }
    } catch (error) {
      console.warn(`Não foi possível verificar o vídeo ${video.videoId}.`, error);
    }
  }

  return null;
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
    const streamsUrl = `https://www.youtube.com/${normalizeHandle(channelHandle)}/streams`;
    const feedXml = await fetchText(feedUrl);
    let streamsHtml = "";

    try {
      streamsHtml = await fetchText(streamsUrl);
    } catch (error) {
      console.warn("Não foi possível carregar a aba de transmissões.", error);
    }

    const videos = parseYoutubeFeed(feedXml, maxResults);
    const upcomingStreams = streamsHtml
      ? parseUpcomingStreams(streamsHtml, maxResults)
      : [];
    const liveStream =
      (streamsHtml ? parseLiveStream(streamsHtml) : null) ||
      (await findLiveVideoFromFeed(videos));

    return jsonResponse({
      channelId,
      videos,
      liveStream,
      upcomingStreams,
      nextStream: upcomingStreams[0] || null,
      cachedForSeconds: 60,
    });
  } catch (error) {
    console.error(error);
    return jsonResponse(
      { error: "Não foi possível carregar o feed do YouTube." },
      500,
    );
  }
});
