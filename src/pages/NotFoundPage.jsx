import { ArrowLeft, CalendarDays, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import Seo from '@/components/Seo.jsx';
import { Button } from '@/components/ui/button.jsx';

const NotFoundPage = () => (
  <>
    <Seo
      title="Página não encontrada - Assembleia de Deus na Lapa"
      description="A página que você procura não foi encontrada."
      noIndex
    />

    <Header />
    <main className="flex min-h-[70vh] items-center bg-background px-6 py-24">
      <section className="mx-auto w-full max-w-3xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary">Erro 404</p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl">
          Esta página não foi encontrada
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
          O endereço pode ter mudado ou não existir. Você pode voltar ao início ou conferir
          nossa próxima programação.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="rounded-xl">
            <Link to="/">
              <Home className="h-5 w-5" />
              Ir para o início
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-xl">
            <Link to="/calendario">
              <CalendarDays className="h-5 w-5" />
              Ver calendário
            </Link>
          </Button>
        </div>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="mx-auto mt-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar à página anterior
        </button>
      </section>
    </main>
    <Footer />
  </>
);

export default NotFoundPage;
