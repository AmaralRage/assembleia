import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const siteName = 'Assembleia de Deus na Lapa';
const fallbackDescription =
  'Conheça a Assembleia de Deus na Lapa, consulte nossa agenda, encontre congregações e acompanhe mensagens e cultos online.';

const getSiteUrl = () => {
  const configuredUrl = import.meta.env.VITE_SITE_URL?.trim().replace(/\/+$/, '');
  if (configuredUrl) return configuredUrl;
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
};

const toAbsoluteUrl = (value, siteUrl) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `${siteUrl}${value.startsWith('/') ? value : `/${value}`}`;
};

const Seo = ({
  title,
  description = fallbackDescription,
  image = '/logo.png',
  type = 'website',
  noIndex = false,
  noFollow = false,
  structuredData,
}) => {
  const { pathname } = useLocation();
  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}${pathname === '/' ? '' : pathname}`;
  const imageUrl = toAbsoluteUrl(image, siteUrl);
  const robots = `${noIndex ? 'noindex' : 'index'}, ${noFollow ? 'nofollow' : 'follow'}`;

  return (
    <Helmet>
      <html lang="pt-BR" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:locale" content="pt_BR" />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:alt" content={`Logo da ${siteName}`} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {structuredData && (
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      )}
    </Helmet>
  );
};

export { fallbackDescription, getSiteUrl, siteName };
export default Seo;
