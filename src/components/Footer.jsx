import React from 'react';
import { MapPin, Calendar, Youtube, Instagram, Facebook } from 'lucide-react';

const Footer = () => {
  const socialLinks = {
    instagram: "#",
    facebook: "https://www.facebook.com/people/Ieadlapa-Rio/100089125852506/",
    youtube: "https://www.youtube.com/@AssembleiadeDeusnaLapa",
  };

  const handleNavClick = (e, href) => {
    e.preventDefault();

    if (href === "#agenda") {
      window.location.href = "/#agenda";
      return;
    }

    if (href === "#enderecos") {
      window.location.href = "/enderecos";
      return;
    }

    const element = document.querySelector(href);

    if (element) {
      const offset = 80;
      const elementPosition = element.offsetTop - offset;

      window.scrollTo({
        top: elementPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-100">
      <div className="section-container py-10 md:py-12">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 md:gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-secondary" />
              <h3 className="font-semibold text-lg">Agenda</h3>
            </div>
            <a
              href="#agenda"
              onClick={(e) => handleNavClick(e, '#agenda')}
              className="inline-block text-sm md:text-base text-slate-300 hover:text-secondary hover:scale-105 transition-all duration-200"
            >
              Ver agenda de cultos
            </a>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-secondary" />
              <h3 className="font-semibold text-lg">Localização</h3>
            </div>
            <a
              href="#enderecos"
              onClick={(e) => handleNavClick(e, '#enderecos')}
              className="inline-block text-sm md:text-base text-slate-300 hover:text-secondary hover:scale-105 transition-all duration-200"
            >
              Ver endereços
            </a>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Youtube className="w-5 h-5 text-secondary" />
              <h3 className="font-semibold text-lg">YouTube</h3>
            </div>
            <a
              href={socialLinks.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm md:text-base text-slate-300 hover:text-secondary hover:scale-105 transition-all duration-200"
            >
              Acessar canal
            </a>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Instagram className="w-5 h-5 text-secondary" />
              <h3 className="font-semibold text-lg">Instagram</h3>
            </div>
            <a
              href={socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm md:text-base text-slate-300 hover:text-secondary hover:scale-105 transition-all duration-200"
            >
              Ver Instagram
            </a>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Facebook className="w-5 h-5 text-secondary" />
              <h3 className="font-semibold text-lg">Facebook</h3>
            </div>
            <a
              href={socialLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm md:text-base text-slate-300 hover:text-secondary hover:scale-105 transition-all duration-200"
            >
              Ver Facebook
            </a>
          </div>
        </div>

        <div className="mt-8 md:mt-10 pt-6 border-t border-slate-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden">
                <img
                  src="https://i.imgur.com/SA53Yxc.png"
                  alt="Logo da Assembleia de Deus"
                  className="w-full h-full object-cover"
                />
              </div>

              <span className="font-semibold">Assembleia de Deus da Lapa</span>
            </div>

            <div className="text-center md:text-right">
              <p className="text-slate-400 text-sm">
                © {new Date().getFullYear()} Assembleia de Deus. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
