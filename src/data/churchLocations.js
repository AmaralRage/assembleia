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

export const churchLocations = [
  {
    id: "lapa-centro",
    name: "Assembleia de Deus da Lapa",
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
    name: "Assembleia de Deus da Lapa - Filial Vila Kennedy",
    city: "Rio de Janeiro",
    state: "RJ",
    address: "Estr. Srg. Miguel Filho, 71A, Rio de Janeiro, RJ",
    image:
      getGoogleStreetViewImage("Estr. Srg. Miguel Filho, 71A, Rio de Janeiro, RJ, Brasil") ||
      "https://images.unsplash.com/photo-1609926795947-0738627824c5",
    mapUrl:
      "https://maps.google.com/?q=Estr.+Srg.+Miguel+Filho,+71A,+Rio+de+Janeiro,+RJ",
  },
  {
    id: "santa-cruz",
    name: "Assembleia de Deus - Santa Cruz",
    city: "Rio de Janeiro",
    state: "RJ",
    address: "Rua Felipe Cardoso, 500 - Santa Cruz, Rio de Janeiro - RJ",
    image:
      "https://chicaslokas.com.br/wp-content/uploads/2022/05/Santa-cruz-rio-de-janeiro.jpg",
    mapUrl:
      "https://maps.google.com/?q=Rua+Felipe+Cardoso+500+Santa+Cruz+Rio+de+Janeiro+RJ",
    isExample: true,
  },
  {
    id: "cidade-de-deus",
    name: "Assembleia de Deus - Cidade de Deus",
    city: "Rio de Janeiro",
    state: "RJ",
    address: "Rua Josias, 150 - Cidade de Deus, Rio de Janeiro - RJ",
    image:
      "https://webquarto-photos.nyc3.cdn.digitaloceanspaces.com/district/24157/district_image_0.jpg",
    mapUrl:
      "https://maps.google.com/?q=Rua+Josias+150+Cidade+de+Deus+Rio+de+Janeiro+RJ",
    isExample: true,
  },
  {
    id: "catete",
    name: "Assembleia de Deus - Catete",
    city: "Rio de Janeiro",
    state: "RJ",
    address: "Rua do Catete, 250 - Catete, Rio de Janeiro - RJ",
    image:
      "https://portal.loft.com.br/wp-content/uploads/2023/01/bairros-rj-catete-shutterstock.jpg",
    mapUrl:
      "https://maps.google.com/?q=Rua+do+Catete+250+Catete+Rio+de+Janeiro+RJ",
    isExample: true,
  },
  {
    id: "campo-grande",
    name: "Assembleia de Deus - Campo Grande",
    city: "Rio de Janeiro",
    state: "RJ",
    address:
      "Estrada do Monteiro, 900 - Campo Grande, Rio de Janeiro - RJ",
    image:
      "https://b3577058.smushcdn.com/3577058/wp-content/uploads/2024/06/Bairro-mais-populoso-do-Brasil-Campo-Grande-720x511.webp?lossy=1&strip=0&webp=1",
    mapUrl:
      "https://maps.google.com/?q=Estrada+do+Monteiro+900+Campo+Grande+Rio+de+Janeiro+RJ",
    isExample: true,
  },
];

export const mainChurchLocation = churchLocations[0];

export const getChurchLocation = (name) =>
  churchLocations.find((location) => location.name === name);
