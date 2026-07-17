import vilaKennedyChurchImage from "@/assets/locations/vila-kennedy-church.jpg";
import ponteNovaChurchImage from "@/assets/locations/ponte-nova-church.jpg";
import betaniaChurchImage from "@/assets/locations/betania-church.jpg";
import belitaChurchImage from "@/assets/locations/belita-church.jpg";
import vilaAliancaChurchImage from "@/assets/locations/vila-alianca-church.jpg";
import areinhaChurchImage from "@/assets/locations/areinha-church.jpg";
import mentralChurchImage from "@/assets/locations/mentral-church.jpg";
import bairroAzulChurchImage from "@/assets/locations/bairro-azul-church.jpg";
import congregacaoDaPazChurchImage from "@/assets/locations/congregacao-da-paz-church.jpg";
import santaMartaChurchImage from "@/assets/locations/santa-marta-church.jpg";
import cerroCoraChurchImage from "@/assets/locations/cerro-cora-church.jpg";

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const lapaFallbackImage = "https://i.imgur.com/WMVJQ9m.jpeg";

const getGoogleStreetViewImage = (location) => {
  if (!googleMapsApiKey) return null;

  const params = new URLSearchParams({
    size: "900x420",
    location,
    fov: "70",
    pitch: "5",
    source: "outdoor",
    return_error_code: "true",
    key: googleMapsApiKey,
  });

  return `https://maps.googleapis.com/maps/api/streetview?${params.toString()}`;
};

const getGoogleMapsUrl = (address) =>
  `https://maps.google.com/?q=${encodeURIComponent(`${address}, Brasil`)}`;

const createCongregation = ({ id, name, city, state = "RJ", address, image }) => ({
  id,
  name,
  city,
  state,
  address,
  image: image || getGoogleStreetViewImage(`${address}, Brasil`) || lapaFallbackImage,
  mapUrl: getGoogleMapsUrl(address),
});

export const churchLocations = [
  {
    id: "lapa-centro",
    name: "Assembleia de Deus na Lapa",
    legacyNames: ["Assembleia de Deus da Lapa"],
    city: "Rio de Janeiro",
    state: "RJ",
    address: "Rua Joaquim Silva, 52 - Centro, Rio de Janeiro - RJ",
    leaderLabel: "Presidente",
    leader: "Pastor Charles",
    image:
      getGoogleStreetViewImage("Rua Joaquim Silva, 52 - Centro, Rio de Janeiro - RJ, Brasil") ||
      lapaFallbackImage,
    mapUrl:
      "https://maps.google.com/?q=Rua+Joaquim+Silva+52+Centro+Rio+de+Janeiro+RJ+Brasil",
  },
  {
    id: "vila-nova",
    name: "Assembleia de Deus na Lapa - Filial Vila Kennedy",
    legacyNames: ["Assembleia de Deus da Lapa - Filial Vila Kennedy"],
    city: "Rio de Janeiro",
    state: "RJ",
    address: "Estr. Srg. Miguel Filho, 71A, Rio de Janeiro, RJ",
    image: vilaKennedyChurchImage,
    mapUrl:
      "https://maps.google.com/?q=Estr.+Srg.+Miguel+Filho,+71A,+Rio+de+Janeiro,+RJ",
  },
  createCongregation({
    id: "ponte-nova",
    name: "Assembleia de Deus - Ponte Nova",
    city: "Ponte Nova",
    state: "MG",
    address: "Rua Pedro N. Pinheiro, 122 - Ponte Nova - MG",
    image: ponteNovaChurchImage,
  }),
  createCongregation({
    id: "betania",
    name: "Assembleia de Deus - Betânia",
    city: "Niterói",
    address: "Rua Alzira Vargas, 61 - Fonseca, Niterói - RJ",
    image: betaniaChurchImage,
  }),
  createCongregation({
    id: "belita",
    name: "Assembleia de Deus - Belita",
    city: "Rio de Janeiro",
    address: "Caminho do Lácio, 395 - Comunidade Vila Aliança, Bangu, Rio de Janeiro - RJ",
    image: belitaChurchImage,
  }),
  createCongregation({
    id: "vila-alianca",
    name: "Assembleia de Deus - Vila Aliança",
    city: "Rio de Janeiro",
    address: "Rua Pedagogo, 21 - Comunidade de Vila Aliança, Bangu, Rio de Janeiro - RJ",
    image: vilaAliancaChurchImage,
  }),
  createCongregation({
    id: "areinha",
    name: "Assembleia de Deus - Areinha",
    city: "Rio de Janeiro",
    address: "Avenida Areinha, 64 - Rio das Pedras, Jacarepaguá, Rio de Janeiro - RJ",
    image: areinhaChurchImage,
  }),
  createCongregation({
    id: "mentral",
    name: "Assembleia de Deus - Mentral",
    city: "Rio de Janeiro",
    address: "Rua Santo Antônio de Pádua, 04 - Vila Mentral, Vila Kennedy, Rio de Janeiro - RJ",
    image: mentralChurchImage,
  }),
  createCongregation({
    id: "bairro-azul",
    name: "Assembleia de Deus - Bairro Azul",
    city: "Rio de Janeiro",
    address: "Rua Bibiano, 54 - Comunidade do Bairro Azul, Flamengo, Rio de Janeiro - RJ",
    image: bairroAzulChurchImage,
  }),
  createCongregation({
    id: "congregacao-da-paz",
    name: "Assembleia de Deus - Congregação da Paz",
    city: "Rio de Janeiro",
    address: "Rua da Assembleia, 25 - Comunidade do Santa Marta, Botafogo, Rio de Janeiro - RJ",
    image: congregacaoDaPazChurchImage,
  }),
  createCongregation({
    id: "santa-marta",
    name: "Assembleia de Deus - Santa Marta",
    city: "Rio de Janeiro",
    address: "Rua Padre Veloso, 19 - Comunidade do Santa Marta, Botafogo, Rio de Janeiro - RJ",
    image: santaMartaChurchImage,
  }),
  createCongregation({
    id: "cerro-cora",
    name: "Assembleia de Deus - Cerro Corá",
    city: "Rio de Janeiro",
    address: "Rua José Miguel, 20 - Comunidade de Cerro Corá, Cosme Velho, Rio de Janeiro - RJ",
    image: cerroCoraChurchImage,
  }),
  createCongregation({
    id: "cruzeiro-do-sul",
    name: "Assembleia de Deus - Cruzeiro do Sul",
    city: "Rio de Janeiro",
    address: "Rua Tavares Bastos, 414 - C175, Catete, Rio de Janeiro - RJ",
  }),
  createCongregation({
    id: "harmonia",
    name: "Assembleia de Deus - Harmonia",
    city: "Rio de Janeiro",
    address: "Rua São Gregório, 28 - Saúde, Rio de Janeiro - RJ",
  }),
  createCongregation({
    id: "pedro-americo",
    name: "Assembleia de Deus - Pedro Américo",
    city: "Rio de Janeiro",
    address: "Rua Santo Amaro, 349 - Glória, Rio de Janeiro - RJ",
  }),
  createCongregation({
    id: "urucania",
    name: "Assembleia de Deus - Urucânia",
    city: "Rio de Janeiro",
    address: "Rua 30, 69 - Conjunto Urucânia, Santa Cruz, Rio de Janeiro - RJ",
  }),
  createCongregation({
    id: "vale-do-jordao",
    name: "Assembleia de Deus - Vale do Jordão",
    city: "Rio de Janeiro",
    address: "Estrada Guandu do Sena, 7780 - Carobinha, Campo Grande, Rio de Janeiro - RJ",
  }),
  createCongregation({
    id: "calebe",
    name: "Assembleia de Deus - Calebe",
    city: "Rio de Janeiro",
    address: "Rua Guatemir da Silva, 74 - Campo Grande, Rio de Janeiro - RJ",
  }),
  createCongregation({
    id: "sao-pedro",
    name: "Assembleia de Deus - São Pedro",
    city: "Ponte Nova",
    state: "MG",
    address: "São Pedro, Ponte Nova - MG",
  }),
  createCongregation({
    id: "pacheco",
    name: "Assembleia de Deus - Pacheco",
    city: "Ponte Nova",
    state: "MG",
    address: "Pacheco, Ponte Nova - MG",
  }),
  createCongregation({
    id: "texeira",
    name: "Assembleia de Deus - Texeira",
    city: "Ponte Nova",
    state: "MG",
    address: "Texeira, Ponte Nova - MG",
  }),
  createCongregation({
    id: "acaiaca",
    name: "Assembleia de Deus - Acaiaca",
    city: "Acaiaca",
    state: "MG",
    address: "Rua Ernesto Machado, 44 - Centro, Acaiaca - MG",
  }),
  createCongregation({
    id: "goiabeira",
    name: "Assembleia de Deus - Goiabeira",
    city: "Ponte Nova",
    state: "MG",
    address: "Rua Cuiabá, 80 - Goiabeira, Ponte Nova - MG",
  }),
];

export const mainChurchLocation = churchLocations[0];

export const getChurchLocation = (name) =>
  churchLocations.find(
    (location) => location.name === name || location.legacyNames?.includes(name),
  );

export const getChurchLocationNames = (location) => [
  location.name,
  ...(location.legacyNames || []),
];
