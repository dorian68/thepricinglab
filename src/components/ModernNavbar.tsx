
import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import DesktopNav from "./navigation/DesktopNav";
import MobileNav from "./navigation/MobileNav";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const ModernNavbar = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // Bloquer le scroll du body quand le menu mobile est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  return (
    <nav className="sticky top-0 z-50 bg-finance-dark/95 backdrop-blur-sm border-b border-finance-steel/20" aria-label="Navigation principale">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link 
            to="/" 
            className="flex-shrink-0 flex items-center md:hidden"
            aria-label="Accueil The Pricing Library"
          >
            <span className="terminal-text text-finance-accent text-xl font-bold">TPL</span>
          </Link>
          
          <DesktopNav />
          
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-finance-offwhite hover:text-finance-accent focus:outline-none focus:ring-2 focus:ring-inset focus:ring-finance-accent"
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              aria-label={isOpen ? "Fermer le menu de navigation" : "Ouvrir le menu de navigation"}
            >
              <span className="sr-only">{isOpen ? t('navigation.closeMenu') : t('navigation.openMenu')}</span>
              <Menu className="block h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <MobileNav isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </nav>
  );
};

export default ModernNavbar;
