
import React from "react";
import { BookOpen, Clock, CheckCircle2, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import StatCard from "./StatCard";

const DashboardStats = () => {
  const { t } = useTranslation();
  
  return (
    <section>
      <h2 className="text-lg font-medium mb-4">{t('dashboard.stats.title', 'Statistiques')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={BookOpen} 
          label={t('dashboard.stats.completedModules', 'Modules complétés')} 
          value="3/12" 
        />
        <StatCard 
          icon={Clock} 
          label={t('dashboard.stats.watchTime', 'Temps de visionnage')} 
          value="14h 22m" 
        />
        <StatCard 
          icon={CheckCircle2} 
          label={t('dashboard.stats.quizzesPassed', 'Quiz réussis')} 
          value="7/10" 
        />
        <StatCard 
          icon={Trophy} 
          label={t('dashboard.stats.badges', 'Badges débloqués')} 
          value="5/15" 
        />
      </div>
    </section>
  );
};

export default DashboardStats;
