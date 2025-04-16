
import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  Home, BookOpen, Dumbbell, Users, CreditCard, Wrench, 
  Zap, List, Brain, BarChart4, Trophy, MessageSquare, 
  Award, Code, LineChart, Calculator, Activity, Waves, 
  Sigma, FileText 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import NavItem from "./NavItem";
import { NavMenuItem, NavMenuSection } from "./NavMenuSection";
import LanguageSwitcher from "../LanguageSwitcher";

const DesktopNav = () => {
  const { t } = useTranslation();

  return (
    <div className="hidden md:flex items-center justify-between w-full">
      <div className="flex items-center">
        <Link to="/" className="flex-shrink-0 flex items-center">
          <span className="terminal-text text-finance-accent text-xl font-bold">THE PRICING LAB</span>
        </Link>
        
        <div className="ml-10">
          <NavigationMenu>
            <NavigationMenuList>
              {/* Home */}
              <NavItem 
                to="/" 
                icon={Home} 
                label={t('navbar.home')} 
              />
              
              {/* Courses */}
              <NavItem 
                icon={BookOpen} 
                label={t('navbar.courses')}
              >
                <div className="grid grid-cols-2 gap-3 p-4 w-[500px]">
                  <NavMenuSection title="Fondamentaux">
                    <NavMenuItem 
                      to="/courses/fundamentals/black-scholes" 
                      title={t('coursesPage.fundamentals.blackScholes.title')} 
                    />
                    <NavMenuItem 
                      to="/courses/fundamentals/yield-curves" 
                      title={t('coursesPage.fundamentals.yieldCurves.title')} 
                    />
                    <NavMenuItem 
                      to="/courses/fundamentals/greeks" 
                      title={t('coursesPage.fundamentals.greeks.title')} 
                    />
                  </NavMenuSection>
                  
                  <div>
                    <NavMenuSection title="Avancé">
                      <NavMenuItem 
                        to="/courses/advanced/implied-vol" 
                        title={t('coursesPage.advanced.impliedVol.title')} 
                      />
                      <NavMenuItem 
                        to="/courses/advanced/vol-products" 
                        title={t('coursesPage.advanced.volProducts.title')} 
                      />
                    </NavMenuSection>
                    
                    <NavMenuSection title="Complexe">
                      <NavMenuItem 
                        to="/courses/complex/exotic-options" 
                        title={t('coursesPage.complex.exotic.title')} 
                      />
                      <NavMenuItem 
                        to="/courses/complex/monte-carlo" 
                        title={t('coursesPage.complex.monteCarlo.title')} 
                      />
                    </NavMenuSection>
                  </div>
                </div>
              </NavItem>
              
              {/* Training Lab - Highlighted Section */}
              <NavItem 
                icon={Dumbbell} 
                label="Training Lab"
                highlighted={true}
              >
                <div className="p-4 w-[380px]">
                  <ul className="space-y-3">
                    <NavMenuItem 
                      to="/exercises" 
                      icon={List} 
                      title="Exercices Interactifs" 
                      description="Exercices guidés par niveau" 
                    />
                    <NavMenuItem 
                      to="/survival-mode" 
                      icon={Zap} 
                      title="Mode Survie" 
                      description="Défis chronométrés par difficulté" 
                    />
                    <NavMenuItem 
                      to="/quizzes" 
                      icon={Brain} 
                      title="Quiz Progressifs" 
                      description="Évaluez vos connaissances" 
                    />
                    <NavMenuItem 
                      to="/advanced-simulations" 
                      icon={BarChart4} 
                      title="Simulations Avancées" 
                      description="Modèles stochastiques et pricing" 
                    />
                    <NavMenuItem 
                      to="/progress" 
                      icon={Trophy} 
                      title="Votre Progression" 
                      description="Badges et performances" 
                    />
                  </ul>
                </div>
              </NavItem>
              
              {/* Community */}
              <NavItem 
                icon={Users} 
                label={t('navbar.community')}
              >
                <div className="p-4 w-[380px]">
                  <ul className="space-y-3">
                    <NavMenuItem 
                      to="/community/forum" 
                      icon={MessageSquare} 
                      title="Forum & Chat" 
                      description="Échangez avec la communauté" 
                    />
                    <NavMenuItem 
                      to="/community/challenges" 
                      icon={Award} 
                      title="Défis Hebdomadaires" 
                      description="Nouveaux problèmes chaque semaine" 
                    />
                    <NavMenuItem 
                      to="/community/pair-programming" 
                      icon={Code} 
                      title="Pair Programming" 
                      description="Codez ensemble sur des projets" 
                    />
                    <NavMenuItem 
                      to="/community/leaderboard" 
                      icon={LineChart} 
                      title="Leaderboard & Hackathons" 
                      description="Classements et événements" 
                    />
                  </ul>
                </div>
              </NavItem>
              
              {/* Pricing */}
              <NavItem 
                to="/pricing" 
                icon={CreditCard} 
                label="Tarifs" 
              />
              
              {/* Tools */}
              <NavItem 
                icon={Wrench} 
                label={t('navbar.tools')}
              >
                <div className="p-4 w-[380px]">
                  <ul className="space-y-3">
                    <NavMenuItem 
                      to="/tools/volatility-calculator" 
                      icon={Calculator} 
                      title="Calculatrices de Volatilité" 
                      description="Outils d'analyse de vol" 
                    />
                    <NavMenuItem 
                      to="/tools/black-scholes" 
                      icon={Activity} 
                      title="Simulateur Black-Scholes" 
                      description="Pricing d'options" 
                    />
                    <NavMenuItem 
                      to="/tools/monte-carlo" 
                      icon={Waves} 
                      title="Générateur Monte Carlo" 
                      description="Simulation de scénarios" 
                    />
                    <NavMenuItem 
                      to="/tools/model-calibration" 
                      icon={Sigma} 
                      title="Calibration de Modèles" 
                      description="Analyse de surfaces de vol" 
                    />
                  </ul>
                </div>
              </NavItem>
              
              {/* Blog */}
              <NavItem 
                to="/blog" 
                icon={FileText} 
                label="Blog" 
              />
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
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
    </div>
  );
};

export default DesktopNav;
