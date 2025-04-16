
import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  X, Home, BookOpen, Dumbbell, Users, CreditCard, Wrench, FileText, Bug, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "../LanguageSwitcher";
import MobileNavSection from "./MobileNavSection";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileNav = ({ isOpen, onClose }: MobileNavProps) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="md:hidden">
      <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-finance-charcoal">
        <div className="flex justify-between items-center mb-4 px-3">
          <h2 className="text-finance-accent font-bold">Menu</h2>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center p-2 rounded-md text-finance-offwhite hover:text-finance-accent focus:outline-none"
          >
            <span className="sr-only">{t('navbar.closeMenu')}</span>
            <X className="block h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        
        <Link
          to="/"
          className="flex items-center px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
        >
          <Home className="w-4 h-4 mr-2" />
          {t('navbar.home')}
        </Link>
        
        {/* Mobile Courses */}
        <MobileNavSection title="Cours" icon={BookOpen}>
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
        </MobileNavSection>
        
        {/* Mobile Training Lab - Highlighted */}
        <MobileNavSection 
          title="Training Lab" 
          icon={Dumbbell} 
          highlighted={true}
        >
          <Link
            to="/exercises"
            className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
          >
            Exercices Interactifs
          </Link>
          <Link
            to="/survival-mode"
            className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
          >
            Mode Survie
          </Link>
          <Link
            to="/quizzes"
            className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
          >
            Quiz Progressifs
          </Link>
          <Link
            to="/advanced-simulations"
            className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
          >
            Simulations Avancées
          </Link>
          <Link
            to="/progress"
            className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
          >
            Progression & Badges
          </Link>
        </MobileNavSection>

        {/* Mobile Trading Lab - New Section */}
        <MobileNavSection 
          title="Trading Lab" 
          icon={BarChart3} 
        >
          <Link
            to="/trading/exercises"
            className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
          >
            Exercices
          </Link>
          <Link
            to="/trading/backtest"
            className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
          >
            Backtest
          </Link>
          <Link
            to="/trading/scenarios"
            className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
          >
            Scénarios
          </Link>
          <Link
            to="/trading/strategies"
            className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
          >
            Stratégies
          </Link>
          <Link
            to="/trading/performance"
            className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
          >
            Performances
          </Link>
        </MobileNavSection>
        
        {/* Mobile Community */}
        <MobileNavSection title={t('navbar.community')} icon={Users}>
          <Link
            to="/community/forum"
            className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
          >
            Forum & Chat
          </Link>
          <Link
            to="/community/challenges"
            className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
          >
            Défis Hebdomadaires
          </Link>
          <Link
            to="/community/pair-programming"
            className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
          >
            Pair Programming
          </Link>
          <Link
            to="/community/leaderboard"
            className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
          >
            Leaderboard & Hackathons
          </Link>
        </MobileNavSection>
        
        {/* Mobile Pricing */}
        <Link
          to="/pricing"
          className="flex items-center px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Tarifs
        </Link>
        
        {/* Mobile Tools */}
        <MobileNavSection title="Outils" icon={Wrench}>
          <Link
            to="/tools/volatility-calculator"
            className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
          >
            Calculatrices de Volatilité
          </Link>
          <Link
            to="/tools/black-scholes"
            className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
          >
            Simulateur Black-Scholes
          </Link>
          <Link
            to="/tools/monte-carlo"
            className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
          >
            Monte Carlo
          </Link>
          <Link
            to="/tools/model-calibration"
            className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
          >
            Calibration de Modèles
          </Link>
        </MobileNavSection>
        
        {/* Mobile Blog */}
        <Link
          to="/blog"
          className="flex items-center px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
        >
          <FileText className="w-4 h-4 mr-2" />
          Blog
        </Link>
        
        {/* Mobile Bug Report */}
        <Link
          to="/bug-report"
          className="flex items-center px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
        >
          <Bug className="w-4 h-4 mr-2" />
          {t('navbar.bugs')}
        </Link>
        
        <div className="mt-3 flex justify-start px-3">
          <LanguageSwitcher />
        </div>
        <div className="pt-4 pb-3 border-t border-finance-steel/20">
          <Button variant="financeOutline" size="sm" className="w-full mb-2" asChild>
            <Link to="/login">
              {t('navbar.login')}
            </Link>
          </Button>
          <Button variant="finance" size="sm" className="w-full" asChild>
            <Link to="/signup">
              {t('navbar.signup')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MobileNav;
