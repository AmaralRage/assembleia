# Assembleia de Deus na Lapa

Site institucional da Assembleia de Deus na Lapa. Reúne agenda de cultos e eventos,
endereços das congregações, transmissões, mensagens, história da igreja e uma área
administrativa para manutenção do calendário.

## Tecnologias

- React 19 e React Router
- Vite 8
- Tailwind CSS e componentes Radix UI
- Supabase (banco de dados, autenticação, storage e Edge Functions)
- Framer Motion e Lucide React

## Requisitos

- Node.js 20 ou superior
- Um projeto Supabase configurado

## Configuração local

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie um arquivo `.env.local` na raiz:

   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publicavel
   VITE_SITE_URL=https://www.seudominio.com.br
   ```

3. Inicie o ambiente de desenvolvimento:

   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev`: inicia o servidor local do Vite.
- `npm run build`: gera a versão otimizada em `dist/`.
- `npm run preview`: serve localmente o build de produção.
- `npm run lint`: verifica os arquivos JavaScript e JSX com ESLint.

## Supabase

O arquivo `supabase/calendar.sql` contém a definição consolidada do calendário,
incluindo tabela, índices, função de autorização e políticas RLS. Alterações incrementais
ficam em `supabase/migrations/`.

A função `supabase/functions/youtube-latest-videos/` consulta as transmissões e mensagens
recentes do canal da igreja. As credenciais privadas dessa integração devem ser mantidas
nos secrets do Supabase e nunca em variáveis `VITE_*`, pois estas são públicas no navegador.

## Estrutura principal

```text
src/
  components/       Componentes compartilhados e interface
  data/             Conteúdo institucional estático
  hooks/            Hooks reutilizáveis
  lib/              Supabase, calendário, tema e utilitários
  pages/            Páginas e área administrativa
supabase/
  functions/        Edge Functions
  migrations/       Migrações do banco de dados
public/              Arquivos públicos, SEO e identidade visual
```

## Validação antes de publicar

```bash
npm run lint
npm run build
```

O projeto inclui uma regra de rewrite em `vercel.json` para que as rotas do React Router
funcionem quando acessadas diretamente na Vercel. O pós-build gera `robots.txt` e
`sitemap.xml` usando `VITE_SITE_URL` ou, na ausência dela, o domínio informado
automaticamente pela Vercel.

## Segurança

- Não envie `.env.local` ou chaves privadas ao repositório.
- A chave publicável do Supabase depende das políticas RLS para proteger os dados.
- A administração do calendário exige autenticação e validação pela função
  `is_calendar_admin()` no banco de dados.
