export const leadershipPlaceholderImage = "https://i.imgur.com/SA53Yxc.png";

export const presidenteAtual = {
  nome: "Mariana Vasconcelos",
  cargo: "Presidente",
  periodo: "2020 - Atual",
  foto:
    "https://admin.cnnbrasil.com.br/wp-content/uploads/sites/12/2023/07/IMG_4005.jpg?w=419&h=283&crop=0",
  resumo:
    "Conduz a igreja em direção a novos tempos, fortalecendo a presença digital, os projetos sociais e o compromisso com a comunidade.",
  historia:
    "Sua trajetória na igreja foi construída por meio do serviço, do cuidado com as famílias e da dedicação aos diferentes ministérios. Ao longo dos anos, participou de momentos importantes da comunidade e contribuiu para aproximar a liderança de seus membros.",
  atuacao:
    "Hoje, à frente da presidência, busca preservar os valores e a história da Assembleia de Deus da Lapa enquanto incentiva novas formas de evangelização, comunhão e atuação social.",
  destaques: [
    "Fortalecimento da presença digital da igreja.",
    "Continuidade dos projetos sociais e ministeriais.",
    "Aproximação da liderança com membros e visitantes.",
  ],
};

export const exPresidentes = [
  {
    nome: "Pastor Antônio Souza",
    cargo: "Presidente fundador",
    periodo: "1998 - 2008",
    foto: leadershipPlaceholderImage,
    fotoPlaceholder: true,
    resumo:
      "Foi um líder dedicado à expansão da igreja, fortalecendo os ministérios e a comunhão entre os membros.",
    historia:
      "Durante sua liderança, acompanhou os primeiros anos de crescimento da congregação e incentivou a participação das famílias nas atividades da igreja.",
    destaques: [
      "Acompanhou os primeiros anos de crescimento da congregação.",
      "Incentivou a participação das famílias nas atividades da igreja.",
      "Ajudou a consolidar a base comunitária da Assembleia de Deus da Lapa.",
    ],
  },
  {
    nome: "Pastor José Almeida",
    cargo: "Ex-presidente",
    periodo: "2008 - 2016",
    foto: leadershipPlaceholderImage,
    fotoPlaceholder: true,
    resumo:
      "Conduziu a igreja em um período de crescimento espiritual, valorizando o ensino bíblico e a evangelização.",
    historia:
      "Seu período foi marcado pelo fortalecimento dos estudos bíblicos e pela formação de novos líderes para servir aos diferentes ministérios.",
    destaques: [
      "Fortaleceu os estudos bíblicos da igreja.",
      "Valorizou a evangelização como parte da rotina ministerial.",
      "Contribuiu para a formação de novas lideranças.",
    ],
  },
  {
    nome: "Pastor Marcos Oliveira",
    cargo: "Ex-presidente",
    periodo: "2016 - 2020",
    foto: leadershipPlaceholderImage,
    fotoPlaceholder: true,
    resumo:
      "Trabalhou na modernização da comunicação da igreja e no fortalecimento dos projetos sociais.",
    historia:
      "Aproximou a igreja da comunidade por meio de ações sociais e ajudou a renovar a maneira como os eventos e projetos eram divulgados.",
    destaques: [
      "Fortaleceu projetos sociais e ações de acolhimento.",
      "Renovou a comunicação de eventos e projetos da igreja.",
      "Aproximou a igreja das famílias da comunidade.",
    ],
  },
  {
    nome: "Mariana Vasconcelos",
    cargo: "Ex-presidente",
    periodo: "2020 - 2026",
    foto: presidenteAtual.foto,
    resumo:
      "Evoluiu a igreja a níveis modernos com sites e redes sociais, mantendo projetos íntegros e de alto rendimento.",
    historia:
      "Deu continuidade à transformação digital da igreja e ampliou os canais de comunicação com membros, visitantes e congregações.",
    destaques: [
      "Ampliou os canais digitais de comunicação.",
      "Manteve projetos íntegros e bem organizados.",
      "Conectou membros, visitantes e congregações por meio da tecnologia.",
    ],
  },
];

export const homeLeadershipCards = [
  {
    cargo: presidenteAtual.cargo,
    nome: presidenteAtual.nome,
    descricao:
      "Liderança atual da igreja, conduzindo a comunidade com cuidado, serviço e visão para os próximos anos.",
    foto: presidenteAtual.foto,
  },
  {
    cargo: "Presidente fundador",
    nome: exPresidentes[0].nome,
    descricao:
      "Referência nos primeiros anos da caminhada, ajudando a consolidar a base comunitária da igreja.",
    foto: exPresidentes[0].foto,
    fotoPlaceholder: true,
  },
  {
    cargo: "Ensino bíblico",
    nome: exPresidentes[1].nome,
    descricao:
      "Contribuiu para o fortalecimento do ensino, da evangelização e da formação de novas lideranças.",
    foto: exPresidentes[1].foto,
    fotoPlaceholder: true,
  },
  {
    cargo: "Cuidado pastoral",
    nome: exPresidentes[2].nome,
    descricao:
      "Ajudou a aproximar a igreja da comunidade por meio de projetos sociais e ações de acolhimento.",
    foto: exPresidentes[2].foto,
    fotoPlaceholder: true,
  },
];
