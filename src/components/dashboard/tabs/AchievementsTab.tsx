
import React from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, TrendingUp, Award, BarChart, BarChart3, Trophy } from "lucide-react";
import AchievementBadge from "../AchievementBadge";

const AchievementsTab = () => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium mb-4">{t('dashboard.achievements.title', 'Badges & Réalisations')}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AchievementBadge 
          icon={BookOpen} 
          name="Fondamentaux maîtrisés" 
          description="Compléter tous les modules fondamentaux avec un score moyen > 80%" 
          unlocked={true} 
        />
        <AchievementBadge 
          icon={TrendingUp} 
          name="Trader en herbe" 
          description="Compléter votre premier challenge mensuel" 
          unlocked={true} 
        />
        <AchievementBadge 
          icon={Award} 
          name="Expert en volatilité" 
          description="Obtenir 100% au quiz sur les structures de volatilité" 
          unlocked={true} 
        />
        <AchievementBadge 
          icon={BarChart} 
          name="Maître des Greeks" 
          description="Réussir le module avancé sur les stratégies de couverture" 
          unlocked={false} 
        />
        <AchievementBadge 
          icon={BarChart3} 
          name="Analyste quantitatif" 
          description="Implémenter avec succès un pricer Monte Carlo pour options exotiques" 
          unlocked={false} 
        />
        <AchievementBadge 
          icon={Trophy} 
          name="Elite de la finance" 
          description="Compléter tous les modules avec un score moyen > 90%" 
          unlocked={false} 
        />
      </div>
    </div>
  );
};

export default AchievementsTab;
