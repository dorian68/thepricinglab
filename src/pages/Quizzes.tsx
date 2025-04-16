
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
              <span className="text-sm text-finance-lightgray">{quizCount} {safeTranslate(t, 'quizzes.quizAvailable')}</span>
              <Button asChild size="sm" variant="outline">
                <Link to={to}>
                  {safeTranslate(t, 'quizzes.explore')} <ChevronRight className="ml-1 h-4 w-4" />
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

  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite">
      <Navbar />
      
      <main className="flex-1 py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <header className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 terminal-text">
              {safeTranslate(t, 'quizzes.title')}
            </h1>
            <p className="text-finance-lightgray text-lg max-w-3xl">
              {safeTranslate(t, 'quizzes.subtitle')}
            </p>
          </header>
          
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Brain className="mr-3 h-6 w-6 text-finance-accent" />
              {safeTranslate(t, 'quizzes.categories')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <QuizSection 
                title={safeTranslate(t, 'quizzes.fundamentalsTitle')}
                description={safeTranslate(t, 'quizzes.fundamentalsDesc')}
                quizCount={5}
                icon={BookOpen}
                to="/quizzes/fundamentals"
              />
              
              <QuizSection 
                title={safeTranslate(t, 'quizzes.pricingTitle')}
                description={safeTranslate(t, 'quizzes.pricingDesc')}
                quizCount={4}
                icon={BookOpen}
                to="/quizzes/pricing"
              />
              
              <QuizSection 
                title={safeTranslate(t, 'quizzes.greeksTitle')}
                description={safeTranslate(t, 'quizzes.greeksDesc')}
                quizCount={3}
                icon={BookOpen}
                to="/quizzes/greeks"
              />
              
              <QuizSection 
                title={safeTranslate(t, 'quizzes.volatilityTitle')}
                description={safeTranslate(t, 'quizzes.volatilityDesc')}
                quizCount={4}
                icon={BookOpen}
                to="/quizzes/volatility"
              />
              
              <QuizSection 
                title={safeTranslate(t, 'quizzes.exoticTitle')}
                description={safeTranslate(t, 'quizzes.exoticDesc')}
                quizCount={3}
                icon={BookOpen}
                to="/quizzes/exotic"
              />
              
              <QuizSection 
                title={safeTranslate(t, 'quizzes.strategiesTitle')}
                description={safeTranslate(t, 'quizzes.strategiesDesc')}
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
                <h3 className="text-xl font-medium mb-2">{safeTranslate(t, 'quizzes.survivalTitle')}</h3>
                <p className="text-finance-lightgray mb-4">
                  {safeTranslate(t, 'quizzes.survivalDesc')}
                </p>
                <Button asChild>
                  <Link to="/survival-mode">
                    {safeTranslate(t, 'quizzes.accessSurvival')} <ChevronRight className="ml-1 h-4 w-4" />
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
