import React, { useState, useEffect } from 'react';
import { CalendarDays, Info, MapPin, Menu, Moon, PlayCircle, Sun, X } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { getPreferredTheme, saveTheme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { forgetAdminDevice, isAdminSessionFresh } from '@/lib/adminDevice';
import { smoothScrollTo, smoothScrollToElement } from '@/lib/smoothScroll';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [theme, setTheme] = useState(() => getPreferredTheme());
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      
      if (location.pathname === '/') {
        const sections = ['agenda', 'localizacoes', 'sobre'];
        const scrollPosition = window.scrollY + 100;
        
        let found = false;
        for (const section of sections) {
          const element = document.getElementById(section);
          if (element) {
            const offsetTop = element.offsetTop;
            const offsetBottom = offsetTop + element.offsetHeight;
            
            if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
              setActiveSection(section);
              found = true;
              break;
            }
          }
        }
        if (!found) setActiveSection('');
      } else {
        setActiveSection(location.pathname.substring(1));
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  useEffect(() => {
    const checkAdminAccess = async (session) => {
      if (!session) {
        setIsAdmin(false);
        return;
      }

      if (!isAdminSessionFresh()) {
        await supabase.auth.signOut();
        forgetAdminDevice();
        setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase.rpc('is_calendar_admin');
      setIsAdmin(!error && data === true);
    };

    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      checkAdminAccess(session);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        checkAdminAccess(session);
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, []);

  const navLinks = [
    { name: 'Agenda e cultos', href: '/#agenda', isAnchor: true, icon: CalendarDays },
    { name: 'Assista', href: '/assistir', isAnchor: false, icon: PlayCircle },
    { name: 'Endereços', href: '/enderecos', isAnchor: false },
    { name: 'Sobre', href: '/sobre', isAnchor: false, icon: Info },
     ...(isAdmin
      ? [{ name: 'Calendário', href: '/calendario', isAnchor: false }]
      : []),
  ];

  const navIconByHref = {
    '/enderecos': MapPin,
    '/calendario': CalendarDays,
  };

  const handleNavClick = (e, link) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    
    if (link.isAnchor) {
      const targetId = link.href.split('#')[1];
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          const element = document.getElementById(targetId);
          if (element) {
            smoothScrollToElement(element);
          }
        }, 100);
      } else {
        const element = document.getElementById(targetId);
        if (element) {
          smoothScrollToElement(element);
        }
      }
    } else {
      navigate(link.href);
      smoothScrollTo(0);
    }
  };

  const isActive = (link) => {
    if (link.isAnchor) {
      return activeSection === link.href.split('#')[1];
    }
    return location.pathname === link.href;
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    saveTheme(nextTheme);
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 border-b border-border/80 transition-all duration-300 ${
        isScrolled 
          ? 'bg-background/85 backdrop-blur-xl shadow-[0_8px_24px_-12px_rgba(15,23,42,0.35)]'
          : 'bg-background/75 backdrop-blur-lg shadow-[0_6px_18px_-14px_rgba(15,23,42,0.3)]'
      }`}
    >
      <nav className="section-container md:pr-20">
        <div className="flex h-16 items-center justify-between md:h-20">
          <Link 
            to="/" 
            onClick={() => smoothScrollTo(0)}
            className="flex items-center gap-3 group"
          >
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary transition-transform duration-200 group-hover:scale-105 md:h-12 md:w-12">
              <img 
                src="https://i.imgur.com/SA53Yxc.png"
                alt="Logo da Assembleia de Deus"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <span className="hidden text-lg font-bold text-foreground sm:block md:text-xl">
              Assembleia de Deus da Lapa
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link)}
                  className={`font-medium transition-all duration-200 relative ${
                    isActive(link)
                      ? 'text-primary'
                      : 'text-foreground/70 hover:text-primary'
                  }`}
                >
                  {link.name}
                  {isActive(link) && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </a>
              ))}
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-muted/70 text-foreground transition-all hover:border-primary/40 hover:text-primary md:hidden"
              aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
              title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
            >
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`md:hidden flex h-9 w-9 items-center justify-center rounded-xl border transition-colors duration-200 ${
                isMobileMenuOpen
                  ? 'border-secondary text-foreground'
                  : 'border-border bg-muted/70 text-foreground hover:border-primary/40 hover:text-primary'
              }`}
              aria-label="Abrir menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border py-2">
            <div className="flex flex-col gap-1 rounded-b-2xl bg-background/95 py-1">
              {navLinks.map((link) => {
                const LinkIcon = link.icon ?? navIconByHref[link.href] ?? Info;

                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link)}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors duration-200 ${
                      isActive(link)
                        ? 'border-primary/25 bg-primary/10 text-primary'
                        : 'border-border/70 bg-muted/35 text-foreground/75 hover:border-primary/30 hover:bg-muted hover:text-primary'
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        isActive(link)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-primary'
                      }`}
                    >
                      <LinkIcon className="h-4 w-4" />
                    </span>
                    <span>{link.name}</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <button
        type="button"
        onClick={toggleTheme}
        className="absolute right-5 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-border bg-muted/70 text-foreground transition-all hover:border-primary/40 hover:text-primary md:flex"
        aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
        title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
      >
        {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
      </button>
    </header>
  );
};

export default Header;
