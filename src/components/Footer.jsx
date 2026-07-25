import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  Facebook,
  Info,
  Instagram,
  MapPin,
  PlayCircle,
  UserPlus,
  Youtube,
} from 'lucide-react';

import { smoothScrollToElement } from '@/lib/smoothScroll';
import { formatEventTime, formatWeekDay, getTodayKey } from '@/lib/calendar';
import { supabase } from '@/lib/supabase';

const socialLinks = [
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/people/Ieadlapa-Rio/100089125852506/',
    icon: Facebook,
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/adl.sedeoficial/',
    icon: Instagram,
  },
  {
    name: 'YouTube',
    href: 'https://www.youtube.com/@AssembleiadeDeusnaLapa',
    icon: Youtube,
  },
];

const linkGroups = [
  {
    title: 'Navegação',
    links: [
      { label: 'Agenda', href: '/#agenda', icon: CalendarDays },
      { label: 'Endereços', href: '/enderecos', icon: MapPin },
      { label: 'Sou novo aqui', href: '/sou-novo', icon: UserPlus },
    ],
  },
  {
    title: 'Conteúdo',
    links: [
      { label: 'Assista', href: '/assistir', icon: PlayCircle },
      { label: 'Sobre a igreja', href: '/sobre', icon: Info },
      { label: 'YouTube', href: socialLinks[2].href, external: true, icon: Youtube },
    ],
  },
  {
    title: 'Social',
    links: socialLinks.slice(0, 2).map(({ name, href, icon }) => ({
      label: name,
      href,
      external: true,
      icon,
    })),
  },
];

const Footer = () => {
  const [nextService, setNextService] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadNextService = async () => {
      const now = new Date();
      const { data, error } = await supabase
        .from('calendar_events')
        .select('id, title, event_date, event_time, category')
        .gte('event_date', getTodayKey())
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true })
        .limit(24);

      if (!isMounted || error) return;

      const upcomingService = (data || []).find((event) => {
        const isService = event.category === 'culto'
          || event.title?.toLocaleLowerCase('pt-BR').includes('culto');

        if (!isService) return false;
        if (!event.event_date) return false;
        if (!event.event_time) return event.event_date >= getTodayKey();

        const [year, month, day] = event.event_date.split('-').map(Number);
        const [hour = 0, minute = 0] = event.event_time.split(':').map(Number);
        return new Date(year, month - 1, day, hour, minute) > now;
      });

      setNextService(upcomingService || null);
    };

    loadNextService();
    const refreshId = window.setInterval(loadNextService, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      window.clearInterval(refreshId);
    };
  }, []);

  const handleInternalClick = (event, href) => {
    if (href !== '/#agenda') return;

    event.preventDefault();

    if (window.location.pathname !== '/') {
      window.location.href = href;
      return;
    }

    smoothScrollToElement(document.querySelector('#agenda'));
  };

  return (
    <footer className="site-footer">
      <div className="site-footer__container section-container">
        <div className="site-footer__content">
          <div className="site-footer__brand">
            <a
              href="/"
              aria-label="Ir para a página inicial"
              className="site-footer__brand-link"
            >
              <span className="site-footer__logo-wrap">
                <img
                  src="/logo.png"
                  alt=""
                  className="site-footer__logo"
                />
              </span>
              <span className="site-footer__name">
                Assembleia de Deus na Lapa
              </span>
            </a>

            <p className="site-footer__description">
              Uma igreja bíblica, relevante e acolhedora.
              <br />
              Conecte-se conosco e faça parte desta família de fé.
            </p>

            <div className="site-footer__socials" aria-label="Redes sociais">
              {socialLinks.map(({ name, href, icon: Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Acessar ${name}`}
                  title={name}
                  className="site-footer__social-link"
                >
                  <Icon className="site-footer__social-icon" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <div className="site-footer__right">
            <nav
              aria-label="Links do rodapé"
              className="site-footer__navigation"
            >
              {linkGroups.map((group) => (
                <div key={group.title} className="site-footer__group">
                  <h2 className="site-footer__heading">
                    {group.title}
                  </h2>
                  <ul className="site-footer__links">
                    {group.links.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          onClick={link.external ? undefined : (event) => handleInternalClick(event, link.href)}
                          target={link.external ? '_blank' : undefined}
                          rel={link.external ? 'noopener noreferrer' : undefined}
                          className="site-footer__link"
                        >
                          <link.icon className="site-footer__link-icon" aria-hidden="true" />
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>

            {nextService && (
              <div className="site-footer__next-service" aria-label="Próximo culto">
                <span className="site-footer__next-service-label">Próximo culto</span>
                <strong className="site-footer__next-service-time">
                  {formatWeekDay(nextService.event_date)} — {nextService.event_time
                    ? `${formatEventTime(nextService.event_time)}h`
                    : 'Horário a definir'}
                </strong>
              </div>
            )}
          </div>
        </div>

        <div className="site-footer__bottom">
          <div className="site-footer__legal">
            <p>© {new Date().getFullYear()} Assembleia de Deus na Lapa.</p>
            <p>Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
