
import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useTranslation } from "react-i18next";
import { Brain, BookOpen, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { safeTranslate } from "../utils/translationUtils";

const QuizSection = ({ title, description, quizCount, icon: Icon, to }: { 
  title: string;
  description: string;
  quizCount: number;
  icon: React.ElementType;
  to: string;
}) => {
  const { t } = useTranslation();
  
  // Utiliser safeTranslate pour éviter les problèmes d'affichage [caption]
  const st = (key: string, defaultValue: string) => safeTranslate(t, key, defaultValue);
  
  return (
    <div className="finance-card mb-6 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start">
          <div className="bg-finance-charcoal/50 p-3 rounded-lg mr-4">
            <Icon className="h-6 w-6 text-finance-accent" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-medium mb-2">{title}</h3>
            <p className="text-finance-lightgray mb-4">{description}</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-finance-lightgray">{quizCount} {st('quizzes.quizAvailable', "quizzes available")}</span>
              <Button asChild size="sm" variant="outline">
                <Link to={to}>
                  {st('quizzes.explore', "Explore")} <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Quizzes = () => {
  const { t } = useTranslation();
  
  // Utiliser safeTranslate pour éviter les problèmes d'affichage [caption]
  const st = (key: string, defaultValue: string) => safeTranslate(t, key, defaultValue);

  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite">
      <Navbar />
      
      <main className="flex-1 py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <header className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 terminal-text">
              {st('quizzes.title', "Quizzes")}
            </h1>
            <p className="text-finance-lightgray text-lg max-w-3xl">
              {st('quizzes.subtitle', "Test your knowledge and reinforce learning with our interactive quizzes")}
            </p>
          </header>
          
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Brain className="mr-3 h-6 w-6 text-finance-accent" />
              {st('quizzes.categories', "Quiz Categories")}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <QuizSection 
                title={st('quizzes.fundamentalsTitle', "Options Fundamentals")}
                description={st('quizzes.fundamentalsDesc', "Test your knowledge of basic option concepts, terminology, and market mechanics")}
                quizCount={5}
                icon={BookOpen}
                to="/quizzes/fundamentals"
              />
              
              <QuizSection 
                title={st('quizzes.pricingTitle', "Option Pricing Models")}
                description={st('quizzes.pricingDesc', "Challenge yourself with questions on Black-Scholes, binomial trees, and other pricing models")}
                quizCount={4}
                icon={BookOpen}
                to="/quizzes/pricing"
              />
              
              <QuizSection 
                title={st('quizzes.greeksTitle', "Option Greeks")}
                description={st('quizzes.greeksDesc', "Measure your understanding of Delta, Gamma, Theta, Vega, and other option sensitivities")}
                quizCount={3}
                icon={BookOpen}
                to="/quizzes/greeks"
              />
              
              <QuizSection 
                title={st('quizzes.volatilityTitle', "Volatility Analysis")}
                description={st('quizzes.volatilityDesc', "Test your knowledge of implied volatility, volatility smiles, and volatility forecasting")}
                quizCount={4}
                icon={BookOpen}
                to="/quizzes/volatility"
              />
              
              <QuizSection 
                title={st('quizzes.exoticTitle', "Exotic Options")}
                description={st('quizzes.exoticDesc', "Challenge yourself with questions on barrier options, Asian options, and other exotic derivatives")}
                quizCount={3}
                icon={BookOpen}
                to="/quizzes/exotic"
              />
              
              <QuizSection 
                title={st('quizzes.strategiesTitle', "Trading Strategies")}
                description={st('quizzes.strategiesDesc', "Test your knowledge of spreads, straddles, collars, and other option trading strategies")}
                quizCount={3}
                icon={BookOpen}
                to="/quizzes/strategies"
              />
            </div>
          </div>
          
          <div className="finance-card p-6 border-finance-accent">
            <div className="flex items-start">
              <div className="bg-finance-accent/20 p-3 rounded-lg mr-4">
                <Brain className="h-6 w-6 text-finance-accent" />
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">{st('quizzes.survivalTitle', "Survival Mode")}</h3>
                <p className="text-finance-lightgray mb-4">
                  {st('quizzes.survivalDesc', "Put your knowledge to the test in our timed challenge mode with increasing difficulty")}
                </p>
                <Button asChild>
                  <Link to="/survival-mode">
                    {st('quizzes.accessSurvival', "Access Survival Mode")} <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Quizzes;
