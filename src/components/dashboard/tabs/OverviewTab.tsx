import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Play, Bell, ChevronRight, FileText, Clock, Trophy } from "lucide-react";
import DashboardStats from "../DashboardStats";
import CourseProgress from "../CourseProgress";
import QuizResult from "../QuizResult";

const OverviewTab = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <DashboardStats />
      
      {/* Continue Learning */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">{t('dashboard.overview.continueTitle', 'Continuer l\'apprentissage')}</h2>
          <Link to="/courses" className="text-finance-accent text-sm flex items-center">
            {t('dashboard.overview.viewAllCourses', 'Voir tous les cours')} <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CourseProgress 
            title="Black-Scholes & Modèles fondamentaux" 
            progress={75} 
            lastActivity="Dernière activité: aujourd'hui"
            level="FONDAMENTAUX"
            path="/courses/fundamentals/black-scholes"
          />
          <CourseProgress 
            title="Taux d'intérêt et courbes de rendement" 
            progress={40} 
            lastActivity="Dernière activité: hier"
            level="FONDAMENTAUX"
            path="/courses/fundamentals/yield-curves"
          />
          <CourseProgress 
            title="Greeks et sensibilités" 
            progress={10} 
            lastActivity="Dernière activité: il y a 3 jours"
            level="FONDAMENTAUX"
            path="/courses/fundamentals/greeks"
          />
        </div>
      </section>
      
      {/* Recent Quizzes and Challenges */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">{t('dashboard.overview.recentQuizzes', 'Derniers quiz')}</h2>
          <button className="text-finance-accent text-sm flex items-center">
            {t('dashboard.overview.viewAllResults', 'Tous les résultats')} <ChevronRight className="ml-1 h-4 w-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuizResult 
            title="Quiz: Valorisation Black-Scholes" 
            score={85} 
            date="Complété le 15 avril 2025" 
            correct={17} 
            total={20} 
          />
          <QuizResult 
            title="Quiz: Calibration de la volatilité" 
            score={65} 
            date="Complété le 12 avril 2025" 
            correct={13} 
            total={20} 
          />
          <QuizResult 
            title="Quiz: Structures de taux" 
            score={90} 
            date="Complété le 8 avril 2025" 
            correct={18} 
            total={20} 
          />
        </div>
      </section>

      {/* Upcoming Challenges */}
      <section>
        <h2 className="text-lg font-medium mb-4">{t('dashboard.overview.challenges', 'Challenges à venir')}</h2>
        <div className="finance-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-finance-offwhite font-medium mb-1">Challenge mensuel: Option Pricing Competition</h3>
              <p className="text-finance-lightgray text-sm">
                Testez vos compétences en pricing d'options contre d'autres membres de la communauté.
              </p>
            </div>
            <span className="terminal-text text-xs px-2 py-1 bg-finance-burgundy/20 rounded text-finance-accent">
              COMMENCE DANS 5 JOURS
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-finance-accent" />
              <span className="text-finance-lightgray text-sm">Données de marché fournies</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-finance-accent" />
              <span className="text-finance-lightgray text-sm">Délai: 48 heures</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-finance-accent" />
              <span className="text-finance-lightgray text-sm">Prix: 6 mois d'abonnement gratuit</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/projects" className="finance-button text-center">
              Voir tous les challenges
            </Link>
            <button className="finance-button-outline flex items-center justify-center">
              <Bell className="mr-2 h-4 w-4" />
              Recevoir un rappel
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OverviewTab;
