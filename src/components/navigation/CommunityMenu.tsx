
import React from "react";
import { MessageSquare, Award, Code, LineChart } from "lucide-react";
import { NavMenuItem } from "./NavMenuSection";

const CommunityMenu = () => {
  return (
    <div className="p-4 w-[380px]">
      <p className="text-sm text-finance-accent mb-4 font-medium">Rejoignez la communauté et échangez avec d'autres passionnés de finance quantitative</p>
      <ul className="space-y-3">
        <NavMenuItem 
          to="/community/forum" 
          icon={MessageSquare} 
          title="Forum & Chat" 
          description="Échangez avec la communauté" 
        />
        <NavMenuItem 
          to="/community/challenges" 
          icon={Award} 
          title="Défis Hebdomadaires" 
          description="Nouveaux problèmes chaque semaine" 
        />
        <NavMenuItem 
          to="/community/pair-programming" 
          icon={Code} 
          title="Pair Programming" 
          description="Codez ensemble sur des projets" 
        />
        <NavMenuItem 
          to="/community/leaderboard" 
          icon={LineChart} 
          title="Leaderboard & Hackathons" 
          description="Classements et événements" 
        />
      </ul>
    </div>
  );
};

export default CommunityMenu;
