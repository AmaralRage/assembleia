import React from 'react';
import { MapPin, Calendar, Youtube, Instagram, Facebook, UserPlus } from 'lucide-react';

import { smoothScrollToElement } from '@/lib/smoothScroll';

const Footer = () => {
  const socialLinks = {
    instagram: "https://www.instagram.com/adl.sedeoficial/",
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
      icon: UserPlus,
      title: "Sou novo aqui",
      href: "/sou-novo",
      label: "Primeira visita",
      internal: true,
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

    if (href.startsWith("/")) {
      window.location.href = href;
      return;
    }

    const element = document.querySelector(href);

    if (element) {
      smoothScrollToElement(element);
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-100">
      <div className="section-container pb-24 pt-8 md:py-12">
        <div className="grid grid-cols-2 gap-x-5 gap-y-4 md:grid-cols-3 md:gap-10 lg:grid-cols-6">
          {footerItems.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="min-w-0">
                <div className="mb-1 flex min-h-9 items-center gap-2 md:mb-4 md:min-h-11">
                  <Icon className="h-4 w-4 text-secondary md:h-5 md:w-5" />
                  <h3 className="text-base font-semibold md:text-lg">{item.title}</h3>
                </div>
                <a
                  href={item.href}
                  onClick={item.internal ? (e) => handleNavClick(e, item.href) : undefined}
                  target={item.internal ? undefined : "_blank"}
                  rel={item.internal ? undefined : "noopener noreferrer"}
                  className="inline-flex min-h-9 items-center py-1 text-sm text-slate-200 transition-all duration-200 hover:scale-105 hover:text-secondary md:min-h-11 md:py-2 md:text-base"
                >
                  {item.label}
                </a>
              </div>
            );
          })}
        </div>

        <div className="mt-6 border-t border-slate-700 pt-5 md:mt-10 md:pt-6">
          <div className="flex flex-col items-center justify-between gap-3 md:flex-row md:gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white md:h-12 md:w-12">
                <img
                  src="https://i.imgur.com/SA53Yxc.png"
                  alt="Logo da Assembleia de Deus"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>

              <span className="text-sm font-semibold md:text-base">Assembleia de Deus na Lapa</span>
            </div>

            <div className="text-center md:text-right">
              <p className="text-xs leading-relaxed text-slate-400 md:text-sm">
                © {new Date().getFullYear()} Assembleia de Deus na Lapa. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
