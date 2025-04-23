import React from "react";
import { useTranslation } from "react-i18next";
import QuizResult from "../QuizResult";

const QuizzesTab = () => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium mb-4">{t('dashboard.quizzes.title', 'Résultats des quiz')}</h2>
      
      <div className="finance-card p-6 mb-6">
        <div className="flex items-center mb-4">
          <div className="w-14 h-14 rounded-full bg-finance-burgundy/20 flex items-center justify-center mr-4">
            <span className="text-2xl font-bold text-finance-accent">80%</span>
          </div>
          <div>
            <h3 className="font-medium">{t('dashboard.quizzes.averageScore', 'Score moyen')}</h3>
            <p className="text-finance-lightgray text-sm">{t('dashboard.quizzes.completedQuizzes', 'Basé sur 10 quiz complétés')}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center px-3 py-1.5 bg-finance-steel/10 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
            <span className="text-xs text-finance-lightgray">7 réussis</span>
          </div>
          <div className="flex items-center px-3 py-1.5 bg-finance-steel/10 rounded-full">
            <div className="w-2 h-2 rounded-full bg-yellow-400 mr-2"></div>
            <span className="text-xs text-finance-lightgray">2 à améliorer</span>
          </div>
          <div className="flex items-center px-3 py-1.5 bg-finance-steel/10 rounded-full">
            <div className="w-2 h-2 rounded-full bg-red-400 mr-2"></div>
            <span className="text-xs text-finance-lightgray">1 échoué</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <QuizResult 
          title="Quiz: Mouvement Brownien" 
          score={95} 
          date="Complété le 6 avril 2025" 
          correct={19} 
          total={20} 
        />
        <QuizResult 
          title="Quiz: Put-Call Parity" 
          score={100} 
          date="Complété le 3 avril 2025" 
          correct={20} 
          total={20} 
        />
        <QuizResult 
          title="Quiz: Calcul de Delta et Gamma" 
          score={75} 
          date="Complété le 1 avril 2025" 
          correct={15} 
          total={20} 
        />
        <QuizResult 
          title="Quiz: Bootstrapping de courbe" 
          score={80} 
          date="Complété le 30 mars 2025" 
          correct={16} 
          total={20} 
        />
        <QuizResult 
          title="Quiz: Hedging dynamique" 
          score={55} 
          date="Complété le 27 mars 2025" 
          correct={11} 
          total={20} 
        />
        <QuizResult 
          title="Quiz: Interpolation de taux" 
          score={85} 
          date="Complété le 25 mars 2025" 
          correct={17} 
          total={20} 
        />
        <QuizResult 
          title="Quiz: Facteurs de volatilité" 
          score={45} 
          date="Complété le 22 mars 2025" 
          correct={9} 
          total={20} 
        />
      </div>
    </div>
  );
};

export default QuizzesTab;
