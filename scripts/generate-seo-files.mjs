import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const configuredUrl =
  process.env.VITE_SITE_URL ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  process.env.VERCEL_URL ||
  'http://localhost:4173';

const siteUrl = (/^https?:\/\//i.test(configuredUrl) ? configuredUrl : `https://${configuredUrl}`)
  .replace(/\/+$/, '');
const outputDirectory = resolve('dist');
const publicPages = [
  {
    route: '/',
    title: 'Assembleia de Deus na Lapa - Uma comunidade de fé',
    description:
      'Junte-se à nossa comunidade de fé. Confira nossa agenda, conheça nossas congregações e assista às mensagens mais recentes.',
    changefreq: 'daily',
    priority: '1.0',
  },
  {
    route: '/enderecos',
    title: 'Endereços e congregações - Assembleia de Deus na Lapa',
    description:
      'Encontre a congregação da Assembleia de Deus na Lapa mais próxima de você, consulte o endereço e veja como chegar.',
  },
  {
    route: '/sobre',
    title: 'Nossa história e liderança - Assembleia de Deus na Lapa',
    description:
      'Conheça a história, os valores e a liderança da Assembleia de Deus na Lapa desde sua fundação.',
  },
  {
    route: '/assistir',
    title: 'Assista aos cultos online - Assembleia de Deus na Lapa',
    description:
      'Assista aos cultos online da Assembleia de Deus na Lapa ao vivo, acompanhe mensagens recentes e veja os próximos horários de transmissão.',
  },
  {
    route: '/sou-novo',
    title: 'Sou novo por aqui - Assembleia de Deus na Lapa',
    description:
      'Seja bem-vindo à Assembleia de Deus na Lapa. Saiba como visitar nossa igreja, chegar até nós e participar dos cultos.',
  },
  {
    route: '/calendario',
    title: 'Calendário de cultos e eventos - Assembleia de Deus na Lapa',
    description:
      'Consulte as datas, horários e locais dos próximos cultos e eventos da Assembleia de Deus na Lapa.',
    changefreq: 'daily',
  },
];
const buildDate = new Date().toISOString().slice(0, 10);
const socialImageUrl = `${siteUrl}/logo.png`;

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${publicPages
  .map(
    (page) => `  <url>
    <loc>${siteUrl}${page.route === '/' ? '/' : page.route}</loc>
    <lastmod>${buildDate}</lastmod>
    <changefreq>${page.changefreq || 'monthly'}</changefreq>
    <priority>${page.priority || '0.8'}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

const robots = `User-agent: *
Allow: /
Disallow: /administracao
Disallow: /redefinir-senha

Sitemap: ${siteUrl}/sitemap.xml
`;

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(resolve(outputDirectory, 'sitemap.xml'), sitemap, 'utf8'),
  writeFile(resolve(outputDirectory, 'robots.txt'), robots, 'utf8'),
]);

const baseHtml = await readFile(resolve(outputDirectory, 'index.html'), 'utf8');

const renderRouteHtml = (page) => {
  const canonicalUrl = `${siteUrl}${page.route === '/' ? '' : page.route}`;
  const socialTags = `
    <link rel="canonical" href="${canonicalUrl}" />
    <meta property="og:locale" content="pt_BR" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Assembleia de Deus na Lapa" />
    <meta property="og:title" content="${page.title}" />
    <meta property="og:description" content="${page.description}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${socialImageUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${page.title}" />
    <meta name="twitter:description" content="${page.description}" />
    <meta name="twitter:image" content="${socialImageUrl}" />`;

  return baseHtml
    .replace(/<title>.*?<\/title>/s, `<title>${page.title}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/>/s,
      `<meta name="description" content="${page.description}" />`,
    )
    .replace('</head>', `${socialTags}\n  </head>`);
};

await Promise.all(
  publicPages.map(async (page) => {
    const html = renderRouteHtml(page);

    if (page.route === '/') {
      await writeFile(resolve(outputDirectory, 'index.html'), html, 'utf8');
      return;
    }

    const routeDirectory = resolve(outputDirectory, page.route.slice(1));
    await mkdir(routeDirectory, { recursive: true });
    await writeFile(resolve(routeDirectory, 'index.html'), html, 'utf8');
  }),
);

console.log(`SEO files and route metadata generated for ${siteUrl}`);
