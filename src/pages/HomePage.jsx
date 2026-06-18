import React from 'react';
import { Helmet } from "react-helmet-async";
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight, Users } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
const HomePage = () => {

  const serviceTimes = [{
    day: 'Domingo',
    time: '09:00',
    event: 'Escola Dominical'
  }, {
    day: 'Domingo',
    time: '18:00',
    event: 'Culto de Celebração'
  }, {
    day: 'Quarta-feira',
    time: '19:30',
    event: 'Culto de Ensino'
  }, {
    day: 'Sexta-feira',
    time: '19:30',
  }];
  const upcomingEvents = [{
    title: 'Conferência de Jovens',
    date: '15 de Julho',
    time: '19:00',
    description: 'Um encontro especial de adoração e palavra para a juventude.'
  }, {
    title: 'Retiro Espiritual',
    date: '22 a 24 de Agosto',
    time: 'O dia todo',
    description: 'Momentos de comunhão e renovação espiritual em nosso acampamento.'
  }];
  {/* LIDERANÇA SECTION */ }
  const leadershipCards = [
    {
      cargo: "Presidente",
      nome: "Pastor Miguel Santos",
      descricao: "Líder espiritual dedicado ao crescimento da comunidade",
      foto: "https://cdn.pixabay.com/photo/2023/08/24/19/58/saitama-8211499_1280.png"
    },
    {
      cargo: "Vice-Presidente",
      nome: "Irmã Beatriz Oliveira",
      descricao: "Coordenadora de ministérios e ações sociais",
      foto: "https://static.wikitide.net/deathbattlewiki/5/5b/Portrait.genos.png"
    },
    {
      cargo: "Secretário",
      nome: "Irmão Carlos Mendes",
      descricao: "Responsável pela organização e documentação",
      foto: "https://ovicio.com.br/wp-content/uploads/2022/08/20220803-20220803_214217-555x555.jpg"
    },
    {
      cargo: "Tesoureira",
      nome: "Irmã Ana Costa",
      descricao: "Gestora financeira e administrativa",
      foto: "https://i.redd.it/62qymrbj6sma1.jpg"
    }
  ];
  return <>
    <Helmet>
      <title>Assembleia de Deus - Bem-vindo à nossa comunidade de fé</title>
      <meta name="description" content="Junte-se à nossa comunidade de fé. Confira nossa agenda de cultos, horários e conheça nossa liderança." />
    </Helmet>

    <Header />

    <main>
      {/* HERO SECTION */}
      <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
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
          }} className="flex flex-col items-center gap-8">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20 bg-white">
              <img src="https://i.imgur.com/SA53Yxc.png" alt="Logo da Assembleia de Deus" className="w-full h-full object-cover" />
            </div>

            <div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4" style={{
                letterSpacing: '-0.02em',
                textWrap: 'balance'
              }}>
                Assembleia de Deus da Lapa
              </h1>
              <p className="text-xl md:text-2xl text-white/90 font-light max-w-2xl mx-auto leading-relaxed">
                Bem-vindo à nossa comunidade de fé
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 mt-8">
              <motion.a href="#horarios" onClick={e => {
                e.preventDefault();
                const element = document.querySelector('#horarios');
                if (element) {
                  const offset = 80;
                  const elementPosition = element.offsetTop - offset;
                  window.scrollTo({
                    top: elementPosition,
                    behavior: 'smooth'
                  });
                }
              }} initial={{
                opacity: 0
              }} animate={{
                opacity: 1
              }} transition={{
                delay: 0.5,
                duration: 0.8
              }} className="px-8 py-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg hover:shadow-xl w-full sm:w-auto text-center">
                Ver horários de cultos
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* LIDERANÇA SECTION */}
      <section id="sobre" className="py-24 bg-muted">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 flex items-center justify-center gap-3">
              <Users className="w-10 h-10 text-primary" />
              Nossa liderança
            </h2>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Conheça quem conduz nossa comunidade com dedicação e amor
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {leadershipCards.map((lider) => (
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
                className="bg-card border border-border rounded-2xl overflow-hidden shadow-md"
              >
                <img
                  src={lider.foto}
                  alt={lider.nome}
                  className="w-full h-72 object-cover"
                />

                <div className="p-6">
                  <p className="inline-block bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full mb-3">
                    {lider.cargo}
                  </p>

                  <h3 className="text-foreground text-2xl font-bold mb-3">
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
      <section id="agenda" className="py-24 bg-background border-b border-border">
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
          }} className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Calendar className="w-8 h-8 text-primary" />
              <h2 className="text-4xl md:text-5xl font-bold text-foreground" style={{
                letterSpacing: '-0.02em'
              }}>
                Agenda
              </h2>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Fique por dentro dos nossos próximos eventos especiais
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingEvents.map((event, idx) => <motion.div key={idx} initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              duration: 0.5,
              delay: idx * 0.1
            }} className="bg-card border border-border p-6 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-card-foreground">{event.title}</h3>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{event.date}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{event.time}</span>
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {event.description}
              </p>
            </motion.div>)}
          </div>

          <div className="text-center mt-12">
            <a href="#" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors">
              Ver calendário completo <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* HORÁRIOS SECTION */}
      <section id="horarios" className="py-24 bg-muted">
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
          }} className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Clock className="w-8 h-8 text-primary" />
              <h2 className="text-4xl md:text-5xl font-bold text-foreground" style={{
                letterSpacing: '-0.02em'
              }}>
                Horários
              </h2>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Nossos encontros semanais
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {serviceTimes.map((item, index) => <motion.div key={index} initial={{
                opacity: 0,
                scale: 0.95
              }} whileInView={{
                opacity: 1,
                scale: 1
              }} viewport={{
                once: true
              }} transition={{
                duration: 0.5,
                delay: index * 0.1
              }} className="bg-white p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <p className="text-sm font-medium text-primary mb-2 bg-primary/10 inline-block px-3 py-1 rounded-full">
                    {item.day}
                  </p>
                  <h3 className="font-bold text-xl text-card-foreground mb-1">
                    {item.event}
                  </h3>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-muted-foreground text-sm font-medium">Horário de início</span>
                  <span className="font-bold text-2xl text-foreground">
                    {item.time}
                  </span>
                </div>
              </motion.div>)}
            </div>
          </div>
        </div>
      </section>
    </main>

    <Footer />
  </>;
};
export default HomePage;