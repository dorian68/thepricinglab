
import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

const ModernNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <nav className="sticky top-0 z-50 bg-finance-dark/95 backdrop-blur-sm border-b border-finance-steel/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="terminal-text text-finance-accent text-xl font-bold">THE PRICING LAB</span>
            </Link>
            <div className="hidden md:block ml-10">
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <Link to="/" className={navigationMenuTriggerStyle()}>
                      {t('navbar.home')}
                    </Link>
                  </NavigationMenuItem>
                  
                  <NavigationMenuItem>
                    <NavigationMenuTrigger>{t('navbar.courses')}</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid grid-cols-2 gap-3 p-4 w-[500px]">
                        <div>
                          <h3 className="font-medium text-sm mb-1 text-finance-accent">Fondamentaux</h3>
                          <ul className="space-y-2">
                            <li>
                              <Link 
                                to="/courses/fundamentals/black-scholes"
                                className="block text-sm p-2 hover:bg-finance-charcoal/50 rounded-md"
                              >
                                {t('coursesPage.fundamentals.blackScholes.title')}
                              </Link>
                            </li>
                            <li>
                              <Link 
                                to="/courses/fundamentals/yield-curves"
                                className="block text-sm p-2 hover:bg-finance-charcoal/50 rounded-md"
                              >
                                {t('coursesPage.fundamentals.yieldCurves.title')}
                              </Link>
                            </li>
                            <li>
                              <Link 
                                to="/courses/fundamentals/greeks"
                                className="block text-sm p-2 hover:bg-finance-charcoal/50 rounded-md"
                              >
                                {t('coursesPage.fundamentals.greeks.title')}
                              </Link>
                            </li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium text-sm mb-1 text-finance-accent">Avancé</h3>
                          <ul className="space-y-2">
                            <li>
                              <Link 
                                to="/courses/advanced/implied-vol"
                                className="block text-sm p-2 hover:bg-finance-charcoal/50 rounded-md"
                              >
                                {t('coursesPage.advanced.impliedVol.title')}
                              </Link>
                            </li>
                            <li>
                              <Link 
                                to="/courses/advanced/vol-products"
                                className="block text-sm p-2 hover:bg-finance-charcoal/50 rounded-md"
                              >
                                {t('coursesPage.advanced.volProducts.title')}
                              </Link>
                            </li>
                          </ul>
                          <h3 className="font-medium text-sm mt-3 mb-1 text-finance-accent">Complexe</h3>
                          <ul className="space-y-2">
                            <li>
                              <Link 
                                to="/courses/complex/exotic-options"
                                className="block text-sm p-2 hover:bg-finance-charcoal/50 rounded-md"
                              >
                                {t('coursesPage.complex.exotic.title')}
                              </Link>
                            </li>
                            <li>
                              <Link 
                                to="/courses/complex/monte-carlo"
                                className="block text-sm p-2 hover:bg-finance-charcoal/50 rounded-md"
                              >
                                {t('coursesPage.complex.monteCarlo.title')}
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                  
                  <NavigationMenuItem>
                    <NavigationMenuTrigger>Entraînement</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="p-4 w-[380px]">
                        <ul className="space-y-3">
                          <li>
                            <Link 
                              to="/exercises"
                              className="flex p-2 hover:bg-finance-charcoal/50 rounded-md"
                            >
                              <div className="mr-3 text-finance-accent">📝</div>
                              <div>
                                <div className="font-medium">Exercices</div>
                                <div className="text-sm text-finance-lightgray">Exercices guidés par niveau</div>
                              </div>
                            </Link>
                          </li>
                          <li>
                            <Link 
                              to="/survival-mode"
                              className="flex p-2 hover:bg-finance-charcoal/50 rounded-md"
                            >
                              <div className="mr-3 text-finance-accent">⚡</div>
                              <div>
                                <div className="font-medium">Mode Survie</div>
                                <div className="text-sm text-finance-lightgray">Défis chronométrés par difficulté</div>
                              </div>
                            </Link>
                          </li>
                          <li>
                            <Link 
                              to="/practice"
                              className="flex p-2 hover:bg-finance-charcoal/50 rounded-md"
                            >
                              <div className="mr-3 text-finance-accent">🏆</div>
                              <div>
                                <div className="font-medium">Tous les exercices</div>
                                <div className="text-sm text-finance-lightgray">Vue complète des exercices et défis</div>
                              </div>
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                  
                  <NavigationMenuItem>
                    <Link to="/community" className={navigationMenuTriggerStyle()}>
                      {t('navbar.community')}
                    </Link>
                  </NavigationMenuItem>
                  
                  <NavigationMenuItem>
                    <Link to="/pricing" className={navigationMenuTriggerStyle()}>
                      Tarifs
                    </Link>
                  </NavigationMenuItem>
                  
                  <NavigationMenuItem>
                    <Link to="/tools" className={navigationMenuTriggerStyle()}>
                      {t('navbar.tools')}
                    </Link>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher />
            <div className="ml-4 flex items-center md:ml-6">
              <Link to="/login" className="finance-button-outline mr-4">
                {t('navbar.login')}
              </Link>
              <Link to="/signup" className="finance-button">
                {t('navbar.signup')}
              </Link>
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-finance-offwhite hover:text-finance-accent focus:outline-none"
            >
              <span className="sr-only">{t('navbar.openMenu')}</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-finance-charcoal">
            <Link
              to="/"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
            >
              {t('navbar.home')}
            </Link>
            <div className="space-y-1 pl-3 border-l border-finance-steel/20">
              <h3 className="px-3 py-1 text-xs text-finance-accent font-medium uppercase">Cours</h3>
              <Link
                to="/courses/fundamentals/black-scholes"
                className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
              >
                {t('coursesPage.fundamentals.blackScholes.title')}
              </Link>
              <Link
                to="/courses/fundamentals/yield-curves"
                className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
              >
                {t('coursesPage.fundamentals.yieldCurves.title')}
              </Link>
              <Link
                to="/courses/fundamentals/greeks"
                className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
              >
                {t('coursesPage.fundamentals.greeks.title')}
              </Link>
              <Link
                to="/courses/advanced/implied-vol"
                className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
              >
                {t('coursesPage.advanced.impliedVol.title')}
              </Link>
            </div>
            <div className="space-y-1 pl-3 border-l border-finance-steel/20">
              <h3 className="px-3 py-1 text-xs text-finance-accent font-medium uppercase">Entraînement</h3>
              <Link
                to="/exercises"
                className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
              >
                Exercices
              </Link>
              <Link
                to="/survival-mode"
                className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
              >
                Mode Survie
              </Link>
            </div>
            <Link
              to="/community"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
            >
              {t('navbar.community')}
            </Link>
            <Link
              to="/pricing"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
            >
              Tarifs
            </Link>
            <Link
              to="/tools"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
            >
              {t('navbar.tools')}
            </Link>
            <div className="mt-3 flex justify-start px-3">
              <LanguageSwitcher />
            </div>
            <div className="pt-4 pb-3 border-t border-finance-steel/20">
              <Link to="/login" className="finance-button-outline block w-full text-center mb-2">
                {t('navbar.login')}
              </Link>
              <Link to="/signup" className="finance-button block w-full text-center">
                {t('navbar.signup')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default ModernNavbar;
