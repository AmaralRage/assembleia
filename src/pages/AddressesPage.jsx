import React, { useState } from 'react';
import { Helmet } from "react-helmet-async";
import { motion } from 'framer-motion';
import { Home, Search, Map, Copy, Info, MapPin } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast, Toaster } from 'sonner';

const AddressesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const addresses = [
    {
      id: 1,
      name: 'Assembleia de Deus da Lapa - Centro',
      city: 'Rio de Janeiro',
      state: 'RJ',
      fullAddress: 'Rua Joaquim Silva 52 - Centro - Rio de Janeiro - RJ - Brasil',
      image: 'https://i.imgur.com/WMVJQ9m.jpeg',
      mapUrl: 'https://maps.google.com/?q=Rua+Joaquim+Silva+52+Centro+Rio+de+Janeiro+RJ+Brasil'
    },
    {
      id: 2,
      name: 'Assembleia de Deus - Vila Nova',
      city: 'São Paulo',
      state: 'SP',
      fullAddress: 'Avenida Paulista, 1000 - Vila Nova, São Paulo, SP',
      image: 'https://images.unsplash.com/photo-1609926795947-0738627824c5',
      mapUrl: 'https://maps.google.com/?q=Avenida+Paulista,+1000+-+Vila+Nova,+São+Paulo,+SP'
    }
  ];

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

  return (
    <>
      <Helmet>
        <title>Endereços - Assembleia de Deus da Lapa</title>
        <meta name="description" content="Encontre uma Assembleia de Deus da Lapa mais próxima de você." />
      </Helmet>

      <Header />
      <Toaster position="top-right" />

      <main className="min-h-screen pt-28 pb-24 bg-background">
        <div className="section-container">
          
          <div className="flex flex-col items-center justify-center text-center mb-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6"
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
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-border focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <Search className="w-5 h-5 text-muted-foreground ml-3" />
              <Input 
                type="text"
                placeholder="Busque por cidade, estado ou nome da igreja..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-2 text-base shadow-none bg-transparent"
              />
              <Button onClick={() => {}} className="rounded-lg px-6">
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
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="text-xs font-semibold text-foreground">
                          {address.city}, {address.state}
                        </span>
                      </div>
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
                          className="flex flex-col gap-1.5 h-auto py-3 bg-muted/50 hover:bg-muted border-transparent hover:border-border"
                        >
                          <Copy className="w-4 h-4 text-primary" />
                          <span className="text-xs font-medium text-foreground">Copiar</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => window.open(address.mapUrl, '_blank')}
                          className="flex flex-col gap-1.5 h-auto py-3 bg-muted/50 hover:bg-muted border-transparent hover:border-border"
                        >
                          <Map className="w-4 h-4 text-primary" />
                          <span className="text-xs font-medium text-foreground">Mapa</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toast('Mais informações em breve.')}
                          className="flex flex-col gap-1.5 h-auto py-3 bg-muted/50 hover:bg-muted border-transparent hover:border-border"
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

      <Footer />
    </>
  );
};

export default AddressesPage;