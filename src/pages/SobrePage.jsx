import React, { useEffect, useState } from "react";
import { MotionConfig, motion } from "framer-motion";
import { BookOpen, ChevronDown, Church, Facebook, Globe2, Heart, Instagram, X } from "lucide-react";
import Header from "@/components/Header.jsx";
import Footer from "@/components/Footer.jsx";
import SectionHeading from "@/components/SectionHeading.jsx";
import { exPresidentes, presidenteAtual } from "@/data/churchLeadership";
import { useModalFocus } from "@/hooks/use-modal-focus";
import { smoothScrollToElement } from "@/lib/smoothScroll";

const getMandateStartYear = (periodo) => periodo.split("-")[0].trim();

const renderHighlightedBiographyText = (text, highlights = []) => {
  if (!highlights.length) return text;

  const escapedHighlights = highlights.map((highlight) =>
    highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  const highlightPattern = new RegExp(`(${escapedHighlights.join("|")})`, "g");

  return text.split(highlightPattern).map((part, index) =>
    highlights.includes(part) ? (
      <strong key={`${part}-${index}`} className="font-bold text-slate-800">
        {part}
      </strong>
    ) : part,
  );
};

const SobrePage = () => {
  const [selectedHistoryPresident, setSelectedHistoryPresident] = useState(null);
  const [showFullLeadership, setShowFullLeadership] = useState(false);
  const historyModalRef = useModalFocus(Boolean(selectedHistoryPresident));

  const historyPresidentCardsSource = [
    presidenteAtual,
    exPresidentes[5],
    exPresidentes[4],
    exPresidentes[2],
    exPresidentes[3],
    exPresidentes[1],
    exPresidentes[0],
  ];

  const historyPresidentCards = historyPresidentCardsSource.map((president, index) => {
    const cardDetails = [
      {
        label: "Presidência atual",
        summary:
          "Preserva a história da igreja enquanto conduz novos passos de comunhão e serviço.",
      },
      {
        label: "Antecessor da gestão atual",
        summary:
          "Presidiu a Assembleia de Deus da Lapa durante o período de 2010 a 2018.",
      },
      {
        label: "Nova etapa",
        summary:
          "Presidiu a Assembleia de Deus da Lapa durante o período de 2006 a 2010.",
      },
      {
        label: "Continuidade",
        summary:
          "Deu continuidade à história da igreja durante sua presidência, entre 1974 e 1980.",
      },
      {
        label: "26 anos de liderança",
        summary:
          "Conduziu a Assembleia de Deus da Lapa durante o período de 1980 a 2006.",
      },
      {
        label: "Emancipação",
        summary:
          "Foi o primeiro presidente após a emancipação e conduziu a igreja de 1959 a 1974.",
      },
      {
        label: "Presidente fundador",
        summary:
          "Liderou o período de fundação da igreja até a emancipação ocorrida em 1959.",
      },
    ];

    return {
      ...president,
      title: president.nome,
      ...cardDetails[index],
    };
  });

  useEffect(() => {
    if (!selectedHistoryPresident) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSelectedHistoryPresident(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedHistoryPresident]);

  const handleSectionNavigation = (event, href) => {
    event.preventDefault();

    const target = document.querySelector(href);
    if (!target) return;

    window.history.replaceState(window.history.state, "", href);
    smoothScrollToElement(target, { offset: 80 });
  };

  return (
    <MotionConfig reducedMotion="user">
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">
      <Header />

      <main className="min-w-0 w-full max-w-full overflow-x-hidden">
        <section className="bg-background pb-10 pt-24 md:pb-24 md:pt-32">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid min-w-0 grid-cols-1 items-center gap-6 md:gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-12">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="min-w-0 rounded-xl md:rounded-3xl overflow-hidden shadow-xl border border-border"
              >
                <img
                  src="https://lh5.googleusercontent.com/p/AF1QipNzF-PyrzUoPL4X3E26Y-6AJVsKusMgypL1cRvz=w650-h486-k-no"
                  alt="Foto da igreja"
                  className="h-60 w-full object-cover sm:h-80 md:h-96 lg:h-[520px]"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="min-w-0"
              >
                <SectionHeading
                  eyebrow="Nossa história"
                  title="Sobre a"
                  highlight="Igreja"
                  as="h1"
                  titleClassName="text-3xl md:text-5xl"
                />

                <p className="mb-4 mt-4 text-base leading-relaxed text-muted-foreground dark:text-slate-300 md:mb-5 md:mt-6 md:text-lg">
                  A Assembleia de Deus na Lapa é uma comunidade cristã dedicada à
                  adoração, ao ensino da Palavra de Deus e ao acolhimento de famílias.
                  Nossa missão é anunciar o evangelho, cuidar de vidas e fortalecer a fé
                  de cada membro.
                </p>

                <p className="text-base md:text-lg text-muted-foreground dark:text-slate-300 leading-relaxed">
                  Desde seu período de fundação, a igreja reúne pessoas em um ambiente
                  de fé, comunhão e serviço. Em 1959 ocorreu sua emancipação, iniciando
                  uma nova etapa de sua história sem perder o compromisso com Deus e
                  com a comunidade local.
                </p>
              </motion.div>
            </div>

            <nav
              aria-label="Navegação desta página"
              className="-mx-2 mt-5 flex gap-2 overflow-x-auto px-2 py-2 md:mt-8 md:flex-wrap"
            >
              {[
                ["#historia", "História"],
                ["#lideranca", "Liderança"],
                ["#biografias", "Biografias"],
              ].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  onClick={(event) => handleSectionNavigation(event, href)}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/5 px-5 text-sm font-semibold text-primary transition-colors hover:border-primary/50 hover:bg-primary/10"
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </section>

        <section id="historia" className="scroll-mt-20 border-y border-border bg-[#e8eef5] py-11 dark:bg-muted md:py-24">
          <div className="mx-auto max-w-[960px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-7 max-w-3xl md:mb-10"
            >
              <SectionHeading
                title="Nossa história em"
                highlight="movimento"
                description="Uma jornada de fé, serviço e comunidade que moldou quem somos hoje."
                titleClassName="text-4xl md:text-5xl"
                descriptionClassName="max-w-lg text-slate-700 dark:text-slate-300"
              />
            </motion.div>

            <div id="biografias" className="grid scroll-mt-20 gap-3 lg:grid-cols-[2fr_1fr]">
              <div className="grid gap-3 lg:grid-rows-[280px_190px]">
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.018, y: -4 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  onClick={() => setSelectedHistoryPresident(historyPresidentCards[0])}
                  className="group relative flex min-h-[220px] transform-gpu overflow-hidden rounded-[1.5rem] border-[3px] border-[#c3d3e4] bg-[#101c40] p-5 text-left text-white shadow-sm transition-all duration-500 ease-out hover:z-10 hover:-translate-y-1 hover:scale-[1.015] hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:min-h-[240px] sm:rounded-[1.75rem] sm:p-6 lg:min-h-0"
                >
                  <span className="absolute -bottom-7 right-0 text-[8.2rem] font-extrabold leading-none text-white/[0.045]">
                    {getMandateStartYear(historyPresidentCards[0].periodo)}
                  </span>
                  <span className="pointer-events-none absolute -right-12 top-8 z-0 h-36 w-36 rounded-full border border-white/10 bg-white/[0.035]" />
                  <Church className="pointer-events-none absolute right-10 top-12 z-0 h-14 w-14 text-white/[0.07]" />
                  <span className="pointer-events-none absolute bottom-10 right-36 z-0 h-10 w-10 rounded-full bg-primary/10" />
                  <div className="relative z-10 flex max-w-xl flex-col justify-center">
                    <span className="mb-6 inline-flex w-fit rounded-full bg-[#4e8fc4] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white">
                      {historyPresidentCards[0].label}
                    </span>
                    <h2 className="text-2xl font-bold leading-tight sm:text-3xl">
                      {historyPresidentCards[0].title}
                    </h2>
                    <p className="mt-4 max-w-[520px] text-sm leading-relaxed text-white/85 sm:text-base">
                      {historyPresidentCards[0].summary}
                    </p>
                    <span className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-blue-200 transition-all duration-200 sm:mt-8 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-visible:translate-y-0 sm:group-focus-visible:opacity-100">
                      Ler biografia →
                    </span>
                  </div>
                </motion.button>

                <div className="grid gap-3 md:grid-cols-2">
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, y: 22 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.018, y: -4 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.16, delay: 0.18, ease: "easeOut" }}
                    onClick={() => setSelectedHistoryPresident(historyPresidentCards[3])}
                    className="group relative flex min-h-[190px] transform-gpu flex-col justify-center overflow-hidden rounded-[1.35rem] bg-[#4178aa] p-5 pb-14 pr-14 text-left text-white shadow-sm transition-all duration-500 ease-out hover:z-10 hover:-translate-y-1 hover:scale-[1.015] hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <span className="pointer-events-none absolute -bottom-12 -right-10 z-0 h-28 w-28 rounded-full bg-white/10" />
                    <span className="pointer-events-none absolute -bottom-5 right-16 z-0 h-12 w-12 rounded-full border border-white/15" />
                    <Church className="pointer-events-none absolute bottom-5 right-5 z-0 h-9 w-9 text-white/10" />
                    <div className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white sm:h-12 sm:w-12">
                      <Globe2 className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-100">
                      {getMandateStartYear(historyPresidentCards[3].periodo)}
                    </p>
                    <h3 className="max-w-[210px] text-lg font-bold leading-tight sm:text-xl">
                      {historyPresidentCards[3].title}
                    </h3>
                    <p className="mt-2 max-w-[220px] text-xs leading-snug text-white/80 sm:text-[13px]">
                      {historyPresidentCards[3].summary}
                    </p>
                    <span className="absolute bottom-5 left-5 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100 transition-all duration-200 sm:left-6 sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-visible:translate-y-0 sm:group-focus-visible:opacity-100">
                      Ler biografia →
                    </span>
                  </motion.button>

                  <motion.button
                    type="button"
                    initial={{ opacity: 0, y: 22 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.018, y: -4 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.16, delay: 0.24, ease: "easeOut" }}
                    onClick={() => setSelectedHistoryPresident(historyPresidentCards[4])}
                    className="group relative flex min-h-[190px] transform-gpu flex-col justify-center overflow-hidden rounded-[1.35rem] bg-[#17345f] p-5 pb-14 text-left text-white shadow-sm transition-all duration-500 ease-out hover:z-10 hover:-translate-y-1 hover:scale-[1.015] hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <span className="pointer-events-none absolute -bottom-14 -right-12 h-32 w-32 rounded-full bg-white/[0.055]" />
                    <span className="pointer-events-none absolute right-8 top-6 h-10 w-10 rounded-full border border-white/10" />
                    <Church className="pointer-events-none absolute bottom-7 right-8 h-10 w-10 text-white/[0.08]" />
                    <span className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#4e8fc4]" />
                      {historyPresidentCards[4].label}
                    </span>
                    <h3 className="text-lg font-bold uppercase leading-tight sm:text-xl">
                      {historyPresidentCards[4].title}
                    </h3>
                    <p className="mt-2 max-w-[260px] text-xs leading-snug text-white/65 sm:text-[13px]">
                      {historyPresidentCards[4].summary}
                    </p>
                    <span className="absolute bottom-5 left-5 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200 transition-all duration-200 sm:left-6 sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-visible:translate-y-0 sm:group-focus-visible:opacity-100">
                      Ler biografia →
                    </span>
                  </motion.button>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-rows-[190px_280px]">
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.018, y: -4 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.16, delay: 0.08, ease: "easeOut" }}
                  onClick={() => setSelectedHistoryPresident(historyPresidentCards[1])}
                  className="group relative flex min-h-[190px] transform-gpu flex-col justify-center overflow-hidden rounded-[1.35rem] bg-[#254870] p-5 pb-14 pr-14 text-left text-white shadow-sm transition-all duration-500 ease-out hover:z-10 hover:-translate-y-1 hover:scale-[1.015] hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <span className="pointer-events-none absolute -right-10 -top-10 z-0 h-28 w-28 rounded-full bg-white/[0.055]" />
                  <span className="pointer-events-none absolute -bottom-9 left-8 z-0 h-20 w-20 rounded-full border border-white/10" />
                  <Church className="pointer-events-none absolute bottom-5 right-6 z-0 h-9 w-9 text-white/[0.08]" />
                  <div className="absolute right-5 top-5 z-10 text-[#4e8fc4]">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <div className="relative z-10">
                    <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-200">
                      {getMandateStartYear(historyPresidentCards[1].periodo)}
                    </p>
                    <h3 className="max-w-[190px] text-base font-bold uppercase leading-tight sm:text-lg">
                      {historyPresidentCards[1].title}
                    </h3>
                    <p className="mt-2 max-w-[220px] text-xs leading-snug text-white/75">
                      {historyPresidentCards[1].summary}
                    </p>
                  </div>
                  <span className="absolute bottom-5 left-5 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200 transition-all duration-200 sm:left-6 sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-visible:translate-y-0 sm:group-focus-visible:opacity-100">
                    Ler biografia →
                  </span>
                </motion.button>

                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.018, y: -4 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.16, delay: 0.14, ease: "easeOut" }}
                  onClick={() => setSelectedHistoryPresident(historyPresidentCards[2])}
                  className="group relative flex min-h-[220px] transform-gpu flex-col justify-between overflow-hidden rounded-[1.35rem] border border-border/70 bg-white p-5 text-left text-slate-950 shadow-sm transition-all duration-500 ease-out hover:z-10 hover:-translate-y-1 hover:scale-[1.015] hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:min-h-[240px] sm:p-6 lg:min-h-[280px]"
                >
                  <Heart className="h-10 w-10 text-[#2f6fa9]" />
                  <div>
                    <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-[#2f6fa9]">
                      {getMandateStartYear(historyPresidentCards[2].periodo)}
                    </p>
                    <h3 className="text-xl font-bold leading-tight sm:text-2xl">
                      {historyPresidentCards[2].title}
                    </h3>
                    <p className="mt-4 text-sm leading-relaxed text-slate-700">
                      {historyPresidentCards[2].summary}
                    </p>
                    <span className="mt-5 inline-block text-[10px] font-bold uppercase tracking-[0.18em] text-[#2f6fa9] transition-all duration-200 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-visible:translate-y-0 sm:group-focus-visible:opacity-100">
                      Ler biografia →
                    </span>
                  </div>
                  <span className="absolute -bottom-16 -right-12 h-36 w-36 rounded-full bg-[#d8e6f3]/80" />
                  <Church className="pointer-events-none absolute bottom-8 right-8 h-12 w-12 text-[#2f6fa9]/14" />
                </motion.button>
              </div>
            </div>

            {historyPresidentCards.length > 5 && (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {historyPresidentCards.slice(5).map((president, index) => (
                  <motion.button
                    key={president.nome}
                    type="button"
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.012, y: -3 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.16, delay: index * 0.05, ease: "easeOut" }}
                    onClick={() => setSelectedHistoryPresident(president)}
                    className={`group relative flex w-full transform-gpu items-center overflow-hidden rounded-[1.35rem] border-2 p-5 text-left text-white shadow-sm transition-shadow hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:p-6 ${
                      index === 0
                        ? "border-[#7fb0d2] bg-[#315f89]"
                        : "border-[#6f9fc5] bg-[#243f5f]"
                    }`}
                  >
                    <span className={`pointer-events-none absolute h-48 w-48 rounded-full border ${
                      index === 0
                        ? "-right-8 -top-16 border-white/15 bg-[#69a4c9]/10"
                        : "-bottom-20 -right-5 border-[#78b1d5]/25 bg-[#78b1d5]/[0.07]"
                    }`} />
                    <Church className={`pointer-events-none absolute h-14 w-14 text-white/[0.08] ${
                      index === 0
                        ? "right-8 top-1/2 -translate-y-1/2"
                        : "bottom-7 right-9"
                    }`} />
                    <div className="relative z-10 max-w-xl pr-12">
                      <span className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                        index === 0
                          ? "bg-[#78b1d5] text-[#10243d]"
                          : "bg-[#5b9bd5] text-white"
                      }`}>
                        {president.label}
                      </span>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-200">{president.periodo}</p>
                      <h3 className="mt-2 text-xl font-bold sm:text-2xl">{president.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-white/75">{president.summary}</p>
                      <span className="mt-5 inline-block text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200 transition-all duration-200 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-visible:translate-y-0 sm:group-focus-visible:opacity-100">
                        Ler biografia →
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="lideranca" className="scroll-mt-20 bg-background py-10 md:py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.25fr] gap-7 md:gap-10 lg:gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative overflow-hidden rounded-2xl border border-border bg-background shadow-lg md:rounded-3xl md:shadow-xl"
              >
                <img
                  src={presidenteAtual.foto}
                  alt={presidenteAtual.nome}
                  loading="lazy"
                  className="h-[300px] w-full object-cover object-[50%_28%] sm:h-auto sm:aspect-[5/4] lg:aspect-auto lg:h-[580px]"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-flex items-center gap-2 md:gap-3 border border-primary/60 bg-primary/10 text-primary dark:text-white text-[11px] md:text-sm font-bold uppercase tracking-[0.14em] md:tracking-[0.2em] px-3.5 md:px-6 py-2 md:py-3 rounded-full mb-4 md:mb-7 shadow-sm">
                  <Church className="w-4 h-4 md:w-5 md:h-5" />
                  Liderança atual
                </span>

                <SectionHeading
                  eyebrow="Presidência"
                  title={presidenteAtual.nome.split(" ").slice(0, -1).join(" ")}
                  highlight={presidenteAtual.nome.split(" ").slice(-1).join(" ")}
                  titleClassName="text-3xl sm:text-4xl md:text-5xl"
                  eyebrowClassName="mb-3"
                />

                <p className="text-xs md:text-sm font-semibold uppercase tracking-wider text-primary dark:text-white mb-4 md:mb-7">
                  Presidente · {presidenteAtual.periodo}
                </p>

                <p className="text-base sm:text-lg md:text-2xl text-foreground font-medium italic leading-relaxed border-l-4 border-primary pl-4 md:pl-5 mb-5 md:mb-8">
                  “Servir com fé, cuidado e compromisso com cada vida.”
                </p>

                <p className="text-base md:text-lg text-muted-foreground dark:text-slate-300 leading-relaxed">
                  {presidenteAtual.resumo}
                </p>

                <button
                  type="button"
                  onClick={() => setShowFullLeadership((current) => !current)}
                  aria-expanded={showFullLeadership}
                  aria-controls="leadership-biography"
                  className="mt-5 inline-flex min-h-11 w-full items-center justify-between rounded-xl border border-primary/25 bg-primary/5 px-4 text-sm font-semibold text-primary md:hidden"
                >
                  {showFullLeadership ? "Ocultar trajetória" : "Conheça a trajetória"}
                  <ChevronDown className={`h-4 w-4 transition-transform ${showFullLeadership ? "rotate-180" : ""}`} />
                </button>

                <div
                  id="leadership-biography"
                  className={`${showFullLeadership ? "block" : "hidden"} mt-4 space-y-4 text-base leading-relaxed text-muted-foreground dark:text-slate-300 md:mt-6 md:block md:space-y-5 md:text-lg`}
                >
                  <p>{presidenteAtual.historia}</p>
                  {presidenteAtual.atuacao && <p>{presidenteAtual.atuacao}</p>}
                </div>

                <div className="mt-7 md:mt-10 pt-5 md:pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground dark:text-slate-400">
                    Assembleia de Deus na Lapa
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

      </main>

      {selectedHistoryPresident && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="history-president-title"
          aria-describedby="history-president-description"
          onClick={() => setSelectedHistoryPresident(null)}
        >
          <motion.div
            ref={historyModalRef}
            tabIndex={-1}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl sm:max-h-[90vh]"
          >
            <div className="relative bg-[#071526] px-5 pb-6 pt-8 text-white sm:px-6 sm:pb-8 sm:pt-10 md:px-9">
              <button
                type="button"
                onClick={() => setSelectedHistoryPresident(null)}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/45 bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-5 sm:top-5 sm:h-10 sm:w-10"
                aria-label="Fechar biografia"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="grid gap-4 pr-10 sm:gap-6 md:grid-cols-[150px_minmax(0,1fr)] md:items-center md:pr-0">
                <img
                  src={selectedHistoryPresident.foto}
                  alt={selectedHistoryPresident.nome}
                  loading="eager"
                  decoding="async"
                  className={`h-24 w-24 rounded-full border-4 border-white shadow-xl sm:h-28 sm:w-28 md:h-32 md:w-32 ${
                    selectedHistoryPresident.fotoPlaceholder
                      ? "bg-white object-contain p-3"
                      : "object-cover object-top"
                  }`}
                />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-200 sm:text-xs sm:tracking-[0.32em]">
                    Período de mandato
                  </p>
                  <span className="mt-2 inline-flex rounded-full border border-primary/60 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary sm:mt-3 sm:px-4 sm:py-2 sm:text-sm">
                    {selectedHistoryPresident.periodo}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative px-5 py-6 sm:px-6 sm:py-8 md:px-9 md:py-10">
              <h2
                id="history-president-title"
                className="text-2xl font-bold leading-tight text-slate-950 sm:text-3xl md:text-4xl"
              >
                {selectedHistoryPresident.nome}
              </h2>
              <p id="history-president-description" className="mt-2 text-sm font-semibold text-slate-500">
                {selectedHistoryPresident.periodo.includes("Atual")
                  ? "Presidente atual"
                  : "Ex-presidente"}
              </p>
              <div className="relative mt-6 grid gap-6 md:mt-7 md:grid-cols-[1fr_0.85fr] md:gap-8">
                <span className="pointer-events-none absolute -bottom-4 right-0 z-0 text-[5.5rem] font-extrabold leading-none text-slate-950/[0.04] sm:-bottom-8 sm:text-[8rem] md:-bottom-10 md:text-[10rem]">
                  {getMandateStartYear(selectedHistoryPresident.periodo)}
                </span>
                <div className="relative z-10">
                  <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    Biografia
                  </p>
                  <div className="space-y-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                    {(selectedHistoryPresident.biografia || [
                      selectedHistoryPresident.historia || selectedHistoryPresident.resumo,
                    ]).map((paragrafo) => (
                      <p key={paragrafo}>
                        {renderHighlightedBiographyText(
                          paragrafo,
                          selectedHistoryPresident.biografiaDestaques,
                        )}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="relative z-10">
                  <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    Informações
                  </p>
                  <ul className="space-y-2.5 text-sm font-medium text-slate-600 sm:space-y-3">
                    <li className="flex gap-3">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Mandato iniciado em {getMandateStartYear(selectedHistoryPresident.periodo)}
                    </li>
                    {(selectedHistoryPresident.destaques || [
                      selectedHistoryPresident.resumo,
                    ]).map((destaque) => (
                      <li key={destaque} className="flex gap-3">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {destaque}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div
                className={`mt-6 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center md:mt-8 ${
                  selectedHistoryPresident.instagram || selectedHistoryPresident.facebook
                    ? "sm:justify-between"
                    : "sm:justify-end"
                }`}
              >
                {(selectedHistoryPresident.instagram || selectedHistoryPresident.facebook) && (
                <div className="flex items-center gap-2">
                  {selectedHistoryPresident.instagram && (
                    <a
                      href={selectedHistoryPresident.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Instagram de ${selectedHistoryPresident.nome}`}
                      title="Instagram"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                  {selectedHistoryPresident.facebook && (
                    <a
                      href={selectedHistoryPresident.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Facebook de ${selectedHistoryPresident.nome}`}
                      title="Facebook"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                    >
                      <Facebook className="h-5 w-5" />
                    </a>
                  )}
                </div>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedHistoryPresident(null)}
                  className="inline-flex w-full justify-center rounded-full bg-[#071526] px-7 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-slate-800 sm:w-auto"
                >
                  Fechar registro
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
    </MotionConfig>
  );
};

export default SobrePage;
