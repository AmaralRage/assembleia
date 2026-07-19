import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from "react-helmet-async";
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight, MapPin, Youtube, Sparkles, Users, Settings, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import SectionHeading from '@/components/SectionHeading.jsx';
import { supabase } from '@/lib/supabase';
import { smoothScrollToElement } from '@/lib/smoothScroll';
import { churchLocations, getChurchLocation, mainChurchLocation } from '@/data/churchLocations';
import { churchMedia } from '@/data/churchMedia';
import { featuredFestivity as fallbackFestivity } from '@/data/churchHighlights';
import { dateKeyToDate, dateKeyToUtcNoon, formatEventDate, formatEventTime, formatWeekDay, getTodayKey } from '@/lib/calendar';
import { isAdminSessionFresh } from '@/lib/adminDevice';

const getImageRatio = (imageUrl) =>
  new Promise((resolve) => {
    if (!imageUrl || typeof window === 'undefined') {
      resolve('16 / 9');
      return;
    }

    const image = new Image();
    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight) {
        resolve('16 / 9');
        return;
      }

      resolve(`${image.naturalWidth} / ${image.naturalHeight}`);
    };
    image.onerror = () => resolve('16 / 9');
    image.src = imageUrl;
  });

const defaultFeaturedInviteMessage = 'Venha viver uma noite de fé com a gente.';

const youtubeCacheKey = 'assembleia-youtube-media-cache-v2';
const youtubeCacheTtlMs = 12 * 60 * 60 * 1000;

const getYoutubeVideoId = (video) => {
  if (video?.videoId) return video.videoId;

  try {
    const url = new URL(video?.url);
    return url.searchParams.get('v');
  } catch {
    return null;
  }
};

const getVideoThumbnail = (video) => {
  const videoId = getYoutubeVideoId(video);
  return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : (video?.thumbnail || 'https://i.imgur.com/WMVJQ9m.jpeg');
};

const handleVideoThumbnailError = (event, video) => {
  const videoId = getYoutubeVideoId(video);
  const fallbackThumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : 'https://i.imgur.com/WMVJQ9m.jpeg';

  if (event.currentTarget.src !== fallbackThumbnail) {
    event.currentTarget.src = fallbackThumbnail;
    return;
  }

  event.currentTarget.onerror = null;
  event.currentTarget.src = 'https://i.imgur.com/WMVJQ9m.jpeg';
};

const getVideoSpeaker = (title = '') => {
  const speakerPattern = /(?:^|[|•—–-]\s*)(Pr\.?|Pra\.?|Pastor(?:a)?|Pb\.?|Ev\.?)\s+([^|•—–-]+)/i;
  const match = title.match(speakerPattern);
  return match ? `${match[1]} ${match[2]}`.trim() : '';
};

const formatVideoDate = (date) => {
  if (!date || !date.includes('-')) return date || 'Mensagem recente';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
};

const hasMeaningfulText = (value) => /[\p{L}\p{N}]/u.test(value || '');

const formatEventDayNumber = (dateKey) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    timeZone: 'UTC',
  }).format(dateKeyToUtcNoon(dateKey));

const formatEventShortMonth = (dateKey) =>
  new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    timeZone: 'UTC',
  })
    .format(dateKeyToUtcNoon(dateKey))
    .replace('.', '')
    .toUpperCase();

const compareUpcomingEvents = (firstEvent, secondEvent) => {
  const firstDate = firstEvent.event_date || '';
  const secondDate = secondEvent.event_date || '';

  if (firstDate !== secondDate) {
    return firstDate.localeCompare(secondDate);
  }

  const firstTime = firstEvent.event_time || '99:99:99';
  const secondTime = secondEvent.event_time || '99:99:99';

  return firstTime.localeCompare(secondTime);
};

const eventDateTime = (event) => {
  if (!event?.event_date || !event.event_time) return null;

  const [year, month, day] = event.event_date.split('-').map(Number);
  const [hour = 0, minute = 0] = event.event_time.split(':').map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day, hour, minute);
};

const hasEventTimePassed = (event, currentDateTime = new Date()) => {
  if (!event?.event_date) return false;

  const currentDateKey = getTodayKey();
  if (event.event_date < currentDateKey) return true;
  if (event.event_date > currentDateKey) return false;

  const startsAt = eventDateTime(event);
  return startsAt ? startsAt <= currentDateTime : false;
};

const getRelativeEventLabel = (dateKey) => {
  if (!dateKey) return '';

  const today = dateKeyToDate(getTodayKey());
  const eventDate = dateKeyToDate(dateKey);
  const dayDifference = Math.round((eventDate - today) / 86400000);

  if (dayDifference === 0) return 'hoje';
  if (dayDifference === 1) return 'amanhã';
  if (dayDifference > 1) return `em ${dayDifference} dias`;

  return '';
};

const getEventFallbackDescription = (event) => {
  const title = event?.title?.toLowerCase() || '';
  const category = event?.category || '';

  if (category === 'oração' || title.includes('oração')) {
    return 'Um momento de busca e fortalecimento espiritual.';
  }

  if (category === 'festividade' || category === 'especial' || title.includes('celebração')) {
    return 'Uma programação especial para toda a igreja.';
  }

  if (category === 'culto' || title.includes('culto')) {
    return 'Venha cultuar conosco em comunhão.';
  }

  return 'Uma programação para vivermos fé, comunhão e Palavra.';
};

const getLocationParts = (location) => {
  if (!location) return { primary: '', secondary: '' };

  const [primary, ...rest] = location.split(/\s+-\s+/);

  return {
    primary: primary?.trim() || location,
    secondary: rest.join(' - ').trim(),
  };
};

const HomePage = () => {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [upcomingEventsError, setUpcomingEventsError] = useState(false);
  const [featuredFestivities, setFeaturedFestivities] = useState([]);
  const [featuredFestivityIndex, setFeaturedFestivityIndex] = useState(0);
  const [featuredFestivityError, setFeaturedFestivityError] = useState(false);
  const [isFeaturedAutoplayPaused, setIsFeaturedAutoplayPaused] = useState(false);
  const [isFeaturedSectionBeingRead, setIsFeaturedSectionBeingRead] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [latestMessage, setLatestMessage] = useState(churchMedia.recentVideos[0]);
  const [isLatestMessageLoading, setIsLatestMessageLoading] = useState(true);
  const featuredSectionRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadLatestMessage = async () => {
      try {
        const cachedValue = window.localStorage.getItem(youtubeCacheKey);
        const cached = cachedValue ? JSON.parse(cachedValue) : null;
        const cacheIsFresh = cached?.savedAt && Date.now() - cached.savedAt <= youtubeCacheTtlMs;
        const cachedVideo = cacheIsFresh ? cached?.data?.videos?.[0] : null;

        if (cachedVideo) {
          setLatestMessage(cachedVideo);
          setIsLatestMessageLoading(false);
          return;
        }
      } catch {
        // Continue with a fresh request when the local cache is unavailable.
      }

      const { data, error } = await supabase.functions.invoke('youtube-latest-videos');
      if (!isMounted) return;

      if (error || !data?.videos?.[0]) {
        setIsLatestMessageLoading(false);
        return;
      }

      setLatestMessage(data.videos[0]);
      setIsLatestMessageLoading(false);

      try {
        window.localStorage.setItem(
          youtubeCacheKey,
          JSON.stringify({ savedAt: Date.now(), data }),
        );
      } catch {
        // The message still renders when cache storage is unavailable.
      }
    };

    loadLatestMessage();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const checkAdminAccess = async (currentSession) => {
      if (!currentSession || !isAdminSessionFresh()) {
        if (isMounted) setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase.rpc('is_calendar_admin');
      if (isMounted) setIsAdmin(!error && data === true);
    };

    supabase.auth.getSession().then(({ data }) => {
      checkAdminAccess(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setTimeout(() => {
        checkAdminAccess(currentSession);
      }, 0);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const loadUpcomingEvents = async () => {
      const todayKey = getTodayKey();

      const { data, error } = await supabase
        .from('calendar_events')
        .select('id, title, event_date, event_time, description, location, category')
        .gte('event_date', todayKey)
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true })
        .limit(16);

      if (error) {
        setUpcomingEventsError(true);
      } else {
        setUpcomingEventsError(false);
        setUpcomingEvents(
          [...(data || [])]
            .filter((event) => !hasEventTimePassed(event))
            .sort(compareUpcomingEvents)
            .slice(0, 8),
        );
      }

      setIsLoadingEvents(false);
    };

    loadUpcomingEvents();
  }, []);

  useEffect(() => {
    const loadFeaturedFestivity = async () => {
      const todayKey = getTodayKey();

      const { data, error } = await supabase
        .from('calendar_events')
        .select(
          'id, title, event_date, event_time, location, description, category, highlight_until, highlight_image_url, highlight_summary',
        )
        .in('category', ['especial', 'festividade'])
        .eq('highlight_home', true)
        .gte('highlight_until', todayKey)
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true })
        .limit(8);

      if (error) {
        setFeaturedFestivityError(true);
        setFeaturedFestivities(fallbackFestivity.active ? [fallbackFestivity] : []);
        return;
      }

      setFeaturedFestivityError(false);

      if (!data?.length) {
        setFeaturedFestivities([]);
        return;
      }

      const formattedFestivities = await Promise.all(
        data.map(async (festivity) => {
          const location = getChurchLocation(festivity.location) || mainChurchLocation;
          const image = festivity.highlight_image_url || fallbackFestivity.image;

          return {
            active: true,
            id: festivity.id,
            eyebrow:
              festivity.category === 'festividade'
                ? 'Festividade em destaque'
                : 'Evento especial em destaque',
            title: festivity.title,
            inviteMessage: festivity.highlight_summary || defaultFeaturedInviteMessage,
            subtitle:
              festivity.description ||
              'Uma programação especial preparada para receber você e sua família.',
            date: formatEventDate(festivity.event_date),
            time: formatEventTime(festivity.event_time, 'Horário a definir'),
            location: festivity.location || location.name,
            address: location.address,
            image,
            imageRatio: await getImageRatio(image),
            mapUrl: location.mapUrl,
            highlights: [
              festivity.description || 'Uma noite especial de comunhão e Palavra.',
              'Recepção preparada para visitantes',
              `Destaque disponível até ${formatEventDate(festivity.highlight_until)}`,
            ],
          };
        }),
      );

      setFeaturedFestivities(formattedFestivities);
    };

    loadFeaturedFestivity();
  }, []);

  useEffect(() => {
    if (featuredFestivities.length > 0 && featuredFestivityIndex >= featuredFestivities.length) {
      setFeaturedFestivityIndex(0);
    }
  }, [featuredFestivities.length, featuredFestivityIndex]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const featuredSection = featuredSectionRef.current;
    if (!featuredSection || !('IntersectionObserver' in window)) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFeaturedSectionBeingRead(entry.isIntersecting && entry.intersectionRatio >= 0.7);
      },
      { threshold: [0, 0.25, 0.7, 0.9] },
    );

    observer.observe(featuredSection);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (
      featuredFestivities.length <= 1 ||
      isFeaturedAutoplayPaused ||
      isFeaturedSectionBeingRead
    ) {
      return undefined;
    }

    const autoplayId = window.setInterval(() => {
      setFeaturedFestivityIndex((currentIndex) =>
        currentIndex === featuredFestivities.length - 1 ? 0 : currentIndex + 1,
      );
    }, 7000);

    return () => window.clearInterval(autoplayId);
  }, [featuredFestivities.length, isFeaturedAutoplayPaused, isFeaturedSectionBeingRead]);

  const featuredFestivity = featuredFestivities[featuredFestivityIndex] || null;
  const featuredImageRatio = featuredFestivity?.imageRatio || '16 / 9';
  const [featuredImageWidth, featuredImageHeight] = featuredImageRatio
    .split('/')
    .map(Number);
  const featuredImageAspectRatio =
    featuredImageWidth > 0 && featuredImageHeight > 0
      ? featuredImageWidth / featuredImageHeight
      : 16 / 9;
  const hasMultipleFeaturedFestivities = featuredFestivities.length > 1;
  const showPreviousFeaturedFestivity = () => {
    setFeaturedFestivityIndex((currentIndex) =>
      currentIndex === 0 ? featuredFestivities.length - 1 : currentIndex - 1,
    );
  };
  const showNextFeaturedFestivity = () => {
    setFeaturedFestivityIndex((currentIndex) =>
      currentIndex === featuredFestivities.length - 1 ? 0 : currentIndex + 1,
    );
  };

  const featuredLocations = churchLocations.slice(0, 3);
  const highlightedService = upcomingEvents[0] || null;
  const highlightedServiceLocation =
    highlightedService && getChurchLocation(highlightedService.location);
  const highlightedServiceRelativeLabel = getRelativeEventLabel(highlightedService?.event_date);
  const highlightedServiceDescription = hasMeaningfulText(highlightedService?.description)
    ? highlightedService.description.trim()
    : getEventFallbackDescription(highlightedService);
  const highlightedServiceLocationParts = getLocationParts(highlightedService?.location);
  const agendaListEvents = highlightedService
    ? upcomingEvents.filter((event) => event.id !== highlightedService.id)
    : upcomingEvents;
  const agendaDays = Object.values(
    agendaListEvents.reduce((days, event) => {
      if (!days[event.event_date]) {
        days[event.event_date] = {
          date: event.event_date,
          label: formatWeekDay(event.event_date),
          dateLabel: formatEventDate(event.event_date),
          events: []
        };
      }

      days[event.event_date].events.push(event);
      return days;
    }, {})
  );
  const mobileAgendaEventLimit = 3;
  const mobileAgendaEvents = agendaListEvents.slice(0, mobileAgendaEventLimit);
  const mobileAgendaDays = Object.values(
    mobileAgendaEvents.reduce((days, event) => {
      if (!days[event.event_date]) {
        days[event.event_date] = {
          date: event.event_date,
          label: formatWeekDay(event.event_date),
          dateLabel: formatEventDate(event.event_date),
          events: [],
        };
      }

      days[event.event_date].events.push(event);
      return days;
    }, {}),
  );
  const hiddenMobileAgendaEventsCount = Math.max(
    agendaListEvents.length - mobileAgendaEvents.length,
    0,
  );
  const agendaDesktopRows = [];
  for (let index = 0; index < agendaDays.length; index += 4) {
    agendaDesktopRows.push(agendaDays.slice(index, index + 4));
  }
  const latestMessageSpeaker = getVideoSpeaker(latestMessage.title);

  return (
    <>
      <Helmet>
        <title>Assembleia de Deus - Bem-vindo à nossa comunidade de fé</title>
        <meta name="description" content="Junte-se à nossa comunidade de fé. Confira nossa agenda, conheça nossas congregações e assista às mensagens mais recentes." />
      </Helmet>

      <Header />

      <main className="flex flex-col">
        {/* HERO SECTION */}
        <section className="relative order-1 flex min-h-[68svh] items-center justify-center overflow-hidden pb-9 pt-20 sm:min-h-[84dvh] sm:pb-14 sm:pt-28 md:min-h-[96dvh] md:pb-20 md:pt-32 lg:min-h-[100dvh]">
          <div className="absolute inset-0 bg-cover bg-center" style={{
            backgroundImage: 'url(https://i.imgur.com/WMVJQ9m.jpeg)'
          }}>
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/70 to-slate-900/90" />
          </div>

          <div className="relative z-10 section-container text-center">
            <motion.div initial={{
              opacity: 0,
              y: 30
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.8
            }} className="flex flex-col items-center gap-3 sm:gap-6 md:gap-8">
              <div className="hidden h-16 w-16 overflow-hidden rounded-2xl bg-white shadow-2xl ring-4 ring-white/20 min-[390px]:block sm:h-28 sm:w-28 md:h-40 md:w-40">
                <img src="https://i.imgur.com/SA53Yxc.png" alt="Logo da Assembleia de Deus" className="w-full h-full object-cover" />
              </div>

              <div>
                <h1 className="mb-3 text-[1.7rem] font-bold leading-tight text-white min-[390px]:text-[1.9rem] sm:mb-4 sm:text-5xl md:text-6xl lg:text-7xl" style={{
                  textWrap: 'balance'
                }}>
                  Assembleia de Deus na Lapa
                </h1>
                <p className="mx-auto max-w-2xl text-base font-light leading-relaxed text-white/90 sm:text-lg md:text-2xl">
                  Bem-vindo à nossa comunidade de fé
                </p>
                <div className="mt-4 inline-flex max-w-full items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white/90 shadow-lg backdrop-blur-sm min-[390px]:text-sm sm:mt-5 sm:px-4 sm:text-base">
                  <MapPin className="h-4 w-4 shrink-0 text-[#93caff]" />
                  <span className="truncate">Rio de Janeiro, RJ · Rua Joaquim Silva, 52</span>
                </div>
              </div>

              <div className="flex w-full max-w-[16rem] flex-col items-center gap-2.5 sm:mt-4 sm:w-auto sm:max-w-none sm:flex-row sm:gap-4 md:mt-8">
              <motion.div initial={{
                opacity: 0
              }} animate={{
                opacity: 1
              }} transition={{
                delay: 0.5,
                duration: 0.8
              }} className="w-full max-w-[16rem] sm:w-auto sm:max-w-none">
                <Link
                  to="/sou-novo"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition-all duration-200 hover:bg-primary/90 hover:shadow-xl active:scale-[0.98] sm:w-auto sm:px-7 sm:py-3.5 sm:text-base md:px-8 md:py-4"
                >
                  Sou novo por aqui
                </Link>
              </motion.div>
                <motion.div initial={{
                  opacity: 0
                }} animate={{
                  opacity: 1
                }} transition={{
                  delay: 0.6,
                  duration: 0.8
                }} className="w-full max-w-[16rem] sm:w-auto sm:max-w-none">
                <Link
                  to="/assistir"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 active:scale-[0.98] sm:w-auto sm:px-7 sm:py-3.5 sm:text-base md:px-8 md:py-4"
                >
                  <Youtube className="h-4 w-4 transition-colors duration-200 group-hover:text-red-500 sm:h-5 sm:w-5" />
                  Assistir culto
                </Link>
              </motion.div>
                <motion.a href="#agenda" onClick={e => {
                  e.preventDefault();
                  const element = document.querySelector('#agenda');
                  if (element) {
                    smoothScrollToElement(element);
                  }
                }} initial={{
                  opacity: 0
                }} animate={{
                  opacity: 1
                }} transition={{
                  delay: 0.7,
                  duration: 0.8
                }} className="inline-flex w-full max-w-[16rem] items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-lg transition-all duration-200 hover:bg-white/90 hover:text-primary active:scale-[0.98] sm:w-auto sm:max-w-none sm:px-7 sm:py-3.5 sm:text-base md:px-8 md:py-4">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  Ver agenda
                </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

        {/* FESTIVIDADE EM DESTAQUE */}
        {featuredFestivity?.active && (
          <section ref={featuredSectionRef} className="order-2 overflow-hidden bg-[#f4f7fb] py-8 dark:bg-slate-950 md:py-10">
            <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8 2xl:max-w-[1620px]">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55 }}
                onMouseEnter={() => setIsFeaturedAutoplayPaused(true)}
                onMouseLeave={() => setIsFeaturedAutoplayPaused(false)}
                onFocusCapture={() => setIsFeaturedAutoplayPaused(true)}
                onBlurCapture={() => setIsFeaturedAutoplayPaused(false)}
                className="relative min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-lg md:rounded-3xl md:shadow-xl xl:h-[clamp(720px,calc(100svh-1rem),920px)]"
              >
                <div
                  className="grid h-full min-w-0 bg-[#071526] xl:grid-cols-[minmax(0,min(58%,calc(clamp(720px,calc(100svh-1rem),920px)*var(--featured-image-ratio))))_minmax(0,1fr)]"
                  style={{ '--featured-image-ratio': featuredImageAspectRatio }}
                >
                  <div
                    className="relative min-w-0 overflow-hidden bg-slate-950 xl:h-full"
                    style={{ aspectRatio: featuredImageRatio }}
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={featuredFestivity.id || featuredFestivity.image}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.42, ease: 'easeOut' }}
                        className="absolute inset-0"
                      >
                        <img
                          src={featuredFestivity.image}
                          alt=""
                          aria-hidden="true"
                          loading="eager"
                          decoding="async"
                          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-2xl"
                        />
                        <motion.img
                          src={featuredFestivity.image}
                          alt={featuredFestivity.title}
                          loading="eager"
                          decoding="async"
                          initial={{ scale: 1.015 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.42, ease: 'easeOut' }}
                          className="absolute inset-0 h-full w-full object-contain"
                        />
                      </motion.div>
                    </AnimatePresence>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/92 via-slate-950/34 to-transparent xl:bg-gradient-to-r xl:from-transparent xl:via-slate-950/12 xl:to-slate-950/74" />

                    {hasMultipleFeaturedFestivities && (
                      <>
                        <button
                          type="button"
                          onClick={showPreviousFeaturedFestivity}
                          aria-label="Mostrar destaque anterior"
                          className="absolute left-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-slate-950/65 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-slate-950/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 md:left-5 md:h-12 md:w-12"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={showNextFeaturedFestivity}
                          aria-label="Mostrar proximo destaque"
                          className="absolute right-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-slate-950/65 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-slate-950/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 md:right-5 md:h-12 md:w-12"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                        <div className="absolute right-4 top-4 z-10 rounded-full border border-white/25 bg-slate-950/65 px-3 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-md md:right-6 md:top-6">
                          {featuredFestivityIndex + 1} / {featuredFestivities.length}
                        </div>
                      </>
                    )}

                    <div className="absolute bottom-3 left-3 right-3 min-w-0 rounded-xl border border-white/15 bg-slate-950/78 px-3 py-2.5 text-white shadow-[0_14px_40px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl [overflow-wrap:anywhere] sm:bottom-4 sm:left-4 sm:right-4 sm:px-4 sm:py-3 md:bottom-6 md:left-6 md:right-auto md:max-w-xs md:rounded-2xl md:bg-slate-950/74 md:p-4 md:shadow-xl">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="hidden h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground sm:flex md:h-10 md:w-10 md:rounded-xl">
                          <Sparkles className="h-4 w-4 md:h-5 md:w-5" />
                        </span>
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-200 sm:text-[10px] md:text-xs md:tracking-[0.2em]">
                            Convite especial
                          </p>
                          <p className="text-[11px] font-semibold text-white/80 sm:text-xs md:text-sm">
                            Entrada livre para visitantes
                          </p>
                        </div>
                      </div>
                      <p className="text-base font-bold leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)] sm:text-xl md:text-2xl">
                        {featuredFestivity.inviteMessage || defaultFeaturedInviteMessage}
                      </p>
                    </div>
                  </div>

                  <div className="relative flex min-w-0 flex-col justify-center bg-[#071526] p-5 text-white sm:p-6 md:p-8 xl:-ml-px xl:p-9 [@media(max-height:800px)]:xl:p-7">
                    {featuredFestivityError && (
                      <div className="mb-4 rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm font-semibold text-amber-100">
                        Não foi possível atualizar o destaque agora. Exibindo uma programação sugerida.
                      </div>
                    )}
                    {isAdmin && featuredFestivity.id && (
                      <Link
                        to={`/calendario?event=${featuredFestivity.id}&edit=1`}
                        aria-label="Editar evento em destaque"
                        title="Editar evento em destaque"
                        className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-blue-100 shadow-lg backdrop-blur-md transition-colors hover:bg-white/18 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                      >
                        <Settings className="h-4 w-4" />
                      </Link>
                    )}

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={featuredFestivity.id || featuredFestivity.title}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="min-w-0 [overflow-wrap:anywhere]"
                      >
                    <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-100 md:px-4 md:py-2 md:text-xs md:tracking-[0.18em]">
                      <Sparkles className="h-3.5 w-3.5 text-[#76b7ff] md:h-4 md:w-4" />
                      {featuredFestivity.eyebrow}
                    </span>

                    <h2 className="max-w-xl text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">
                      {featuredFestivity.title}
                    </h2>
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/78 sm:text-base md:text-base">
                      {featuredFestivity.subtitle}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:mt-6 md:gap-3">
                      <div className="rounded-xl border border-white/12 bg-white/[0.07] p-3 md:p-4">
                        <Calendar className="mb-2 h-4 w-4 text-[#76b7ff] md:mb-3 md:h-5 md:w-5" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-100 md:text-xs md:tracking-[0.16em]">
                          Data
                        </p>
                        <p className="mt-1 text-base font-bold md:text-lg">{featuredFestivity.date}</p>
                      </div>
                      <div className="rounded-xl border border-white/12 bg-white/[0.07] p-3 md:p-4">
                        <Clock className="mb-2 h-4 w-4 text-[#76b7ff] md:mb-3 md:h-5 md:w-5" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-100 md:text-xs md:tracking-[0.16em]">
                          Horário
                        </p>
                        <p className="mt-1 text-base font-bold md:text-lg">{featuredFestivity.time}</p>
                      </div>
                      <div className="col-span-2 rounded-xl border border-white/12 bg-white/[0.07] p-3 sm:col-span-1 md:p-4">
                        <MapPin className="mb-2 h-4 w-4 text-[#76b7ff] md:mb-3 md:h-5 md:w-5" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-100 md:text-xs md:tracking-[0.16em]">
                          Local
                        </p>
                        <p className="mt-1 text-sm font-bold leading-snug md:text-sm">
                          {featuredFestivity.location}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-xl border border-[#76b7ff]/45 bg-[#10253d] p-4 text-white shadow-lg shadow-slate-950/20 md:mt-6 md:rounded-2xl md:p-4 [@media(max-height:800px)]:xl:hidden">
                      <div className="mb-3 flex items-center gap-2 text-white md:mb-4">
                        <Users className="h-4 w-4 text-[#93caff] md:h-5 md:w-5" />
                        <p className="text-sm font-extrabold uppercase tracking-[0.14em] md:text-base md:tracking-[0.16em]">
                          O que esperar
                        </p>
                      </div>
                      <div className="grid gap-2 md:gap-3">
                        {featuredFestivity.highlights.map((highlight) => (
                          <div key={highlight} className="flex min-w-0 gap-3 text-[15px] font-semibold leading-relaxed text-white md:text-base">
                            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#93caff] shadow-[0_0_0_3px_rgba(147,202,255,0.18)]" />
                            <span className="min-w-0 [overflow-wrap:anywhere]">{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mx-auto mt-6 flex w-full max-w-[16rem] flex-col gap-2 sm:mx-0 sm:max-w-none sm:flex-row md:mt-6 md:gap-3">
                      <a
                        href="#agenda"
                        onClick={(event) => {
                          event.preventDefault();
                          const element = document.querySelector('#agenda');
                          if (element) {
                            smoothScrollToElement(element);
                          }
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 sm:px-5 sm:py-3 sm:text-sm md:px-6 md:py-3.5"
                      >
                        Ver programação
                        <ArrowRight className="h-4 w-4" />
                      </a>
                      <a
                        href={featuredFestivity.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-white/16 sm:px-5 sm:py-3 sm:text-sm md:px-6 md:py-3.5"
                      >
                        <MapPin className="h-4 w-4" />
                        Como chegar
                      </a>
                      <Link
                        to="/sou-novo"
                        className="inline-flex items-center justify-center px-3 py-2.5 text-xs font-bold text-blue-100 transition-colors hover:text-white sm:px-4 sm:py-3 sm:text-sm"
                      >
                        Sou visitante
                      </Link>
                    </div>

                    <p className="mt-4 text-xs leading-relaxed text-white/55 md:text-sm">
                      {featuredFestivity.address}
                    </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* ÚLTIMA MENSAGEM SECTION */}
        <section id="mensagem" className="order-5 bg-background py-14 md:py-20">
          <div className="section-container">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mx-auto max-w-6xl">
              <div className="mb-8 md:mb-10">
                <SectionHeading
                  eyebrow="Palavra e comunhão"
                  title="Uma mensagem para"
                  highlight="sua semana"
                  description="Assista à mensagem mais recente e acompanhe os cultos no nosso canal oficial."
                  titleClassName="text-3xl md:text-5xl"
                />
              </div>

              <div
                className="relative grid overflow-hidden rounded-2xl border border-border bg-card shadow-lg md:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] md:rounded-3xl"
                aria-busy={isLatestMessageLoading}
              >
                {isLatestMessageLoading && (
                  <div className="absolute inset-0 z-20 grid bg-card md:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]" aria-label="Carregando mensagem mais recente">
                    <div className="aspect-video animate-pulse bg-muted md:aspect-auto md:min-h-[360px]" />
                    <div className="flex flex-col justify-center gap-4 p-6 md:p-9 lg:p-10">
                      <span className="h-7 w-36 animate-pulse rounded-full bg-muted" />
                      <span className="h-4 w-28 animate-pulse rounded bg-muted" />
                      <span className="h-8 w-full animate-pulse rounded bg-muted" />
                      <span className="h-8 w-4/5 animate-pulse rounded bg-muted" />
                      <span className="mt-3 h-11 w-40 animate-pulse rounded-xl bg-muted" />
                    </div>
                  </div>
                )}
                <a href={latestMessage.url} target="_blank" rel="noopener noreferrer" aria-label={`Assistir ${latestMessage.title} no YouTube`} className="group relative aspect-video overflow-hidden bg-slate-950 md:aspect-auto md:min-h-[360px]">
                  <img
                    src={getVideoThumbnail(latestMessage)}
                    alt=""
                    loading="lazy"
                    onError={(event) => handleVideoThumbnailError(event, latestMessage)}
                    className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/10" />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-12 w-[4.25rem] items-center justify-center rounded-[0.9rem] bg-red-600 text-white shadow-2xl ring-4 ring-white/20 transition-transform duration-300 group-hover:scale-110 md:h-14 md:w-20 md:rounded-2xl">
                      <Play className="ml-0.5 h-6 w-6 fill-current md:h-7 md:w-7" strokeWidth={2.5} />
                    </span>
                  </span>
                </a>

                <div className="flex min-w-0 flex-col justify-center p-6 md:p-8 lg:p-10">
                  <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-red-500/25 bg-red-500/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-500 shadow-sm">
                    <Youtube className="h-4 w-4" />
                    Última mensagem
                  </span>
                  <p className="text-sm font-semibold text-primary">
                    {latestMessage.date?.includes('-')
                      ? `Publicado em ${formatVideoDate(latestMessage.date)}`
                      : formatVideoDate(latestMessage.date)}
                  </p>
                  <h3 className="mt-3 text-2xl font-bold leading-[1.15] text-foreground [text-wrap:balance] md:text-[1.65rem] lg:text-3xl">
                    {latestMessage.title}
                  </h3>
                  {latestMessageSpeaker && (
                    <p className="mt-3 text-sm font-medium text-muted-foreground">
                      Ministração: {latestMessageSpeaker}
                    </p>
                  )}
                  <div className="mt-7 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
                    <a href={latestMessage.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md">
                      Assistir agora
                      <ArrowRight className="h-4 w-4" />
                    </a>
                    <Link to="/assistir" className="inline-flex min-h-12 w-full items-center justify-center whitespace-nowrap rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary hover:shadow-sm">
                      Ver todas as mensagens
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* AGENDA SECTION */}
        <section id="agenda" className="order-3 py-14 md:py-24 bg-background">
          <div className="section-container">
            <motion.div initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              duration: 0.6
            }} className="mx-auto mb-10 max-w-7xl md:mb-14">
              <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <SectionHeading
                  eyebrow="Nossa rotina"
                  title="Atividades da"
                  highlight="semana"
                  titleClassName="max-w-3xl"
                />
                <p className="max-w-md text-base leading-relaxed text-muted-foreground md:text-right md:text-lg">
                  Fique por dentro dos nossos próximos cultos, encontros e eventos especiais.
                </p>
              </div>
            </motion.div>

            <motion.div initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              duration: 0.5
            }} className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl md:rounded-3xl">
              <div className="flex flex-col gap-4 border-b border-border bg-muted/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-7">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_0_5px_hsl(var(--primary)/0.12)]" />
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-foreground">
                    Programação semanal
                  </p>
                </div>
                <Link
                  to="/calendario"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Calendar className="h-4 w-4" />
                  Calendário completo
                </Link>
              </div>

              {isLoadingEvents ? (
                <div className="px-6 py-14 text-center text-muted-foreground">
                  Carregando próximas atividades...
                </div>
              ) : upcomingEventsError ? (
                <div className="px-6 py-14 text-center">
                  <Calendar className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
                  <p className="font-semibold text-foreground">
                    Não foi possível carregar a agenda agora.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tente novamente em instantes ou acesse o calendário completo.
                  </p>
                </div>
              ) : highlightedService || agendaDays.length > 0 ? (
                <>
                {highlightedService && (
                  <div className="border-b border-border bg-background px-4 py-5 md:px-7 md:py-7">
                    <div className="mx-auto grid max-w-[20.5rem] gap-5 rounded-2xl border border-border bg-background p-[1.125rem] shadow-sm transition-all duration-300 hover:border-primary/25 hover:shadow-lg dark:border-border/70 dark:bg-slate-950/35 dark:hover:border-primary/35 md:max-w-none md:grid-cols-[minmax(0,1fr)_11rem] md:items-center md:gap-6 md:p-6">
                      <div className="grid min-w-0 gap-5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-center md:gap-7">
                        <div className="flex h-48 w-full flex-col items-center justify-center rounded-xl border border-primary/10 bg-gradient-to-br from-primary/10 via-primary/15 to-primary/30 px-4 py-7 text-center text-primary shadow-sm dark:border-primary/25 dark:from-primary/15 dark:via-primary/25 dark:to-primary/40 dark:text-blue-100 sm:h-24 sm:w-24 sm:px-0 sm:py-0 md:h-28 md:w-28">
                          <span className="mb-1 text-[7px] font-bold uppercase tracking-[0.18em] text-primary/80 dark:text-blue-200/80 sm:hidden">
                            Próximo culto
                          </span>
                          <span className="text-3xl font-black leading-none sm:text-4xl md:text-5xl">
                            {formatEventDayNumber(highlightedService.event_date)}
                          </span>
                          <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary/70 dark:text-blue-200/75 sm:text-[11px] md:text-xs">
                            {formatEventShortMonth(highlightedService.event_date)}
                          </span>
                        </div>

                        <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-sm bg-primary/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-primary dark:bg-primary/15 dark:text-blue-200 md:text-[10px]">
                            {highlightedServiceRelativeLabel
                              ? `Próximo evento · ${highlightedServiceRelativeLabel}`
                              : 'Próximo evento'}
                          </span>
                        </div>
                        <h3 className="text-lg font-black leading-tight text-foreground sm:text-xl md:text-3xl">
                          {highlightedService.title}
                        </h3>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                          {highlightedServiceDescription || 'Uma noite dedicada ao louvor e à palavra transformadora.'}
                        </p>
                        <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground sm:flex sm:flex-wrap sm:items-center sm:gap-x-8 md:text-xs">
                          <p className="inline-flex min-h-[4.25rem] items-center gap-2 rounded-lg bg-muted/35 p-3 dark:bg-primary/10 sm:min-h-0 sm:bg-transparent sm:p-0 sm:dark:bg-transparent">
                            <Calendar className="h-3.5 w-3.5 shrink-0 text-primary md:h-5 md:w-5" />
                            <span className="min-w-0 leading-none">
                              <span className="block leading-none">Dia</span>
                              <span className="mt-1.5 block whitespace-nowrap text-[13px] font-black leading-tight normal-case tracking-normal text-foreground md:text-base">
                                {formatWeekDay(highlightedService.event_date)}
                              </span>
                            </span>
                          </p>
                          <p className="inline-flex min-h-[4.25rem] items-center gap-2 rounded-lg bg-muted/35 p-3 dark:bg-primary/10 sm:min-h-0 sm:bg-transparent sm:p-0 sm:dark:bg-transparent">
                            <Clock className="h-3.5 w-3.5 shrink-0 text-primary md:h-5 md:w-5" />
                            <span className="min-w-0 leading-none">
                              <span className="block leading-none">Horário</span>
                              <span className="mt-1.5 block whitespace-nowrap text-[13px] font-black leading-tight normal-case tracking-normal text-foreground md:text-base">
                                {formatEventTime(highlightedService.event_time)}
                              </span>
                            </span>
                          </p>
                          {highlightedService.location && (
                            <p className="col-span-2 mt-1.5 inline-flex min-w-0 items-start gap-1.5 text-xs font-medium normal-case tracking-normal text-muted-foreground sm:mt-0 sm:basis-full md:text-sm">
                              <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary md:h-4 md:w-4" />
                              <span className="min-w-0 [overflow-wrap:anywhere]">
                                <span className="block font-semibold text-foreground/85 dark:text-slate-200">
                                  {highlightedServiceLocationParts.primary}
                                </span>
                                {highlightedServiceLocationParts.secondary && (
                                  <span className="block text-muted-foreground">
                                    {highlightedServiceLocationParts.secondary}
                                  </span>
                                )}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                      </div>

                      <div className={`grid gap-2 md:w-44 md:grid-cols-1 md:gap-3 ${highlightedServiceLocation ? "grid-cols-2" : "grid-cols-1"}`}>
                        {highlightedServiceLocation && (
                          <a
                            href={highlightedServiceLocation.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-[11px] font-bold text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md md:min-h-11 md:gap-2 md:px-5 md:py-3 md:text-sm"
                          >
                            <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            Ver Rota
                          </a>
                        )}
                        <Link
                          to="/calendario"
                          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2.5 text-[11px] font-bold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-sm dark:bg-slate-950/50 dark:hover:border-primary/50 md:min-h-11 md:gap-2 md:px-5 md:py-3 md:text-sm"
                        >
                          Agenda Completa
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {agendaDays.length > 0 ? (
                <>
                <div className="space-y-4 p-4 md:hidden">
                  {mobileAgendaDays.map((day) => (
                    <div key={day.date} className="rounded-2xl border border-border bg-background p-4 shadow-sm dark:border-border/70 dark:bg-slate-950/35">
                      <div className="mb-4 flex items-baseline justify-between gap-3 md:mb-8 md:block">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary md:mb-2 md:tracking-[0.22em]">
                          {day.label}
                        </p>
                        <p className="text-sm font-medium capitalize text-muted-foreground">
                          {day.dateLabel}
                        </p>
                      </div>

                      <div className="space-y-4 md:space-y-6">
                        {day.events.map((event, eventIndex) => {
                          const churchLocation = getChurchLocation(event.location);
                          const eventDescription = hasMeaningfulText(event.description)
                            ? event.description.trim()
                            : '';
                          const eventLocationParts = getLocationParts(event.location);

                          return (
                            <div
                              key={event.id}
                              className={`grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-4 rounded-xl border border-border/70 bg-muted/20 p-4 transition-all duration-200 hover:border-primary/25 hover:bg-primary/5 dark:bg-primary/5 dark:hover:border-primary/35 ${
                                eventIndex > 0 ? "" : ""
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-1 text-primary dark:bg-primary/15 dark:text-blue-200">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span className="text-xs font-bold uppercase tracking-[0.16em]">
                                    {formatEventTime(event.event_time)}
                                  </span>
                                </div>
                                <h3 className="text-sm font-bold leading-snug text-card-foreground md:text-base">
                                  {event.title}
                                </h3>
                                {event.location && (
                                  <p className="mt-3 inline-flex min-w-0 items-start gap-1.5 text-xs font-medium leading-relaxed text-muted-foreground">
                                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                    <span className="min-w-0 [overflow-wrap:anywhere]">
                                      <span className="block font-semibold text-foreground/85 dark:text-slate-200">
                                        {eventLocationParts.primary}
                                      </span>
                                      {eventLocationParts.secondary && (
                                        <span className="block text-muted-foreground">
                                          {eventLocationParts.secondary}
                                        </span>
                                      )}
                                    </span>
                                  </p>
                                )}
                                {eventDescription && (
                                  <p className="ml-5 mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                    {eventDescription}
                                  </p>
                                )}
                              </div>

                              <div
                                className={`col-span-2 mt-1 grid gap-2 ${
                                  churchLocation ? "grid-cols-2" : "grid-cols-1"
                                } md:col-span-1 md:flex md:flex-col`}
                              >
                                <Link
                                  to="/calendario"
                                  aria-label={`Ver ${event.title} no calendário`}
                                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border px-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary md:h-9 md:w-9 md:rounded-full md:px-0"
                                >
                                  <Calendar className="h-4 w-4" />
                                  <span className="md:hidden">Calendário</span>
                                </Link>
                                {churchLocation && (
                                  <a
                                    href={churchLocation.mapUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`Como chegar em ${event.location}`}
                                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-2 text-xs font-semibold text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-sm md:h-9 md:w-9 md:rounded-full md:px-0"
                                  >
                                    <MapPin className="h-4 w-4" />
                                    <span className="md:hidden">Rota</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {hiddenMobileAgendaEventsCount > 0 && (
                    <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-5 text-center">
                      <p className="text-sm font-semibold text-foreground">
                        Mais {hiddenMobileAgendaEventsCount}{' '}
                        {hiddenMobileAgendaEventsCount === 1 ? 'evento disponível' : 'eventos disponíveis'}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Consulte datas, horários e atualizações na agenda completa.
                      </p>
                      <Link
                        to="/calendario"
                        className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        Ver agenda completa
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  )}
                </div>

                <div className="hidden md:block">
                  {agendaDesktopRows.map((columnDays, columnIndex) => (
                    <div
                      key={`agenda-row-${columnIndex}`}
                      className={`grid md:grid-cols-2 xl:grid-cols-4 ${columnIndex > 0 ? "border-t border-border" : ""}`}
                    >
                      <div className="contents">
                        {columnDays.map((day, dayIndex) => (
                          <div key={`desktop-${day.date}`} className="border-border px-6 py-6 md:[&:not(:nth-child(2n))]:border-r xl:[&:not(:nth-child(4n))]:border-r">
                            <div className="mb-5">
                              <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">
                                {day.label}
                              </p>
                              <p className="text-sm font-medium capitalize text-muted-foreground">
                                {day.dateLabel}
                              </p>
                            </div>

                            <div className="space-y-5">
                              {day.events.map((event, eventIndex) => {
                                const churchLocation = getChurchLocation(event.location);

                                return (
                                  <div
                                    key={event.id}
                                    className={`grid grid-cols-[minmax(0,1fr)_auto] gap-4 ${
                                      eventIndex > 0 ? "border-t border-border pt-5" : ""
                                    }`}
                                  >
                                    <div className="min-w-0">
                                      <div className="mb-2 flex items-center gap-2 text-primary">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span className="text-xs font-bold uppercase tracking-[0.16em]">
                                          {formatEventTime(event.event_time)}
                                        </span>
                                      </div>
                                      <h3 className="text-base font-bold leading-snug text-card-foreground">
                                        {event.title}
                                      </h3>
                                      {event.location && (
                                        <p className="mt-1 line-clamp-2 text-sm font-medium text-muted-foreground">
                                          {event.location}
                                        </p>
                                      )}
                                      {event.description && (
                                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                                          {event.description}
                                        </p>
                                      )}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                      <Link
                                        to="/calendario"
                                        aria-label={`Ver ${event.title} no calendário`}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                                      >
                                        <Calendar className="h-4 w-4" />
                                      </Link>
                                      {churchLocation && (
                                        <a
                                          href={churchLocation.mapUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          aria-label={`Como chegar em ${event.location}`}
                                          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                                        >
                                          <MapPin className="h-4 w-4" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                        {columnIndex === agendaDesktopRows.length - 1 && columnDays.length < 4 && (
                          <div
                            className={
                              columnDays.length === 1
                                ? "border-border px-6 py-6 md:col-span-1 xl:col-span-3"
                                : columnDays.length === 2
                                  ? "border-border px-6 py-6 md:col-span-2 xl:col-span-2"
                                  : "border-border px-6 py-6 md:col-span-1 xl:col-span-1"
                            }
                          >
                            <div className="flex h-full min-h-[190px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/25 p-6 text-center">
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                                Agenda completa
                              </p>
                              <h3 className="mt-2 text-lg font-bold text-foreground">
                                Veja os próximos eventos
                              </h3>
                              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                                Acompanhe todos os cultos, encontros e atualizações no calendário.
                              </p>
                              <Link
                                to="/calendario"
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                              >
                                Calendário completo
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                </>
                ) : (
                  <div className="border-t border-border px-6 py-8">
                    <div className="mx-auto flex min-h-[190px] max-w-xl flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/25 p-6 text-center">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                        Agenda completa
                      </p>
                      <h3 className="mt-2 text-lg font-bold text-foreground">
                        Veja os próximos eventos
                      </h3>
                      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                        Acompanhe todos os cultos, encontros e atualizações no calendário.
                      </p>
                      <Link
                        to="/calendario"
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        Calendário completo
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                )}
                </>
              ) : (
                <div className="px-6 py-14 text-center">
                  <Calendar className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    Nenhum evento futuro cadastrado no momento.
                  </p>
                  <Link
                    to="/calendario"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Calendário completo
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </motion.div>

            <div className="mx-auto mt-6 flex max-w-7xl flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>
                Programação sujeita a alterações. Consulte o calendário para acompanhar as atualizações.
              </p>
              <Link to="/calendario" className="inline-flex items-center gap-2 font-semibold text-primary transition-colors hover:text-primary/80">
                Ver calendário completo <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* LOCALIZAÇÕES SECTION */}
        <section id="localizacoes" className="order-4 bg-[#f4f7fb] py-14 dark:bg-slate-950 md:py-24">
          <div className="section-container">
            <motion.div initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              duration: 0.6
            }} className="text-center mb-10 md:mb-16">
              <SectionHeading
                eyebrow="Onde estamos"
                title="Nossas"
                highlight="localizações"
                description="Conheça algumas de nossas congregações e encontre a mais próxima de você"
                align="center"
                titleClassName="text-3xl md:text-5xl"
              />
            </motion.div>

            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
                {featuredLocations.map((location, index) => <motion.div key={location.id} initial={{
                  opacity: 0,
                  y: 20
                }} whileInView={{
                  opacity: 1,
                  y: 0
                }} viewport={{
                  once: true
                }} transition={{
                  duration: 0.5,
                  delay: index * 0.1
                }} className="bg-card rounded-xl md:rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="h-44 md:h-52 overflow-hidden relative">
                    <img
                      src={location.image}
                      alt={location.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-foreground">
                        {location.city}, {location.state}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 md:p-6 flex flex-col flex-grow">
                    <h3 className="font-bold text-lg md:text-xl text-card-foreground mb-3">
                      {location.name}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-grow">
                      {location.address}
                    </p>
                    <a
                      href={location.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <MapPin className="w-4 h-4" />
                      Como chegar
                    </a>
                  </div>
                </motion.div>)}
              </div>
            </div>

            <div className="text-center mt-12">
              <Link to="/enderecos" className="inline-flex items-center gap-2 text-primary dark:text-white hover:text-primary/80 dark:hover:text-primary font-medium transition-colors">
                Ver todas as congregações <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default HomePage;
