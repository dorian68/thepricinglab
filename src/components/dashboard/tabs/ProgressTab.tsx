import React from "react";
import { useTranslation } from "react-i18next";
import CourseProgress from "../CourseProgress";

const ProgressTab = () => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium mb-4">{t('dashboard.progress.title', 'Progression des cours')}</h2>
      
      <div className="finance-card p-6">
        <h3 className="text-lg font-medium mb-4">{t('dashboard.progress.overallProgress', 'Progression globale')}</h3>
        <div className="h-2.5 bg-finance-steel/20 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-finance-accent rounded-full" 
            style={{ width: '27%' }}
          ></div>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-finance-lightgray">27% complété</span>
          <span className="text-finance-lightgray">3/12 modules terminés</span>
        </div>
      </div>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-md font-medium mb-3">Fondamentaux</h3>
          <div className="space-y-4">
            <CourseProgress 
              title="Introduction au Pricing et Black-Scholes" 
              progress={100} 
              lastActivity="Complété le 5 avril 2025"
              level="FONDAMENTAUX"
              path="/courses/fundamentals/black-scholes"
            />
            <CourseProgress 
              title="Taux d'intérêt et courbes de rendement" 
              progress={100} 
              lastActivity="Complété le 10 avril 2025"
              level="FONDAMENTAUX"
              path="/courses/fundamentals/yield-curves"
            />
            <CourseProgress 
              title="Greeks et sensibilités" 
              progress={75} 
              lastActivity="Dernière activité: aujourd'hui"
              level="FONDAMENTAUX"
              path="/courses/fundamentals/greeks"
            />
          </div>
        </div>
        
        <div>
          <h3 className="text-md font-medium mb-3">Vanilles avancés</h3>
          <div className="space-y-4">
            <CourseProgress 
              title="Volatilité implicite et structures" 
              progress={40} 
              lastActivity="Dernière activité: hier"
              level="VANILLES AVANCÉS"
              path="/courses/advanced/implied-vol"
            />
            <CourseProgress 
              title="Produits de volatilité" 
              progress={0} 
              lastActivity="Non commencé"
              level="VANILLES AVANCÉS"
              path="/courses/advanced/vol-products"
            />
          </div>
        </div>
        
        <div>
          <h3 className="text-md font-medium mb-3">Produits complexes</h3>
          <div className="space-y-4">
            <CourseProgress 
              title="Options exotiques et barrières" 
              progress={0} 
              lastActivity="Non commencé"
              level="PRODUITS COMPLEXES"
              path="/courses/complex/exotic-options"
            />
            <CourseProgress 
              title="Monte Carlo pour produits path-dependent" 
              progress={0} 
              lastActivity="Non commencé"
              level="PRODUITS COMPLEXES"
              path="/courses/complex/monte-carlo"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressTab;
