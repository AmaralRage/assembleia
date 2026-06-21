import React, { useEffect, useState } from 'react';
import { Helmet } from "react-helmet-async";
import { motion } from 'framer-motion';
import {
  Accessibility,
  CalendarDays,
  Clock,
  Copy,
  Home,
  Info,
  Loader2,
  Map,
  MapPin,
  Phone,
  Search,
  UserRound,
  X,
} from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { churchLocations } from '@/data/churchLocations';
import { supabase } from '@/lib/supabase';

const getTodayKey = () => {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
};

const formatServiceDate = (date) =>
  new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));

const categoryLabels = {
  culto: 'Culto',
  especial: 'Evento especial',
  jovens: 'Jovens',
  reuniao: 'Reunião',
};

const AddressesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [upcomingServices, setUpcomingServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  const addresses = churchLocations.map((location) => ({
    leaderLabel: 'Dirigente',
    leader: 'Não informado',
    contact: 'Não informado',
    accessibility: 'Não informado',
    ...location,
    fullAddress: location.address,
  }));

  const filteredAddresses = addresses.filter((address) => {
    const query = searchQuery.toLowerCase();
    return (
      address.name.toLowerCase().includes(query) ||
      address.city.toLowerCase().includes(query) ||
      address.state.toLowerCase().includes(query) ||
      address.fullAddress.toLowerCase().includes(query)
    );
  });

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Endereço copiado para a área de transferência!');
  };

  useEffect(() => {
    if (!selectedAddress) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSelectedAddress(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAddress]);

  useEffect(() => {
    if (!selectedAddress) {
      setUpcomingServices([]);
      return undefined;
    }

    let isCurrentRequest = true;

    const loadUpcomingServices = async () => {
      setIsLoadingServices(true);
      setUpcomingServices([]);

      const { data, error } = await supabase
        .from('calendar_events')
        .select('id, title, event_date, event_time, category')
        .eq('location', selectedAddress.name)
        .gte('event_date', getTodayKey())
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true })
        .limit(6);

      if (!isCurrentRequest) return;

      if (error) {
        toast.error('Não foi possível carregar os próximos eventos.');
      } else {
        setUpcomingServices(data || []);
      }

      setIsLoadingServices(false);
    };

    loadUpcomingServices();

    return () => {
      isCurrentRequest = false;
    };
  }, [selectedAddress]);

  return (
    <>
      <Helmet>
        <title>Endereços - Assembleia de Deus da Lapa</title>
        <meta name="description" content="Encontre uma Assembleia de Deus da Lapa mais próxima de você." />
      </Helmet>

      <Header />
      <main className="min-h-screen pt-28 pb-24 bg-background dark:bg-slate-800">
        <div className="section-container">

          <div className="flex flex-col items-center justify-center text-center mb-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-16 h-16 bg-red-50 dark:bg-red-950/40 rounded-2xl flex items-center justify-center mb-6"
            >
              <Home className="w-8 h-8 text-red-500" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-foreground mb-4"
              style={{ letterSpacing: '-0.02em' }}
            >
              Endereços
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Encontre uma Assembleia de Deus mais próxima de você
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-2xl mx-auto mb-16"
          >
            <div className="flex items-center gap-3 bg-card p-2 rounded-xl shadow-sm border border-border focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <Search className="w-5 h-5 text-muted-foreground ml-3" />
              <Input
                type="text"
                placeholder="Busque por cidade, estado ou nome da igreja..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-2 text-base shadow-none bg-transparent"
              />
              <Button
                onClick={() => { }}
                className="rounded-lg px-6 transition-all duration-300 hover:scale-110 hover:shadow-lg"
              >
                Buscar
              </Button>
            </div>
          </motion.div>

          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground">Todos os Endereços</h2>
              <p className="text-muted-foreground">{filteredAddresses.length} locais encontrados</p>
            </div>

            {filteredAddresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredAddresses.map((address, index) => (
                  <motion.div
                    key={address.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 * index }}
                    className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
                  >
                    <div className="h-48 w-full overflow-hidden relative">
                      <img
                        src={address.image}
                        alt={address.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                      <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="text-xs font-semibold text-foreground">
                          {address.city}, {address.state}
                        </span>
                      </div>
                      {address.isExample && (
                        <span className="absolute top-4 right-4 bg-primary/90 text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                          Exemplo
                        </span>
                      )}
                    </div>

                    <div className="p-6 flex flex-col flex-grow">
                      <h3 className="text-xl font-bold text-card-foreground mb-2">
                        {address.name}
                      </h3>
                      <p className="text-muted-foreground flex-grow mb-6">
                        {address.fullAddress}
                      </p>

                      <div className="grid grid-cols-3 gap-3 mt-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(address.fullAddress)}
                          className="flex flex-col gap-1.5 h-auto py-3 bg-muted/50 hover:bg-muted border-transparent hover:border-border hover:scale-105 transition-all duration-200"
                        >
                          <Copy className="w-4 h-4 text-primary" />
                          <span className="text-xs font-medium text-foreground">Copiar</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(address.mapUrl, '_blank')}
                          className="flex flex-col gap-1.5 h-auto py-3 bg-muted/50 hover:bg-muted border-transparent hover:border-border hover:scale-105 transition-all duration-200"
                        >
                          <Map className="w-4 h-4 text-primary" />
                          <span className="text-xs font-medium text-foreground">Mapa</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAddress(address)}
                          className="flex flex-col gap-1.5 h-auto py-3 bg-muted/50 hover:bg-muted border-transparent hover:border-border hover:scale-105 transition-all duration-200"
                        >
                          <Info className="w-4 h-4 text-primary" />
                          <span className="text-xs font-medium text-foreground">Info</span>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
                <MapPin className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-1">Nenhum endereço encontrado</h3>
                <p className="text-muted-foreground">Tente buscar por outra cidade ou nome de igreja.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {selectedAddress && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="location-info-title"
          onClick={() => setSelectedAddress(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-background shadow-2xl"
          >
              <button
                type="button"
                onClick={() => setSelectedAddress(null)}
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur-sm transition-colors hover:text-primary"
                aria-label="Fechar informações"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="relative h-52 overflow-hidden rounded-t-3xl">
                <img
                  src={selectedAddress.image}
                  alt={selectedAddress.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
                <span className="absolute bottom-4 left-5 inline-flex items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  {selectedAddress.city}, {selectedAddress.state}
                </span>
              </div>

              <div className="p-6 md:p-8">
                <div>
                  <h2 id="location-info-title" className="pr-8 text-2xl font-semibold leading-none tracking-tight">
                    {selectedAddress.name}
                  </h2>
                  <p className="mt-2 text-base text-muted-foreground">
                    Informações da congregação
                  </p>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-muted/40 p-4">
                    <div className="flex gap-3">
                      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Endereço</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {selectedAddress.fullAddress}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/40 p-4">
                    <div className="flex gap-3">
                      <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {selectedAddress.leaderLabel}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {selectedAddress.leader}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/40 p-4">
                    <div className="flex gap-3">
                      <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Contato</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {selectedAddress.contact}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/40 p-4">
                    <div className="flex gap-3">
                      <Accessibility className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Acessibilidade</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {selectedAddress.accessibility}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-4">
                  <div className="flex gap-3">
                    <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        Próximos eventos
                      </p>
                      {isLoadingServices ? (
                        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          Carregando agenda...
                        </div>
                      ) : upcomingServices.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          {upcomingServices.map((service) => (
                            <div
                              key={service.id}
                              className="flex flex-col gap-1 rounded-xl border border-border bg-background/70 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <span className="mb-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary dark:text-white">
                                  {categoryLabels[service.category] || 'Evento'}
                                </span>
                                <p className="text-sm font-semibold text-foreground">
                                  {service.title}
                                </p>
                                <p className="text-xs capitalize text-muted-foreground">
                                  {formatServiceDate(service.event_date)}
                                </p>
                              </div>
                              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                                <Clock className="h-4 w-4 text-primary" />
                                {service.event_time?.slice(0, 5) || 'A definir'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Nenhum evento futuro cadastrado para esta congregação.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleCopy(selectedAddress.fullAddress)}
                    className="rounded-xl transition-transform duration-200 hover:scale-105"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar endereço
                  </Button>
                  <Button
                    type="button"
                    onClick={() => window.open(selectedAddress.mapUrl, '_blank')}
                    className="rounded-xl transition-transform duration-200 hover:scale-105"
                  >
                    <Map className="mr-2 h-4 w-4" />
                    Como chegar
                  </Button>
                </div>
              </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default AddressesPage;
