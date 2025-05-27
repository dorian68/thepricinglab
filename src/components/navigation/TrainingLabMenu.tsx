
import React from "react";
import { Zap, List, Brain, BarChart4, Trophy } from "lucide-react";
import { NavMenuSection, NavMenuLink } from "./NavMenuSection";
import { useTranslation } from "react-i18next";
import { safeTranslate } from "../../utils/translationUtils";

const TrainingLabMenu = () => {
  const { t } = useTranslation();
  const st = (key: string, defaultValue: string) => safeTranslate(t, key, defaultValue);

  return (
    <div className="p-4 w-[380px]">
      <p className="text-sm text-finance-accent mb-4 font-medium">
        {st('trainingLab.subtitle', 'Improve your skills with our interactive learning tools')}
      </p>
      <ul className="space-y-3">
        <NavMenuLink 
          to="/exercises" 
          icon={<List className="h-4 w-4" />} 
          title={st('trainingLab.exercises', 'Interactive Exercises')} 
          description={st('exercises.subtitle', 'Improve your skills with our interactive exercises')} 
        />
        <NavMenuLink 
          to="/survival-mode" 
          icon={<Zap className="h-4 w-4" />} 
          title={st('trainingLab.survivalMode', 'Survival Mode')} 
          description={st('survivalMode.subtitle', 'Test your knowledge in a series of timed challenges')} 
        />
        <NavMenuLink 
          to="/quizzes" 
          icon={<Brain className="h-4 w-4" />} 
          title={st('trainingLab.quizzes', 'Progressive Quizzes')} 
          description={st('trainingLab.progress', 'Track your progress')} 
        />
        <NavMenuLink 
          to="/practice" 
          icon={<BarChart4 className="h-4 w-4" />} 
          title={st('trainingLab.practice', 'Practice')} 
          description={st('trainingLab.performance', 'Monitor your performance')} 
        />
        <NavMenuLink 
          to="/leaderboard" 
          icon={<Trophy className="h-4 w-4" />} 
          title={st('trainingLab.leaderboard', 'Leaderboards')} 
          description={st('community.leaderboard', 'Rankings and competitions')} 
        />
      </ul>
    </div>
  );
};

export default TrainingLabMenu;
