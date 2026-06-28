import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  Clock,
  MapPin,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import SectionHeading from '@/components/SectionHeading.jsx';
import { getChurchLocation, mainChurchLocation } from '@/data/churchLocations';
import { supabase } from '@/lib/supabase';
import { formatEventDate, formatEventTime, formatWeekDay, getTodayKey } from '@/lib/calendar';

const worshipSteps = [
  {
    title: 'Chegada',
    description:
      'Você será recebido com acolhimento e poderá se sentar com tranquilidade.',
  },
  {
    title: 'Louvor',
    description:
      'O culto tem momentos de adoração, oração e cânticos junto com a igreja.',
  },
  {
    title: 'Pregação',
    description:
      'Ouvimos a Palavra de Deus com uma mensagem bíblica para a vida diária.',
  },
  {
    title: 'Comunhão',
    description:
      'Depois do culto, há espaço para conversar, conhecer pessoas e ser orientado.',
  },
];

const faqs = [
  {
    question: 'Preciso ser membro para participar?',
    answer:
      'Não. Você pode visitar, participar dos cultos e conhecer nossa comunidade mesmo sem ser membro.',
  },
  {
    question: 'Como devo me vestir?',
    answer:
      'Venha com uma roupa confortável e respeitosa. O mais importante é a sua presença.',
  },
  {
    question: 'Posso ir sozinho?',
    answer:
      'Pode sim. Se quiser, procure alguém da recepção ou liderança ao chegar para receber orientação.',
  },
  {
    question: 'Tenho filhos. Posso levá-los?',
    answer:
      'Sim. Crianças são bem-vindas nos cultos e na vida da igreja junto com suas famílias.',
  },
];

const NewHerePage = () => {
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

  const agendaDays = Object.values(
    upcomingEvents.reduce((days, event) => {
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

  return (
    <>
      <Helmet>
        <title>Sou novo por aqui - Assembleia de Deus da Lapa</title>
        <meta
          name="description"
          content="Seja bem-vindo à Assembleia de Deus da Lapa. Saiba como visitar nossa igreja, chegar até nós e participar dos cultos."
        />
      </Helmet>

      <Header />

      <main>
        <section className="relative overflow-hidden bg-slate-950 pt-28 pb-14 md:pt-32 md:pb-20">
          <div className="section-container">
            <div className="mx-auto max-w-3xl">
              <SectionHeading
                eyebrow="Bem-vindo"
                title="Sou novo"
                highlight="por aqui"
                as="h1"
                eyebrowClassName="text-white/70"
                titleClassName="text-4xl text-white sm:text-5xl md:text-6xl"
              />
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 md:text-lg">
                Seja muito bem-vindo! Estamos felizes que você está conhecendo a
                Assembleia de Deus da Lapa.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/#agenda"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition-all duration-200 hover:scale-105 hover:bg-primary/90 hover:shadow-xl active:scale-95"
                >
                  Entrar em contato
                </Link>
                <a
                  href={mainChurchLocation.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-transparent px-7 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-white/10 active:scale-95"
                >
                  Como chegar
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-background py-16 md:py-20">
          <div className="section-container">
            <div className="mx-auto grid max-w-6xl items-center gap-11 md:grid-cols-2 lg:gap-14">
              <div className="max-w-[520px]">
                <SectionHeading
                  eyebrow="Primeira visita"
                  title="Você é"
                  highlight="bem-vindo aqui!"
                  titleClassName="md:text-5xl"
                />
                <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                  <p>
                    Acreditamos que a fé é uma jornada que não deve ser percorrida
                    sozinho. Em nossa comunidade, você encontrará um lugar para
                    pertencer, ser acolhido e crescer no conhecimento de Deus.
                  </p>
                </div>

                <div className="mt-6 rounded-xl border border-border bg-card/70 p-5 shadow-sm">
                  <p className="text-base font-medium leading-relaxed text-foreground">
                    Nossos cultos acontecem às <strong className="text-primary">terças-feiras</strong> e às{' '}
                    <strong className="text-primary">quintas-feiras</strong>, sempre às 09:00 da manhã
                    e às 19:00 da noite.
                  </p>
                </div>

                <a
                  href={mainChurchLocation.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-7 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary transition-colors hover:text-primary/80"
                >
                  {mainChurchLocation.address}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              <div className="relative md:justify-self-end">
                <div className="absolute -inset-5 rounded-[2rem] bg-primary/10 blur-3xl" />
                <div className="relative h-[292px] w-full overflow-hidden rounded-xl border border-border shadow-2xl md:w-[520px]">
                  <img
                    src={mainChurchLocation.image}
                    alt={`Fachada da ${mainChurchLocation.name}`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />
                  <div className="absolute bottom-7 left-7 flex items-center gap-4">
                    <span className="h-px w-10 bg-primary" />
                    <span className="text-xs font-bold uppercase tracking-[0.32em] text-white">
                      Nossa igreja
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-muted py-14 md:py-24">
          <div className="section-container">
            <div className="mx-auto mb-10 max-w-3xl text-center md:mb-14">
              <SectionHeading
                eyebrow="Sua primeira vez"
                title="O que esperar"
                highlight="no culto"
                description="Um passo a passo de como é participar conosco"
                align="center"
                titleClassName="text-3xl md:text-5xl"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {worshipSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  whileHover={{ scale: 1.045, y: -6 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm transition-shadow duration-300 hover:shadow-xl"
                >
                  <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-bold text-card-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="mx-auto mt-8 max-w-5xl rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center shadow-sm">
              <p className="text-base font-semibold text-foreground">
                Durante o culto, crianças e famílias são bem-vindas para participar conosco.
              </p>
              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  to="/calendario"
                  className="inline-flex items-center justify-center rounded-xl border border-primary/30 px-5 py-2.5 text-sm font-semibold text-primary transition-all duration-200 hover:scale-105 hover:bg-primary/10 active:scale-95"
                >
                  Ver próximos cultos
                </Link>
                <Link
                  to="/enderecos"
                  className="inline-flex items-center justify-center rounded-xl border border-primary/30 px-5 py-2.5 text-sm font-semibold text-primary transition-all duration-200 hover:scale-105 hover:bg-primary/10 active:scale-95"
                >
                  Como chegar
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-background py-14 md:py-24">
          <div className="section-container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mx-auto mb-10 max-w-7xl md:mb-14"
            >
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl md:rounded-3xl"
            >
              <div className="flex flex-col gap-4 border-b border-border bg-muted/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-7">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_0_5px_hsl(var(--primary)/0.12)]" />
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-foreground">
                    Programação semanal
                  </p>
                </div>
                <Link
                  to="/calendario"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:scale-105 hover:border-primary/40 hover:text-primary active:scale-95"
                >
                  <CalendarDays className="h-4 w-4" />
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
                              transition={{
                                duration: 0.35,
                                delay: (dayIndex + eventIndex) * 0.05,
                              }}
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
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-200 hover:scale-110 hover:border-primary/40 hover:bg-primary/10 hover:text-primary active:scale-95"
                                >
                                  <CalendarDays className="h-4 w-4" />
                                </Link>
                                {churchLocation && (
                                  <a
                                    href={churchLocation.mapUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`Como chegar em ${event.location}`}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all duration-200 hover:scale-110 hover:bg-primary/90 active:scale-95"
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
                  <CalendarDays className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
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
              <Link
                to="/calendario"
                className="inline-flex items-center gap-2 font-semibold text-primary transition-all duration-200 hover:scale-105 hover:text-primary/80 active:scale-95"
              >
                Ver calendário completo <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-muted py-14 md:py-24">
          <div className="section-container">
            <div className="mx-auto mb-10 max-w-3xl text-center md:mb-14">
              <SectionHeading
                eyebrow="Dúvidas comuns"
                title="Perguntas"
                highlight="frequentes"
                align="center"
                titleClassName="text-3xl md:text-5xl"
              />
            </div>

            <div className="mx-auto max-w-4xl space-y-3">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-2xl border border-border bg-card p-5 shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-card-foreground">
                    {faq.question}
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-background py-14 md:py-24">
          <div className="section-container">
            <div className="overflow-hidden rounded-2xl bg-primary p-8 text-primary-foreground shadow-xl md:rounded-3xl md:p-12">
              <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <div>
                  <SectionHeading
                    eyebrow="Estamos esperando você"
                    title="Sua visita será"
                    highlight="uma alegria"
                    eyebrowClassName="text-white/70"
                    titleClassName="text-3xl text-primary-foreground md:text-5xl"
                    highlightClassName="bg-none text-white"
                  />
                  <p className="mt-4 max-w-2xl text-white/80">
                    Venha conhecer a Assembleia de Deus da Lapa e participar de um
                    culto conosco.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
                  <Link
                    to="/enderecos"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-primary transition-all duration-200 hover:scale-105 hover:bg-white/90 active:scale-95"
                  >
                    <MapPin className="h-5 w-5" />
                    Localizações
                  </Link>
                  <Link
                    to="/calendario"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/35 px-6 py-3 font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-white/10 active:scale-95"
                  >
                    <CalendarDays className="h-5 w-5" />
                    Ver calendário
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default NewHerePage;
