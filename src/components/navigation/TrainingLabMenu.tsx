
import React from "react";
import { Zap, List, Brain, BarChart4, Trophy } from "lucide-react";
import { NavMenuItem } from "./NavMenuSection";

const TrainingLabMenu = () => {
  return (
    <div className="p-4 w-[380px]">
      <p className="text-sm text-finance-accent mb-4 font-medium">Exercices interactifs, simulations et défis pour renforcer vos compétences en pricing d'options</p>
      <ul className="space-y-3">
        <NavMenuItem 
          to="/exercises" 
          icon={List} 
          title="Exercices Interactifs" 
          description="Exercices guidés par niveau" 
        />
        <NavMenuItem 
          to="/survival-mode" 
          icon={Zap} 
          title="Mode Survie" 
          description="Défis chronométrés par difficulté" 
        />
        <NavMenuItem 
          to="/quizzes" 
          icon={Brain} 
          title="Quiz Progressifs" 
          description="Évaluez vos connaissances" 
        />
        <NavMenuItem 
          to="/advanced-simulations" 
          icon={BarChart4} 
          title="Simulations Avancées" 
          description="Modèles stochastiques et pricing" 
        />
        <NavMenuItem 
          to="/progress" 
          icon={Trophy} 
          title="Votre Progression" 
          description="Badges et performances" 
        />
      </ul>
    </div>
  );
};

export default TrainingLabMenu;
