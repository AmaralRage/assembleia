import React, { useEffect, useState } from 'react';
import { Helmet } from "react-helmet-async";
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight, MapPin, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import SectionHeading from '@/components/SectionHeading.jsx';
import { supabase } from '@/lib/supabase';
import { smoothScrollToElement } from '@/lib/smoothScroll';
import { churchLocations, getChurchLocation } from '@/data/churchLocations';
import { homeLeadershipCards } from '@/data/churchLeadership';
import { formatEventDate, formatEventTime, formatWeekDay, getTodayKey } from '@/lib/calendar';

const HomePage = () => {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  useEffect(() => {
    const loadUpcomingEvents = async () => {
      const todayKey = getTodayKey();

      const { data, error } = await supabase
        .from('calendar_events')
        .select('id, title, event_date, event_time, description, location')
        .gte('event_date', todayKey)
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true })
        .limit(8);

      if (!error) {
        setUpcomingEvents(data || []);
      }

      setIsLoadingEvents(false);
    };

    loadUpcomingEvents();
  }, []);

  const featuredLocations = churchLocations.slice(0, 3);
  const agendaDays = Object.values(
    upcomingEvents.reduce((days, event) => {
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

  return (
    <>
      <Helmet>
        <title>Assembleia de Deus - Bem-vindo à nossa comunidade de fé</title>
        <meta name="description" content="Junte-se à nossa comunidade de fé. Confira nossa agenda, conheça nossas congregações e nossa liderança." />
      </Helmet>

      <Header />

      <main className="flex flex-col">
        {/* HERO SECTION */}
        <section className="relative order-1 min-h-[92dvh] md:min-h-[100dvh] flex items-center justify-center overflow-hidden">
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
            }} className="flex flex-col items-center gap-6 md:gap-8">
              <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20 bg-white">
                <img src="https://i.imgur.com/SA53Yxc.png" alt="Logo da Assembleia de Deus" className="w-full h-full object-cover" />
              </div>

              <div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4" style={{
                  textWrap: 'balance'
                }}>
                  Assembleia de Deus da Lapa
                </h1>
                <p className="text-lg md:text-2xl text-white/90 font-light max-w-2xl mx-auto leading-relaxed">
                  Bem-vindo à nossa comunidade de fé
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-4 md:mt-8 w-full max-w-sm sm:max-w-none sm:w-auto">
              <motion.div initial={{
                opacity: 0
              }} animate={{
                opacity: 1
              }} transition={{
                delay: 0.5,
                duration: 0.8
              }} className="w-full sm:w-auto">
                <Link
                  to="/sou-novo"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-7 py-3.5 font-semibold text-primary-foreground shadow-lg transition-all duration-200 hover:bg-primary/90 hover:shadow-xl active:scale-[0.98] md:px-8 md:py-4 sm:w-auto"
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
                }} className="w-full sm:w-auto">
                <Link
                  to="/assistir"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/35 bg-white/10 px-7 py-3.5 md:px-8 md:py-4 font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 active:scale-[0.98] sm:w-auto"
                >
                  <Youtube className="h-5 w-5 transition-colors duration-200 group-hover:text-red-500" />
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
                }} className="px-7 py-3.5 md:px-8 md:py-4 bg-white hover:bg-white/90 text-primary font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg hover:shadow-xl w-full sm:w-auto text-center">
                  Ver agenda
                </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

        {/* LIDERANÇA SECTION */}
        <section id="sobre" className="order-4 py-14 md:py-24 bg-background">
          <div className="section-container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-10 md:mb-16"
            >
              <SectionHeading
                eyebrow="Nossa igreja"
                title="Liderança e"
                highlight="memória"
                description="Conheça pessoas que fazem parte da caminhada e da história da nossa comunidade"
                align="center"
                titleClassName="text-3xl md:text-5xl"
              />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 md:gap-8 max-w-7xl mx-auto">
              {homeLeadershipCards.map((lider) => (
                <motion.div
                  key={lider.nome}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{
                    y: -8,
                    scale: 1.03
                  }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.2 }}
                  className="bg-card border border-border rounded-xl md:rounded-2xl overflow-hidden shadow-md"
                >
                  <img
                    src={lider.foto}
                    alt={lider.nome}
                    loading="lazy"
                    className={`w-full h-64 md:h-72 ${
                      lider.fotoPlaceholder
                        ? "bg-muted object-contain p-8"
                        : "object-cover"
                    }`}
                  />

                  <div className="p-5 md:p-6">
                    <p className="inline-block bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full mb-3">
                      {lider.cargo}
                    </p>

                    <h3 className="text-foreground text-xl md:text-2xl font-bold mb-3">
                      {lider.nome}
                    </h3>

                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {lider.descricao}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* AGENDA SECTION */}
        <section id="agenda" className="order-2 py-14 md:py-24 bg-background">
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
              ) : agendaDays.length > 0 ? (
                <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
                  {agendaDays.map((day, dayIndex) => (
                    <div key={day.date} className="min-h-[300px] p-5 md:p-6">
                      <div className="mb-8">
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">
                          {day.label}
                        </p>
                        <p className="text-sm font-medium capitalize text-muted-foreground">
                          {day.dateLabel}
                        </p>
                      </div>

                      <div className="space-y-6">
                        {day.events.map((event, eventIndex) => {
                          const churchLocation = getChurchLocation(event.location);

                          return (
                            <motion.div
                              key={event.id}
                              initial={{ opacity: 0, y: 16 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.35, delay: (dayIndex + eventIndex) * 0.05 }}
                              className="grid grid-cols-[minmax(0,1fr)_auto] gap-4"
                            >
                              <div>
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
                                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
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
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-14 text-center">
                  <Calendar className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    Nenhum evento futuro cadastrado no momento.
                  </p>
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
        <section id="localizacoes" className="order-3 py-14 md:py-24 bg-muted">
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
