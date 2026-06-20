import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      
      if (location.pathname === '/') {
        const sections = ['agenda', 'horarios', 'sobre'];
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

  const navLinks = [
    { name: 'Agenda', href: '/#agenda', isAnchor: true },
    { name: 'Horários', href: '/#horarios', isAnchor: true },
    { name: 'Endereços', href: '/enderecos', isAnchor: false },
    { name: 'Sobre', href: '/sobre', isAnchor: false }
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

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 border-b border-border/80 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-[0_8px_24px_-12px_rgba(15,23,42,0.35)]'
          : 'bg-white/90 backdrop-blur-sm shadow-[0_6px_18px_-14px_rgba(15,23,42,0.3)]'
      }`}
    >
      <nav className="section-container">
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
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-foreground hover:text-primary transition-colors duration-200"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link)}
                  className={`font-medium py-2 transition-colors duration-200 ${
                    isActive(link)
                      ? 'text-primary'
                      : 'text-foreground/70 hover:text-primary'
                  }`}
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
