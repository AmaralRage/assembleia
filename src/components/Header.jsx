import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, Info, MapPin, Moon, PlayCircle, Sun } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { getPreferredTheme, saveTheme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { forgetAdminDevice, isAdminSessionFresh } from '@/lib/adminDevice';
import { smoothScrollTo, smoothScrollToElement } from '@/lib/smoothScroll';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [theme, setTheme] = useState(() => getPreferredTheme());
  const [isAdmin, setIsAdmin] = useState(false);
  const [isYouTubeLive, setIsYouTubeLive] = useState(false);
  const scrollFrameRef = useRef(null);
  const isScrolledRef = useRef(false);
  const activeSectionRef = useRef('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let isCurrentRequest = true;

    const checkYouTubeLiveStatus = async () => {
      const { data, error } = await supabase.functions.invoke('youtube-latest-videos');
      if (isCurrentRequest && !error) {
        setIsYouTubeLive(Boolean(data?.liveStream));
      }
    };

    checkYouTubeLiveStatus();
    const intervalId = window.setInterval(checkYouTubeLiveStatus, 60000);

    return () => {
      isCurrentRequest = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const updateScrollState = () => {
      scrollFrameRef.current = null;

      const nextIsScrolled = window.scrollY > 20;
      if (isScrolledRef.current !== nextIsScrolled) {
        isScrolledRef.current = nextIsScrolled;
        setIsScrolled(nextIsScrolled);
      }

      let nextActiveSection = '';

      if (location.pathname === '/') {
        const sections = ['agenda', 'localizacoes', 'sobre'];
        const scrollPosition = window.scrollY + 100;

        for (const section of sections) {
          const element = document.getElementById(section);
          if (element) {
            const offsetTop = element.offsetTop;
            const offsetBottom = offsetTop + element.offsetHeight;
            
            if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
              nextActiveSection = section;
              break;
            }
          }
        }
      } else {
        nextActiveSection = location.pathname.substring(1);
      }

      if (activeSectionRef.current !== nextActiveSection) {
        activeSectionRef.current = nextActiveSection;
        setActiveSection(nextActiveSection);
      }
    };

    const handleScroll = () => {
      if (scrollFrameRef.current) return;
      scrollFrameRef.current = window.requestAnimationFrame(updateScrollState);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateScrollState();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollFrameRef.current) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
    };
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

  const handleNavClick = (e, link, { mobile = false } = {}) => {
    e.preventDefault();

    if (mobile && link.href === '/#agenda') {
      if (location.pathname === '/') {
        smoothScrollTo(0);
      } else {
        navigate('/');
      }
      return;
    }
    
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
      if (location.pathname === link.href) {
        smoothScrollTo(0);
      } else {
        navigate(link.href);
      }
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
    <>
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
            onClick={() => {
              if (location.pathname === '/') smoothScrollTo(0);
            }}
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
              Assembleia de Deus na Lapa
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link)}
                  className={`relative font-medium transition-all duration-200 hover:scale-105 ${
                    isActive(link)
                      ? 'text-primary'
                      : 'text-foreground/70 hover:text-primary'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {link.name}
                    {link.href === '/assistir' && (
                      <AnimatePresence>
                        {isYouTubeLive && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.25 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.25 }}
                            transition={{
                              opacity: { duration: 0.3 },
                              scale: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                            }}
                            className="relative flex h-2.5 w-2.5"
                            aria-label="Culto ao vivo"
                          >
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-70" />
                            <span className="header-live-pulse relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    )}
                  </span>
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

          </div>
        </div>
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

      <div className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-[60] flex w-[min(23rem,calc(100%-1.5rem))] -translate-x-1/2 items-center justify-around rounded-[1.75rem] border border-border bg-background/95 p-1.5 text-foreground shadow-[0_18px_45px_-12px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-primary/20 dark:bg-[#071526]/95 dark:shadow-[0_18px_45px_-12px_rgba(0,0,0,0.8)] md:hidden">
        {navLinks.map((link) => {
          const Icon = link.icon ?? navIconByHref[link.href] ?? Info;
          const mobileLabel =
            link.href === '/#agenda'
              ? 'Agenda'
              : link.href === '/assistir'
                ? 'Assistir'
                : link.name;

          return (
            <a
              key={link.href}
              href={link.href}
              onClick={(event) => handleNavClick(event, link, { mobile: true })}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[9px] font-semibold transition-colors ${
                isActive(link)
                  ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300'
                  : 'text-muted-foreground hover:bg-muted hover:text-primary dark:text-blue-300/65 dark:hover:bg-primary/10 dark:hover:text-blue-200'
              }`}
            >
              <span className="relative">
                <Icon className="h-4 w-4" />
                {link.href === '/assistir' && (
                  <AnimatePresence>
                    {isYouTubeLive && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.25 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.25 }}
                        transition={{
                          opacity: { duration: 0.3 },
                          scale: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                        }}
                        className="absolute -right-2 -top-1 flex h-2.5 w-2.5"
                      >
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-70" />
                        <span className="header-live-pulse relative inline-flex h-2.5 w-2.5 rounded-full border border-background bg-red-500" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                )}
              </span>
              <span className="max-w-full truncate">{mobileLabel}</span>
            </a>
          );
        })}
      </div>
    </>
  );
};

export default Header;
