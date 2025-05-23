
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

  // Close menu if we switch from mobile to desktop
  useEffect(() => {
    if (!isMobile && isOpen) {
      setIsOpen(false);
    }
  }, [isMobile, isOpen]);

  // Block body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, isMobile]);

  return (
    <nav 
      className="sticky top-0 z-50 bg-finance-dark/95 backdrop-blur-sm border-b border-finance-steel/20" 
      aria-label={st('navigation.main', 'Main navigation')}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link 
            to="/" 
            className="flex-shrink-0 flex items-center md:hidden"
            aria-label={st('navigation.homeLink', 'The Pricing Library Home')}
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
              aria-label={isOpen ? st('navbar.closeMenu', 'Close navigation menu') : st('navbar.openMenu', 'Open navigation menu')}
            >
              <span className="sr-only">{isOpen ? st('navbar.closeMenu', 'Close menu') : st('navbar.openMenu', 'Open menu')}</span>
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
