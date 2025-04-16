
import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Menu, 
  X, 
  ChevronDown, 
  Home, 
  BookOpen, 
  Dumbbell, 
  Users, 
  CreditCard, 
  Wrench,
  Zap,
  List,
  Brain,
  BarChart4,
  Trophy,
  MessageSquare,
  Award,
  Code,
  LineChart,
  Calculator,
  Activity,
  Waves,
  Sigma,
  FileText
} from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  navigationMenuTriggerHighlightedStyle,
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
                  {/* Home */}
                  <NavigationMenuItem>
                    <Link to="/" className={navigationMenuTriggerStyle()}>
                      <Home className="w-4 h-4 mr-2" />
                      {t('navbar.home')}
                    </Link>
                  </NavigationMenuItem>
                  
                  {/* Courses */}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger>
                      <BookOpen className="w-4 h-4 mr-2" />
                      {t('navbar.courses')}
                    </NavigationMenuTrigger>
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
                  
                  {/* Training Lab - Highlighted Section */}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className={navigationMenuTriggerHighlightedStyle()}>
                      <Dumbbell className="w-4 h-4 mr-2" />
                      Training Lab
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="p-4 w-[380px]">
                        <ul className="space-y-3">
                          <li>
                            <Link 
                              to="/exercises"
                              className="flex p-2 hover:bg-finance-charcoal/50 rounded-md"
                            >
                              <div className="mr-3 text-finance-accent">
                                <List className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-medium">Exercices Interactifs</div>
                                <div className="text-sm text-finance-lightgray">Exercices guidés par niveau</div>
                              </div>
                            </Link>
                          </li>
                          <li>
                            <Link 
                              to="/survival-mode"
                              className="flex p-2 hover:bg-finance-charcoal/50 rounded-md"
                            >
                              <div className="mr-3 text-finance-accent">
                                <Zap className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-medium">Mode Survie</div>
                                <div className="text-sm text-finance-lightgray">Défis chronométrés par difficulté</div>
                              </div>
                            </Link>
                          </li>
                          <li>
                            <Link 
                              to="/quizzes"
                              className="flex p-2 hover:bg-finance-charcoal/50 rounded-md"
                            >
                              <div className="mr-3 text-finance-accent">
                                <Brain className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-medium">Quiz Progressifs</div>
                                <div className="text-sm text-finance-lightgray">Évaluez vos connaissances</div>
                              </div>
                            </Link>
                          </li>
                          <li>
                            <Link 
                              to="/advanced-simulations"
                              className="flex p-2 hover:bg-finance-charcoal/50 rounded-md"
                            >
                              <div className="mr-3 text-finance-accent">
                                <BarChart4 className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-medium">Simulations Avancées</div>
                                <div className="text-sm text-finance-lightgray">Modèles stochastiques et pricing</div>
                              </div>
                            </Link>
                          </li>
                          <li>
                            <Link 
                              to="/progress"
                              className="flex p-2 hover:bg-finance-charcoal/50 rounded-md items-center"
                            >
                              <div className="mr-3 text-finance-accent">
                                <Trophy className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-medium">Votre Progression</div>
                                <div className="text-sm text-finance-lightgray">Badges et performances</div>
                              </div>
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                  
                  {/* Community */}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger>
                      <Users className="w-4 h-4 mr-2" />
                      {t('navbar.community')}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="p-4 w-[380px]">
                        <ul className="space-y-3">
                          <li>
                            <Link 
                              to="/community/forum"
                              className="flex p-2 hover:bg-finance-charcoal/50 rounded-md"
                            >
                              <div className="mr-3 text-finance-accent">
                                <MessageSquare className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-medium">Forum & Chat</div>
                                <div className="text-sm text-finance-lightgray">Échangez avec la communauté</div>
                              </div>
                            </Link>
                          </li>
                          <li>
                            <Link 
                              to="/community/challenges"
                              className="flex p-2 hover:bg-finance-charcoal/50 rounded-md"
                            >
                              <div className="mr-3 text-finance-accent">
                                <Award className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-medium">Défis Hebdomadaires</div>
                                <div className="text-sm text-finance-lightgray">Nouveaux problèmes chaque semaine</div>
                              </div>
                            </Link>
                          </li>
                          <li>
                            <Link 
                              to="/community/pair-programming"
                              className="flex p-2 hover:bg-finance-charcoal/50 rounded-md"
                            >
                              <div className="mr-3 text-finance-accent">
                                <Code className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-medium">Pair Programming</div>
                                <div className="text-sm text-finance-lightgray">Codez ensemble sur des projets</div>
                              </div>
                            </Link>
                          </li>
                          <li>
                            <Link 
                              to="/community/leaderboard"
                              className="flex p-2 hover:bg-finance-charcoal/50 rounded-md"
                            >
                              <div className="mr-3 text-finance-accent">
                                <LineChart className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-medium">Leaderboard & Hackathons</div>
                                <div className="text-sm text-finance-lightgray">Classements et événements</div>
                              </div>
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                  
                  {/* Pricing */}
                  <NavigationMenuItem>
                    <Link to="/pricing" className={navigationMenuTriggerStyle()}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Tarifs
                    </Link>
                  </NavigationMenuItem>
                  
                  {/* Tools */}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger>
                      <Wrench className="w-4 h-4 mr-2" />
                      {t('navbar.tools')}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="p-4 w-[380px]">
                        <ul className="space-y-3">
                          <li>
                            <Link 
                              to="/tools/volatility-calculator"
                              className="flex p-2 hover:bg-finance-charcoal/50 rounded-md"
                            >
                              <div className="mr-3 text-finance-accent">
                                <Calculator className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-medium">Calculatrices de Volatilité</div>
                                <div className="text-sm text-finance-lightgray">Outils d'analyse de vol</div>
                              </div>
                            </Link>
                          </li>
                          <li>
                            <Link 
                              to="/tools/black-scholes"
                              className="flex p-2 hover:bg-finance-charcoal/50 rounded-md"
                            >
                              <div className="mr-3 text-finance-accent">
                                <Activity className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-medium">Simulateur Black-Scholes</div>
                                <div className="text-sm text-finance-lightgray">Pricing d'options</div>
                              </div>
                            </Link>
                          </li>
                          <li>
                            <Link 
                              to="/tools/monte-carlo"
                              className="flex p-2 hover:bg-finance-charcoal/50 rounded-md"
                            >
                              <div className="mr-3 text-finance-accent">
                                <Waves className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-medium">Générateur Monte Carlo</div>
                                <div className="text-sm text-finance-lightgray">Simulation de scénarios</div>
                              </div>
                            </Link>
                          </li>
                          <li>
                            <Link 
                              to="/tools/model-calibration"
                              className="flex p-2 hover:bg-finance-charcoal/50 rounded-md"
                            >
                              <div className="mr-3 text-finance-accent">
                                <Sigma className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-medium">Calibration de Modèles</div>
                                <div className="text-sm text-finance-lightgray">Analyse de surfaces de vol</div>
                              </div>
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                  
                  {/* Blog */}
                  <NavigationMenuItem>
                    <Link to="/blog" className={navigationMenuTriggerStyle()}>
                      <FileText className="w-4 h-4 mr-2" />
                      Blog
                    </Link>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher />
            <div className="ml-4 flex items-center md:ml-6">
              <Button variant="financeOutline" size="sm" className="mr-2" asChild>
                <Link to="/login">
                  {t('navbar.login')}
                </Link>
              </Button>
              <Button variant="finance" size="sm" asChild>
                <Link to="/signup">
                  {t('navbar.signup')}
                </Link>
              </Button>
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
              className="flex items-center px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
            >
              <Home className="w-4 h-4 mr-2" />
              {t('navbar.home')}
            </Link>
            
            {/* Mobile Courses */}
            <div className="space-y-1 pl-3 border-l border-finance-steel/20">
              <h3 className="flex items-center px-3 py-1 text-xs text-finance-accent font-medium uppercase">
                <BookOpen className="w-3 h-3 mr-2" />
                Cours
              </h3>
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
            
            {/* Mobile Training Lab - Highlighted */}
            <div className="space-y-1 pl-3 border-l border-finance-accent/30 bg-finance-accent/5 rounded-md py-2">
              <h3 className="flex items-center px-3 py-1 text-xs text-finance-accent font-medium uppercase">
                <Dumbbell className="w-3 h-3 mr-2" />
                Training Lab
              </h3>
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
            </div>
            
            {/* Mobile Community */}
            <div className="space-y-1 pl-3 border-l border-finance-steel/20">
              <h3 className="flex items-center px-3 py-1 text-xs text-finance-accent font-medium uppercase">
                <Users className="w-3 h-3 mr-2" />
                {t('navbar.community')}
              </h3>
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
            </div>
            
            {/* Mobile Pricing */}
            <Link
              to="/pricing"
              className="flex items-center px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Tarifs
            </Link>
            
            {/* Mobile Tools */}
            <div className="space-y-1 pl-3 border-l border-finance-steel/20">
              <h3 className="flex items-center px-3 py-1 text-xs text-finance-accent font-medium uppercase">
                <Wrench className="w-3 h-3 mr-2" />
                Outils
              </h3>
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
            </div>
            
            {/* Mobile Blog */}
            <Link
              to="/blog"
              className="flex items-center px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium"
            >
              <FileText className="w-4 h-4 mr-2" />
              Blog
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
      )}
    </nav>
  );
};

export default ModernNavbar;
