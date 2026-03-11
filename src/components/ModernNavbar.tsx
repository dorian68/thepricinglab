
import React, { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import DesktopNav from "./navigation/DesktopNav";
import MobileNav from "./navigation/MobileNav";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { safeTranslate } from "../utils/translationUtils";

const ModernNavbar = () => {
  const { t } = useTranslation();
  const st = (key: string, defaultValue: string) => safeTranslate(t, key, defaultValue);
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isMobile && isOpen) setIsOpen(false);
  }, [isMobile, isOpen]);

  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen, isMobile]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled 
          ? 'bg-background/98 backdrop-blur-md border-border shadow-sm' 
          : 'bg-background/95 backdrop-blur-sm border-border/50'
      }`}
      aria-label={st('navigation.main', 'Main navigation')}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link 
            to="/" 
            className="flex-shrink-0 flex items-center lg:hidden"
            aria-label={st('navigation.homeLink', 'The Pricing Library Home')}
          >
            <span className="terminal-text text-sm font-bold tracking-wider">TPL</span>
          </Link>
          
          <DesktopNav />
          
          <div className="flex lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2.5 min-w-[44px] min-h-[44px] rounded-md text-foreground hover:text-primary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-colors"
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              aria-label={isOpen ? st('navbar.closeMenu', 'Close navigation menu') : st('navbar.openMenu', 'Open navigation menu')}
            >
              <span className="sr-only">{isOpen ? st('navbar.closeMenu', 'Close menu') : st('navbar.openMenu', 'Open menu')}</span>
              <Menu className="block h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <MobileNav isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </nav>
  );
};

export default ModernNavbar;
