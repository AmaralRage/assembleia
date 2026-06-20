import React from "react";
import { motion } from "framer-motion";
import { Church, History } from "lucide-react";
import Header from "@/components/Header.jsx";
import Footer from "@/components/Footer.jsx";

const presidenteAtual = {
  nome: "Mariana Vasconcelos",
  periodo: "2020 - Atual",
  foto: "https://admin.cnnbrasil.com.br/wp-content/uploads/sites/12/2023/07/IMG_4005.jpg?w=419&h=283&crop=0",
  resumo:
    "Conduz a igreja em direção a novos tempos, fortalecendo a presença digital, os projetos sociais e o compromisso com a comunidade.",
  historia:
    "Sua trajetória na igreja foi construída por meio do serviço, do cuidado com as famílias e da dedicação aos diferentes ministérios. Ao longo dos anos, participou de momentos importantes da comunidade e contribuiu para aproximar a liderança de seus membros.",
  atuacao:
    "Hoje, à frente da presidência, busca preservar os valores e a história da Assembleia de Deus da Lapa enquanto incentiva novas formas de evangelização, comunhão e atuação social.",
};

const exPresidentes = [
  {
    nome: "Pastor Antônio Souza",
    periodo: "1998 - 2008",
    foto: "https://upload.wikimedia.org/wikipedia/pt/thumb/3/37/Saitama_One_Punch-Man.png/330px-Saitama_One_Punch-Man.png",
    resumo:
      "Foi um líder dedicado à expansão da igreja, fortalecendo os ministérios e a comunhão entre os membros.",
    historia:
      "Durante sua liderança, acompanhou os primeiros anos de crescimento da congregação e incentivou a participação das famílias nas atividades da igreja.",
  },
  {
    nome: "Pastor José Almeida",
    periodo: "2008 - 2016",
    foto: "https://images.unsplash.com/photo-1560250097-0b93528c311a",
    resumo:
      "Conduziu a igreja em um período de crescimento espiritual, valorizando o ensino bíblico e a evangelização.",
    historia:
      "Seu período foi marcado pelo fortalecimento dos estudos bíblicos e pela formação de novos líderes para servir aos diferentes ministérios.",
  },
  {
    nome: "Pastor Marcos Oliveira",
    periodo: "2016 - 2020",
    foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
    resumo:
      "Trabalhou na modernização da comunicação da igreja e no fortalecimento dos projetos sociais.",
    historia:
      "Aproximou a igreja da comunidade por meio de ações sociais e ajudou a renovar a maneira como os eventos e projetos eram divulgados.",
  },
  {
    nome: "Mariana Vasconcelos",
    periodo: "2020 - 2026",
    foto: "https://admin.cnnbrasil.com.br/wp-content/uploads/sites/12/2023/07/IMG_4005.jpg?w=419&h=283&crop=0",
    resumo:
      "Evoluiu a igreja a níveis modernos com sites e redes sociais, mantendo projetos íntegros e de alto rendimento.",
    historia:
      "Deu continuidade à transformação digital da igreja e ampliou os canais de comunicação com membros, visitantes e congregações.",
  },
];

const SobrePage = () => {
  return (
    <>
      <Header />

      <main>
        <section className="pt-32 pb-24 bg-background">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="rounded-3xl overflow-hidden shadow-xl border border-border"
              >
                <img
                  src="https://lh5.googleusercontent.com/p/AF1QipNzF-PyrzUoPL4X3E26Y-6AJVsKusMgypL1cRvz=w650-h486-k-no"
                  alt="Foto da igreja"
                  className="w-full h-[520px] object-cover"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Church className="w-9 h-9 text-primary" />
                  <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                    Sobre a Igreja
                  </h1>
                </div>

                <p className="text-lg text-muted-foreground dark:text-slate-300 leading-relaxed mb-5">
                  A Assembleia de Deus da Lapa é uma comunidade cristã dedicada à
                  adoração, ao ensino da Palavra de Deus e ao acolhimento de famílias.
                  Nossa missão é anunciar o evangelho, cuidar de vidas e fortalecer a fé
                  de cada membro.
                </p>

                <p className="text-lg text-muted-foreground dark:text-slate-300 leading-relaxed">
                  Fundada em 1998, a igreja nasceu do desejo de reunir pessoas em um
                  ambiente de fé, comunhão e serviço. Ao longo dos anos, cresceu como
                  uma família espiritual, mantendo seu compromisso com Deus e com a
                  comunidade local.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-28 lg:py-32 bg-muted">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.25fr] gap-10 lg:gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <img
                  src={presidenteAtual.foto}
                  alt={presidenteAtual.nome}
                  className="w-full h-[460px] lg:h-[580px] object-cover rounded-3xl shadow-xl"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-flex items-center gap-3 border border-primary/60 bg-primary/10 text-primary dark:text-white text-sm font-bold uppercase tracking-[0.2em] px-6 py-3 rounded-full mb-7 shadow-sm">
                  <Church className="w-5 h-5" />
                  Liderança atual
                </span>

                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
                  {presidenteAtual.nome}
                </h2>

                <p className="text-sm font-semibold uppercase tracking-wider text-primary dark:text-white mb-7">
                  Presidente · {presidenteAtual.periodo}
                </p>

                <p className="text-xl md:text-2xl text-foreground font-medium italic leading-relaxed border-l-4 border-primary pl-5 mb-8">
                  “Servir com fé, cuidado e compromisso com cada vida.”
                </p>

                <p className="text-lg text-muted-foreground dark:text-slate-300 leading-relaxed">
                  {presidenteAtual.resumo}
                </p>

                <div className="mt-6 space-y-5 text-base md:text-lg text-muted-foreground dark:text-slate-300 leading-relaxed">
                  <p>{presidenteAtual.historia}</p>
                  <p>{presidenteAtual.atuacao}</p>
                </div>

                <div className="mt-10 pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground dark:text-slate-400">
                    Assembleia de Deus da Lapa
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <History className="w-8 h-8 text-primary" />
                <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                  Ex-presidentes
                </h2>
              </div>

              <p className="text-lg text-muted-foreground dark:text-white max-w-2xl mx-auto">
                Conheça alguns líderes que fizeram parte da história da nossa igreja.
              </p>
            </motion.div>

            <div className="mx-auto max-w-5xl space-y-16 lg:space-y-20">
              {exPresidentes.map((presidente, index) => {
                const imageOnRight = index % 2 === 0;

                return (
                <motion.div
                  key={`${presidente.nome}-${presidente.periodo}`}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="grid grid-cols-1 items-center gap-7 md:grid-cols-2 md:gap-10"
                >
                  <motion.div
                    initial={{ opacity: 0, x: imageOnRight ? 24 : -24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55 }}
                    className={imageOnRight ? "md:order-2" : "md:order-1"}
                  >
                    <img
                      src={presidente.foto}
                      alt={presidente.nome}
                      className="h-[420px] w-full rounded-3xl object-cover object-top shadow-lg md:h-[480px]"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: imageOnRight ? -24 : 24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55 }}
                    className={`flex flex-col justify-center ${
                      imageOnRight ? "md:order-1" : "md:order-2"
                    }`}
                  >
                    <div>
                      <p className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary dark:text-white">
                        {presidente.periodo}
                      </p>

                      <h3 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
                        {presidente.nome}
                      </h3>

                      <p className="text-base leading-relaxed text-muted-foreground dark:text-slate-300 md:text-lg">
                        {presidente.resumo}
                      </p>

                      <div className="mt-7 border-l-2 border-primary/60 pl-5">
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-primary dark:text-white">
                          Durante sua liderança
                        </p>
                        <p className="leading-relaxed text-muted-foreground dark:text-slate-300">
                          {presidente.historia}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default SobrePage;
