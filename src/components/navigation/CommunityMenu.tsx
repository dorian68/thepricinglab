
import React from "react";
import { MessageSquare, Award, Code, LineChart } from "lucide-react";
import { NavMenuItem } from "./NavMenuSection";
import { useTranslation } from "react-i18next";
import { safeTranslate } from "../../utils/translationUtils";

const CommunityMenu = () => {
  const { t } = useTranslation();
  const st = (key: string, defaultValue: string) => safeTranslate(t, key, defaultValue);
  
  return (
    <div className="p-4 w-[380px]">
      <p className="text-sm text-finance-accent mb-4 font-medium">
        {st('community.subtitle', 'Rejoignez la communauté et échangez avec d\'autres passionnés de finance quantitative')}
      </p>
      <ul className="space-y-3">
        <NavMenuItem 
          to="/community/forum" 
          icon={MessageSquare} 
          title={st('community.forum.title', 'Forum & Chat')} 
          description={st('community.forum.description', 'Échangez avec la communauté')} 
        />
        <NavMenuItem 
          to="/projects" 
          icon={Award} 
          title={st('community.projects.title', 'Projets et Challenges')} 
          description={st('community.projects.description', 'Nouveaux problèmes chaque semaine')} 
        />
        <NavMenuItem 
          to="/community/pair-programming" 
          icon={Code} 
          title={st('community.pair.title', 'Pair Programming')} 
          description={st('community.pair.description', 'Codez ensemble sur des projets')} 
        />
        <NavMenuItem 
          to="/community/leaderboard" 
          icon={LineChart} 
          title={st('community.leaderboard.title', 'Leaderboard & Hackathons')} 
          description={st('community.leaderboard.description', 'Classements et événements')} 
        />
      </ul>
    </div>
  );
};

export default CommunityMenu;
