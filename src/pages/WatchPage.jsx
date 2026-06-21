import React from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, MapPin, PlayCircle, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header.jsx";
import Footer from "@/components/Footer.jsx";
import { Button } from "@/components/ui/button";
import { churchMedia } from "@/data/churchMedia";

const WatchPage = () => (
  <>
    <Helmet>
      <title>Assista o culto - Assembleia de Deus da Lapa</title>
      <meta
        name="description"
        content="Assista aos cultos, transmissões e mensagens da Assembleia de Deus da Lapa pelo YouTube."
      />
    </Helmet>

    <Header />

    <main className="min-h-screen bg-background pt-28">
      <section className="section-container pb-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_420px] lg:items-center"
        >
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2 text-sm font-semibold text-foreground">
              <Youtube className="h-4 w-4 text-red-600" />
              Cultos e mensagens online
            </div>

            <h1 className="text-4xl font-bold leading-tight text-foreground md:text-6xl">
              Assista o culto de onde estiver
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Acompanhe transmissões, mensagens e registros dos cultos pelo canal oficial da Assembleia de Deus da Lapa.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-xl">
                <a
                  href={churchMedia.youtubeLiveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Ver transmissões
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl">
                <a
                  href={churchMedia.youtubeChannelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Youtube className="mr-2 h-5 w-5" />
                  Abrir canal
                </a>
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-slate-950 shadow-xl">
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
                  src="https://i.imgur.com/WMVJQ9m.jpeg"
                  alt="Assembleia de Deus da Lapa"
                  className="h-full w-full object-cover opacity-70"
                />
                <div className="absolute inset-0 bg-slate-950/55" />
                <a
                  href={churchMedia.youtubeChannelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center text-white"
                >
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-red-600 shadow-2xl transition-transform hover:scale-105">
                    <PlayCircle className="h-10 w-10" />
                  </span>
                  <span className="px-6 text-xl font-bold">
                    Abrir canal no YouTube
                  </span>
                </a>
              </div>
            )}
          </div>
        </motion.div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <Link
            to="/calendario"
            className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
          >
            <CalendarDays className="mb-4 h-6 w-6 text-primary" />
            <h2 className="font-bold text-foreground">Próximos cultos</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Veja a agenda completa e escolha uma data para participar presencialmente.
            </p>
          </Link>

          <Link
            to="/enderecos"
            className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
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
            className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
          >
            <Youtube className="mb-4 h-6 w-6 text-red-600" />
            <h2 className="font-bold text-foreground">Mensagens recentes</h2>
            <p className="mt-2 flex items-center gap-2 text-sm leading-relaxed text-muted-foreground">
              Ver vídeos publicados <ArrowRight className="h-4 w-4" />
            </p>
          </a>
        </div>
      </section>
    </main>

    <Footer />
  </>
);

export default WatchPage;
