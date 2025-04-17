import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  X, Home, BookOpen, Dumbbell, Users, CreditCard, Wrench, FileText, Bug, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "../LanguageSwitcher";
import MobileNavSection from "./MobileNavSection";
import { safeTranslate } from "../../utils/translationUtils";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileNav = ({ isOpen, onClose }: MobileNavProps) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-finance-charcoal overflow-y-auto h-full">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <div className="flex justify-between items-center mb-4 px-3">
            <h2 className="text-finance-accent font-bold">Menu</h2>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center p-2 rounded-md text-finance-offwhite hover:text-finance-accent focus:outline-none"
            >
              <span className="sr-only">{safeTranslate(t, 'navbar.closeMenu', 'Close menu')}</span>
              <X className="block h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          
          <Link
            to="/"
            className="flex items-center px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
            onClick={onClose}
          >
            <Home className="w-4 h-4 mr-2" />
            {safeTranslate(t, 'navbar.home', 'Home')}
          </Link>
          
          {/* Mobile Courses */}
          <MobileNavSection title={safeTranslate(t, 'navbar.courses', 'Cours')} icon={BookOpen}>
            <Link
              to="/courses/fundamentals/black-scholes"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
              onClick={onClose}
            >
              {safeTranslate(t, 'coursesPage.fundamentals.blackScholes.title', 'Black-Scholes Model')}
            </Link>
            <Link
              to="/courses/fundamentals/yield-curves"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
              onClick={onClose}
            >
              {safeTranslate(t, 'coursesPage.fundamentals.yieldCurves.title', 'Yield Curves')}
            </Link>
            <Link
              to="/courses/fundamentals/greeks"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
              onClick={onClose}
            >
              {safeTranslate(t, 'coursesPage.fundamentals.greeks.title', 'Option Greeks')}
            </Link>
            <Link
              to="/courses/advanced/implied-vol"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
              onClick={onClose}
            >
              {safeTranslate(t, 'coursesPage.advanced.impliedVol.title', 'Implied Volatility')}
            </Link>
          </MobileNavSection>
          
          {/* Mobile Training Lab - Highlighted */}
          <MobileNavSection 
            title={safeTranslate(t, 'navbar.trainingLab', 'Training Lab')} 
            icon={Dumbbell} 
            highlighted={true}
          >
            <Link
              to="/exercises"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
              onClick={onClose}
            >
              {safeTranslate(t, 'trainingLab.exercises', 'Exercices Interactifs')}
            </Link>
            <Link
              to="/survival-mode"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
              onClick={onClose}
            >
              {safeTranslate(t, 'trainingLab.survivalMode', 'Mode Survie')}
            </Link>
            <Link
              to="/quizzes"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
              onClick={onClose}
            >
              {safeTranslate(t, 'trainingLab.quizzes', 'Quiz Progressifs')}
            </Link>
          </MobileNavSection>

          {/* Mobile Trading Lab - Section */}
          <MobileNavSection 
            title={safeTranslate(t, 'navbar.tradingLab', 'Trading Lab')} 
            icon={BarChart3} 
          >
            <Link
              to="/trading/exercises"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
              onClick={onClose}
            >
              {safeTranslate(t, 'tradingLab.exercises', 'Exercices')}
            </Link>
            <Link
              to="/trading/backtest"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
              onClick={onClose}
            >
              {safeTranslate(t, 'tradingLab.backtest', 'Backtest')}
            </Link>
            <Link
              to="/trading/scenarios"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
              onClick={onClose}
            >
              {safeTranslate(t, 'tradingLab.scenarios', 'Scénarios')}
            </Link>
            <Link
              to="/trading/strategies"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
              onClick={onClose}
            >
              {safeTranslate(t, 'tradingLab.strategies', 'Stratégies')}
            </Link>
            <Link
              to="/trading/performance"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
              onClick={onClose}
            >
              {safeTranslate(t, 'tradingLab.performance', 'Performances')}
            </Link>
          </MobileNavSection>
          
          {/* Mobile Community */}
          <MobileNavSection title={safeTranslate(t, 'navbar.community', 'Communauté')} icon={Users}>
            <Link
              to="/community/forum"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
            >
              {safeTranslate(t, 'community.forum', 'Forum & Chat')}
            </Link>
            <Link
              to="/community/challenges"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
            >
              {safeTranslate(t, 'community.challenges', 'Défis Hebdomadaires')}
            </Link>
            <Link
              to="/community/pair-programming"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
            >
              {safeTranslate(t, 'community.pairProgramming', 'Pair Programming')}
            </Link>
            <Link
              to="/community/leaderboard"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
            >
              {safeTranslate(t, 'community.leaderboard', 'Leaderboard & Hackathons')}
            </Link>
          </MobileNavSection>
          
          {/* Mobile Pricing */}
          <Link
            to="/pricing"
            className="flex items-center px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
            onClick={onClose}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {safeTranslate(t, 'navbar.pricing', 'Tarifs')}
          </Link>
          
          {/* Mobile Tools */}
          <MobileNavSection title={safeTranslate(t, 'navbar.tools', 'Outils')} icon={Wrench}>
            <Link
              to="/tools/volatility-calculator"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
            >
              {safeTranslate(t, 'tools.volatilityCalculator', 'Calculatrices de Volatilité')}
            </Link>
            <Link
              to="/tools/black-scholes"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
            >
              {safeTranslate(t, 'tools.blackScholes', 'Simulateur Black-Scholes')}
            </Link>
            <Link
              to="/tools/monte-carlo"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
            >
              {safeTranslate(t, 'tools.monteCarlo', 'Monte Carlo')}
            </Link>
            <Link
              to="/tools/model-calibration"
              className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
            >
              {safeTranslate(t, 'tools.modelCalibration', 'Calibration de Modèles')}
            </Link>
          </MobileNavSection>
          
          {/* Mobile Blog */}
          <Link
            to="/blog"
            className="flex items-center px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
            onClick={onClose}
          >
            <FileText className="w-4 h-4 mr-2" />
            {safeTranslate(t, 'navbar.blog', 'Blog')}
          </Link>
          
          {/* Mobile Bug Report */}
          <Link
            to="/bug-report"
            className="flex items-center px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
            onClick={onClose}
          >
            <Bug className="w-4 h-4 mr-2" />
            {safeTranslate(t, 'navbar.bugs', 'Report Bug')}
          </Link>
          
          <div className="mt-3 flex justify-start px-3">
            <LanguageSwitcher />
          </div>
          <div className="pt-4 pb-3 border-t border-finance-steel/20">
            <Button variant="financeOutline" size="sm" className="w-full mb-2" asChild>
              <Link to="/login" onClick={onClose}>
                {safeTranslate(t, 'navbar.login', 'Login')}
              </Link>
            </Button>
            <Button variant="finance" size="sm" className="w-full" asChild>
              <Link to="/signup" onClick={onClose}>
                {safeTranslate(t, 'navbar.signup', 'Sign Up')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileNav;
