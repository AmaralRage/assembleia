import React, { useState, useEffect } from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { getPreferredTheme, saveTheme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { forgetAdminDevice, isAdminSessionFresh } from '@/lib/adminDevice';

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
    { name: 'Agenda e cultos', href: '/#agenda', isAnchor: true },
    { name: 'Assista', href: '/assistir', isAnchor: false },
    { name: 'Endereços', href: '/enderecos', isAnchor: false },
    { name: 'Sobre', href: '/sobre', isAnchor: false },
     ...(isAdmin
      ? [{ name: 'Calendário', href: '/calendario', isAnchor: false }]
      : []),
  ];

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
            const offset = 80;
            const elementPosition = element.offsetTop - offset;
            window.scrollTo({ top: elementPosition, behavior: 'smooth' });
          }
        }, 100);
      } else {
        const element = document.getElementById(targetId);
        if (element) {
          const offset = 80;
          const elementPosition = element.offsetTop - offset;
          window.scrollTo({ top: elementPosition, behavior: 'smooth' });
        }
      }
    } else {
      navigate(link.href);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <div className="flex items-center justify-between h-20">
          <Link 
            to="/" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 group"
          >
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 overflow-hidden">
              <img 
                src="https://i.imgur.com/SA53Yxc.png"
                alt="Logo da Assembleia de Deus"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-bold text-xl text-foreground hidden sm:block">
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
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted/70 text-foreground transition-all hover:border-primary/40 hover:text-primary md:hidden"
              aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
              title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
            >
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`md:hidden flex h-10 w-10 items-center justify-center rounded-xl border transition-colors duration-200 ${
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
          <div className="md:hidden max-h-[calc(100dvh-5rem)] overflow-y-auto border-t border-border py-3">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link)}
                  className={`rounded-xl px-3 py-3 font-medium transition-colors duration-200 ${
                    isActive(link)
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/70 hover:bg-muted hover:text-primary'
                  }`}
                >
                  {link.name}
                </a>
              ))}
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
