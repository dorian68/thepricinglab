
import React from "react";
import { Zap, List, Brain, BarChart4, Trophy } from "lucide-react";
import { NavMenuItem } from "./NavMenuSection";
import { useTranslation } from "react-i18next";

const TrainingLabMenu = () => {
  const { t } = useTranslation();

  return (
    <div className="p-4 w-[380px]">
      <p className="text-sm text-finance-accent mb-4 font-medium">{t('trainingLab.subtitle')}</p>
      <ul className="space-y-3">
        <NavMenuItem 
          to="/exercises" 
          icon={List} 
          title={t('trainingLab.exercises')} 
          description={t('exercises.subtitle')} 
        />
        <NavMenuItem 
          to="/survival-mode" 
          icon={Zap} 
          title={t('survivalMode.title')} 
          description={t('survivalMode.subtitle')} 
        />
        <NavMenuItem 
          to="/quizzes" 
          icon={Brain} 
          title={t('trainingLab.quizzes')} 
          description={t('trainingLab.progress')} 
        />
        <NavMenuItem 
          to="/practice" 
          icon={BarChart4} 
          title={t('trainingLab.practice')} 
          description={t('trainingLab.performance')} 
        />
        <NavMenuItem 
          to="/leaderboard" 
          icon={Trophy} 
          title={t('trainingLab.leaderboard')} 
          description={t('leaderboard.subtitle')} 
        />
      </ul>
    </div>
  );
};

export default TrainingLabMenu;
