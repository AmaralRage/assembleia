import React from 'react';
import { MapPin, Calendar, Youtube, Instagram, Facebook } from 'lucide-react';

import { smoothScrollToElement } from '@/lib/smoothScroll';

const Footer = () => {
  const socialLinks = {
    instagram: "",
    facebook: "https://www.facebook.com/people/Ieadlapa-Rio/100089125852506/",
    youtube: "https://www.youtube.com/@AssembleiadeDeusnaLapa",
  };

  const footerItems = [
    {
      icon: Calendar,
      title: "Agenda",
      href: "#agenda",
      label: "Ver agenda de cultos",
      internal: true,
    },
    {
      icon: MapPin,
      title: "Localização",
      href: "#enderecos",
      label: "Ver endereços",
      internal: true,
    },
    {
      icon: Youtube,
      title: "YouTube",
      href: socialLinks.youtube,
      label: "Acessar canal",
    },
    {
      icon: Instagram,
      title: "Instagram",
      href: socialLinks.instagram,
      label: "Ver Instagram",
    },
    {
      icon: Facebook,
      title: "Facebook",
      href: socialLinks.facebook,
      label: "Ver Facebook",
    },
  ].filter((item) => item.href);

  const handleNavClick = (e, href) => {
    e.preventDefault();

    if (href === "#agenda") {
      if (window.location.pathname !== "/") {
        window.location.href = "/#agenda";
        return;
      }

      const agenda = document.querySelector("#agenda");
      smoothScrollToElement(agenda);
      return;
    }

    if (href === "#enderecos") {
      window.location.href = "/enderecos";
      return;
    }

    const element = document.querySelector(href);

    if (element) {
      smoothScrollToElement(element);
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-100">
      <div className="section-container py-10 md:py-12">
        <div className="grid grid-cols-2 gap-6 md:gap-10 lg:grid-cols-4">
          {footerItems.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title}>
                <div className="flex items-center gap-2 mb-4">
                  <Icon className="w-5 h-5 text-secondary" />
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                </div>
                <a
                  href={item.href}
                  onClick={item.internal ? (e) => handleNavClick(e, item.href) : undefined}
                  target={item.internal ? undefined : "_blank"}
                  rel={item.internal ? undefined : "noopener noreferrer"}
                  className="inline-block text-sm md:text-base text-slate-300 hover:text-secondary hover:scale-105 transition-all duration-200"
                >
                  {item.label}
                </a>
              </div>
            );
          })}
        </div>

        <div className="mt-8 md:mt-10 pt-6 border-t border-slate-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden">
                <img
                  src="https://i.imgur.com/SA53Yxc.png"
                  alt="Logo da Assembleia de Deus"
                  className="w-full h-full rounded-full object-cover"
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
