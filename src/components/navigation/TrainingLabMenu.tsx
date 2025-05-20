
import React from "react";
import { Zap, List, Brain, BarChart4, Trophy } from "lucide-react";
import { NavMenuSection, NavMenuLink } from "./NavMenuSection";
import { useTranslation } from "react-i18next";

const TrainingLabMenu = () => {
  const { t } = useTranslation();

  return (
    <div className="p-4 w-[380px]">
      <p className="text-sm text-finance-accent mb-4 font-medium">{t('trainingLab.subtitle')}</p>
      <ul className="space-y-3">
        <NavMenuLink 
          to="/exercises" 
          icon={<List className="h-4 w-4" />} 
          title={t('trainingLab.exercises')} 
          description={t('exercises.subtitle')} 
        />
        <NavMenuLink 
          to="/survival-mode" 
          icon={<Zap className="h-4 w-4" />} 
          title={t('survivalMode.title')} 
          description={t('survivalMode.subtitle')} 
        />
        <NavMenuLink 
          to="/quizzes" 
          icon={<Brain className="h-4 w-4" />} 
          title={t('trainingLab.quizzes')} 
          description={t('trainingLab.progress')} 
        />
        <NavMenuLink 
          to="/practice" 
          icon={<BarChart4 className="h-4 w-4" />} 
          title={t('trainingLab.practice')} 
          description={t('trainingLab.performance')} 
        />
        <NavMenuLink 
          to="/leaderboard" 
          icon={<Trophy className="h-4 w-4" />} 
          title={t('trainingLab.leaderboard')} 
          description={t('leaderboard.subtitle')} 
        />
      </ul>
    </div>
  );
};

export default TrainingLabMenu;
