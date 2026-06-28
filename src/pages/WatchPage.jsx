import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  PlayCircle,
  Radio,
  Youtube,
} from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header.jsx";
import Footer from "@/components/Footer.jsx";
import SectionHeading from "@/components/SectionHeading.jsx";
import { Button } from "@/components/ui/button";
import { churchMedia } from "@/data/churchMedia";
import { mainChurchLocation } from "@/data/churchLocations";
import { supabase } from "@/lib/supabase";
import {
  formatEventDateWithWeekday,
  formatEventTime,
  formatWeekDay,
  getTodayKey,
} from "@/lib/calendar";

const getEventDateTime = (event) => {
  if (!event?.event_date || !event?.event_time) return null;
  return new Date(`${event.event_date}T${event.event_time}`);
};

const isServiceLiveNow = (event) => {
  const startDate = getEventDateTime(event);
  if (!startDate) return false;

  const now = new Date();
  const serviceDurationMs = 2.5 * 60 * 60 * 1000;
  const endDate = new Date(startDate.getTime() + serviceDurationMs);

  return now >= startDate && now <= endDate;
};

const isServiceUpcoming = (event) => {
  const startDate = getEventDateTime(event);
  if (!startDate) return true;

  return startDate > new Date();
};

const getYoutubeVideoId = (video) => {
  if (video.videoId) return video.videoId;

  try {
    const url = new URL(video.url);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.split("/").filter(Boolean)[0];
    }

    if (url.hostname.includes("youtube.com")) {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      if (url.pathname.startsWith("/shorts/")) {
        return url.pathname.split("/").filter(Boolean)[1];
      }
      if (url.pathname.startsWith("/embed/")) {
        return url.pathname.split("/").filter(Boolean)[1];
      }
    }
  } catch {
    return null;
  }

  return null;
};

const getVideoThumbnail = (video) => {
  const videoId = getYoutubeVideoId(video);
  if (videoId) return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  return video.thumbnail || "https://i.imgur.com/WMVJQ9m.jpeg";
};

const formatVideoDate = (date) => {
  if (!date || !date.includes("-")) return date || "Mensagem recente";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
};

const WatchPage = () => {
  const [nextService, setNextService] = useState(null);
  const [upcomingMainServices, setUpcomingMainServices] = useState([]);
  const [isLoadingNextService, setIsLoadingNextService] = useState(true);
  const [recentVideos, setRecentVideos] = useState(churchMedia.recentVideos);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);

  useEffect(() => {
    let isCurrentRequest = true;

    const loadNextService = async () => {
      setIsLoadingNextService(true);

      const { data, error } = await supabase
        .from("calendar_events")
        .select("id, title, event_date, event_time, location, description, category")
        .gte("event_date", getTodayKey())
        .eq("location", mainChurchLocation.name)
        .in("category", ["culto", "especial"])
        .order("event_date", { ascending: true })
        .order("event_time", { ascending: true })
        .limit(12);

      if (!isCurrentRequest) return;

      if (!error) {
        const serviceEvents = data || [];
        setUpcomingMainServices(serviceEvents);

        const currentOrNextService =
          serviceEvents.find(isServiceLiveNow) ||
          serviceEvents.find(isServiceUpcoming) ||
          serviceEvents[0];

        setNextService(currentOrNextService || null);
      }

      setIsLoadingNextService(false);
    };

    loadNextService();

    return () => {
      isCurrentRequest = false;
    };
  }, []);

  useEffect(() => {
    let isCurrentRequest = true;

    const loadRecentVideos = async () => {
      setIsLoadingVideos(true);

      const { data, error } = await supabase.functions.invoke(
        "youtube-latest-videos",
      );

      if (!isCurrentRequest) return;

      if (!error && data?.videos?.length) {
        setRecentVideos(data.videos);
      }

      setIsLoadingVideos(false);
    };

    loadRecentVideos();

    return () => {
      isCurrentRequest = false;
    };
  }, []);

  const isLiveNow = useMemo(() => isServiceLiveNow(nextService), [nextService]);
  const calendarServiceTimes = useMemo(() => {
    const groups = upcomingMainServices.reduce((items, service) => {
      const day = formatWeekDay(service.event_date);
      const currentGroup = items.get(day) || {
        day,
        label: service.title,
        sortDate: service.event_date,
        times: [],
      };

      if (service.event_date < currentGroup.sortDate) {
        currentGroup.sortDate = service.event_date;
        currentGroup.label = service.title;
      }

      const time = formatEventTime(service.event_time, "Horário a definir");
      if (!currentGroup.times.includes(time)) {
        currentGroup.times.push(time);
      }

      items.set(day, currentGroup);
      return items;
    }, new Map());

    return Array.from(groups.values())
      .sort((first, second) => first.sortDate.localeCompare(second.sortDate))
      .slice(0, 2);
  }, [upcomingMainServices]);
  const displayedServiceTimes =
    calendarServiceTimes.length > 0
      ? calendarServiceTimes
      : churchMedia.serviceTimes.slice(0, 2);
  const liveWatchUrl = isLiveNow
    ? churchMedia.youtubeLiveNowUrl
    : churchMedia.youtubeLiveUrl;
  const featuredVideo = recentVideos[0];
  const featuredMediaImage =
    isLiveNow && featuredVideo
      ? getVideoThumbnail(featuredVideo)
      : "https://i.imgur.com/WMVJQ9m.jpeg";
  const featuredMediaTitle = isLiveNow
    ? nextService?.title || featuredVideo?.title || "Culto ao vivo"
    : "Abrir transmissões no YouTube";

  return (
    <>
      <Helmet>
        <title>Assista aos cultos online - Assembleia de Deus da Lapa</title>
        <meta
          name="description"
          content="Assista aos cultos online da Assembleia de Deus da Lapa ao vivo, acompanhe mensagens recentes e veja os próximos horários de transmissão."
        />
        <meta
          property="og:title"
          content="Assista aos cultos online - Assembleia de Deus da Lapa"
        />
        <meta
          property="og:description"
          content="Acompanhe transmissões, mensagens e cultos online pelo canal oficial da Assembleia de Deus da Lapa."
        />
        <meta property="og:image" content="https://i.imgur.com/WMVJQ9m.jpeg" />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background pt-28">
        <section className="section-container pb-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_460px] lg:items-center"
          >
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2 text-sm font-semibold text-foreground">
                {isLiveNow ? (
                  <>
                    <Radio className="h-4 w-4 text-red-600" />
                    Ao vivo agora
                  </>
                ) : (
                  <>
                    <Youtube className="h-4 w-4 text-red-600" />
                    Cultos e mensagens online
                  </>
                )}
              </div>

              <SectionHeading
                eyebrow={isLiveNow ? "Transmissão ao vivo" : "Cultos online"}
                title={isLiveNow ? "Estamos ao vivo" : "Assista o culto"}
                highlight={isLiveNow ? "agora" : "de onde estiver"}
                as="h1"
              />
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                Acompanhe transmissões, mensagens e registros dos cultos pelo
                canal oficial da Assembleia de Deus da Lapa.
              </p>

              <div className="mt-6 rounded-xl border border-border bg-card p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    {isLoadingNextService ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <CalendarDays className="h-5 w-5 text-primary" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                      {isLiveNow ? "Culto em andamento" : "Próximo culto"}
                    </p>

                    {isLoadingNextService ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Buscando a próxima transmissão...
                      </p>
                    ) : nextService ? (
                      <>
                        <h2 className="mt-1 text-xl font-bold text-foreground">
                          {nextService.title}
                        </h2>
                        <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5 capitalize">
                            <CalendarDays className="h-4 w-4 text-primary" />
                            {formatEventDateWithWeekday(nextService.event_date)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-primary" />
                            {formatEventTime(nextService.event_time, "Horário a definir")}
                          </span>
                          {nextService.location && (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="h-4 w-4 text-primary" />
                              {nextService.location}
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Nenhum culto futuro cadastrado no calendário no momento.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-lg">
                  <a
                    href={liveWatchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <PlayCircle className="mr-2 h-5 w-5" />
                    {isLiveNow ? "Assistir culto ao vivo" : "Ver transmissões"}
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-lg">
                  <a
                    href={churchMedia.youtubeChannelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <Youtube className="mr-2 h-5 w-5 transition-colors duration-200 group-hover:text-red-500" />
                    Abrir canal
                  </a>
                </Button>
              </div>
            </div>

            <div
              className={`overflow-hidden rounded-xl bg-slate-950 shadow-xl ${
                isLiveNow
                  ? "border-2 border-red-500 shadow-red-950/30"
                  : "border border-border"
              }`}
            >
              {churchMedia.youtubeEmbedUrl ? (
                <div className="aspect-video">
                  <iframe
                    src={churchMedia.youtubeEmbedUrl}
                    title="Culto da Assembleia de Deus da Lapa"
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={featuredMediaImage}
                    alt={featuredMediaTitle}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.src = "https://i.imgur.com/WMVJQ9m.jpeg";
                    }}
                    className="h-full w-full object-cover opacity-70"
                  />
                  <div className="absolute inset-0 bg-slate-950/60" />
                  <a
                    href={liveWatchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center text-white"
                  >
                    {isLiveNow && (
                      <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-lg">
                        <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                        Ao vivo
                      </span>
                    )}
                    <span className="flex h-20 w-20 items-center justify-center rounded-full bg-red-600 shadow-2xl transition-transform hover:scale-105">
                      <PlayCircle className="h-10 w-10" />
                    </span>
                    <span className="max-w-sm text-xl font-bold">
                      {featuredMediaTitle}
                    </span>
                    {isLiveNow && (
                      <span className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-red-600">
                        Assistir agora no YouTube
                      </span>
                    )}
                  </a>
                </div>
              )}
            </div>
          </motion.div>

          <div className="mb-12 mt-10 grid gap-4 md:grid-cols-3">
            <Link
              to="/calendario"
              className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
            >
              <CalendarDays className="mb-4 h-6 w-6 text-primary" />
              <h2 className="font-bold text-foreground">Próximos cultos</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Veja a agenda completa e escolha uma data para participar
                presencialmente.
              </p>
            </Link>

            <Link
              to="/enderecos"
              className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
            >
              <MapPin className="mb-4 h-6 w-6 text-primary" />
              <h2 className="font-bold text-foreground">Como chegar</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Encontre a congregação mais próxima e abra a rota direto no mapa.
              </p>
            </Link>

            <a
              href={churchMedia.youtubeVideosUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
            >
              <Youtube className="mb-4 h-6 w-6 text-red-600" />
              <h2 className="font-bold text-foreground">Mensagens recentes</h2>
              <p className="mt-2 flex items-center gap-2 text-sm leading-relaxed text-muted-foreground">
                Ver vídeos publicados <ArrowRight className="h-4 w-4" />
              </p>
            </a>
          </div>
        </section>

        <section className="mt-4 border-y border-border bg-muted/45 py-20">
          <div className="section-container">
            <div className="grid gap-10 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
              <div>
                <SectionHeading
                  eyebrow="Horários"
                  title="Cultos presenciais"
                  highlight="e online"
                  titleClassName="text-3xl md:text-5xl"
                />
                <p className="mt-4 text-muted-foreground">
                  Confira os horários regulares e acompanhe as transmissões pelo
                  canal oficial da igreja.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {isLoadingNextService
                  ? [0, 1].map((item) => (
                      <div
                        key={item}
                        className="rounded-xl border border-border bg-background p-5"
                      >
                        <div className="h-5 w-36 rounded bg-muted" />
                        <div className="mt-3 h-4 w-52 rounded bg-muted" />
                        <div className="mt-5 h-9 w-28 rounded bg-muted" />
                      </div>
                    ))
                  : displayedServiceTimes.map((serviceTime) => (
                      <div
                        key={serviceTime.day}
                        className="rounded-xl border border-border bg-background p-5"
                      >
                        <h3 className="text-xl font-bold text-foreground">
                          {serviceTime.day}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {serviceTime.label}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {serviceTime.times.map((time) => (
                            <span
                              key={`${serviceTime.day}-${time}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-2 text-sm font-semibold text-foreground"
                            >
                              <Clock className="h-4 w-4 text-primary" />
                              {time}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section-container pb-16 pt-20">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <SectionHeading
                eyebrow="Mensagens"
                title="Mensagens"
                highlight="recentes"
                titleClassName="text-3xl md:text-5xl"
              />
              {isLoadingVideos && (
                <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Buscando vídeos do YouTube...
                </p>
              )}
            </div>

            <Button asChild variant="outline" className="rounded-lg">
              <a
                href={churchMedia.youtubeVideosUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver todos os vídeos
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {recentVideos.map((video) => (
              <a
                key={video.videoId || video.url || video.title}
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg"
              >
                <div className="relative aspect-video overflow-hidden bg-slate-950">
                  <img
                    src={getVideoThumbnail(video)}
                    alt={video.title}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.src = "https://i.imgur.com/WMVJQ9m.jpeg";
                    }}
                    className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-slate-950/25" />
                  <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white">
                    <Youtube className="h-3.5 w-3.5" />
                    YouTube
                  </span>
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-red-600 shadow-lg transition-transform group-hover:scale-105">
                      <PlayCircle className="h-8 w-8" />
                    </span>
                  </span>
                </div>

                <div className="p-5">
                  <p className="text-sm font-semibold text-primary">
                    {formatVideoDate(video.date)}
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-foreground">
                    {video.title}
                  </h3>
                  <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground group-hover:text-primary">
                    Assistir mensagem <ArrowRight className="h-4 w-4" />
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="section-container pb-20">
          <div className="rounded-xl border border-border bg-card p-6 md:p-8">
            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div>
                <SectionHeading
                  eyebrow="Primeira vez online?"
                  title="Seja bem-vindo à"
                  highlight="Assembleia de Deus da Lapa"
                  titleClassName="text-2xl md:text-4xl"
                />
                <p className="mt-3 max-w-3xl text-muted-foreground">
                  Depois de assistir, conheça nossos endereços e escolha uma
                  congregação para participar presencialmente com sua família.
                </p>
              </div>

              <Button asChild size="lg" className="rounded-lg">
                <Link to="/enderecos">
                  Encontrar uma congregação
                  <MapPin className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default WatchPage;
