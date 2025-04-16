
import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useTranslation } from "react-i18next";
import { Brain, BookOpen, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const QuizSection = ({ title, description, quizCount, icon: Icon, to }: { 
  title: string;
  description: string;
  quizCount: number;
  icon: React.ElementType;
  to: string;
}) => (
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
            <span className="text-sm text-finance-lightgray">{quizCount} quiz disponibles</span>
            <Button asChild size="sm" variant="outline">
              <Link to={to}>
                Explorer <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Quizzes = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite">
      <Navbar />
      
      <main className="flex-1 py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <header className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 terminal-text">
              Quiz Progressifs
            </h1>
            <p className="text-finance-lightgray text-lg max-w-3xl">
              Évaluez vos connaissances sur les options financières à travers une série de quiz interactifs, organisés par thématique et niveau de difficulté.
            </p>
          </header>
          
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Brain className="mr-3 h-6 w-6 text-finance-accent" />
              Quiz par Catégorie
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <QuizSection 
                title="Fondamentaux des Options"
                description="Maîtrisez les concepts de base des options financières : structure, pricing et mécanismes fondamentaux."
                quizCount={5}
                icon={BookOpen}
                to="/quizzes/fundamentals"
              />
              
              <QuizSection 
                title="Pricing & Modèles"
                description="Testez vos connaissances sur Black-Scholes, les arbres binomiaux et les méthodes numériques."
                quizCount={4}
                icon={BookOpen}
                to="/quizzes/pricing"
              />
              
              <QuizSection 
                title="Les Grecques"
                description="Évaluez votre compréhension des mesures de sensibilité et des stratégies de couverture."
                quizCount={3}
                icon={BookOpen}
                to="/quizzes/greeks"
              />
              
              <QuizSection 
                title="Volatilité"
                description="Testez vos connaissances sur la volatilité implicite, historique et les surfaces de vol."
                quizCount={4}
                icon={BookOpen}
                to="/quizzes/volatility"
              />
              
              <QuizSection 
                title="Options Exotiques"
                description="Évaluez votre maîtrise des options path-dependent, à barrière et multi-sous-jacentes."
                quizCount={3}
                icon={BookOpen}
                to="/quizzes/exotic"
              />
              
              <QuizSection 
                title="Stratégies Avancées"
                description="Mettez à l'épreuve vos connaissances sur les stratégies complexes et les arbitrages."
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
                <h3 className="text-xl font-medium mb-2">Mode Survie - Le Test Ultime</h3>
                <p className="text-finance-lightgray mb-4">
                  Prêt à mettre vos connaissances à l'épreuve ? Le mode survie combine des questions de toutes les catégories avec une limite de temps pour un défi complet.
                </p>
                <Button asChild>
                  <Link to="/survival-mode">
                    Accéder au Mode Survie <ChevronRight className="ml-1 h-4 w-4" />
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
