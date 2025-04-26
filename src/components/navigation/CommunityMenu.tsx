
import React from "react";
import { MessageSquare, Award, Code, LineChart, BookOpen, Edit } from "lucide-react";
import { NavMenuItem } from "./NavMenuSection";
import { useTranslation } from "react-i18next";
import { safeTranslate } from "../../utils/translationUtils";

const CommunityMenu = () => {
  const { t } = useTranslation();
  const st = (key: string, defaultValue: string) => safeTranslate(t, key, defaultValue);
  
  return (
    <div className="p-4 w-[380px]">
      <p className="text-sm text-finance-accent mb-4 font-medium">
        {st('community.subtitle', 'Connect with fellow quants and traders')}
      </p>
      <ul className="space-y-3">
        <NavMenuItem 
          to="/community/forum" 
          icon={MessageSquare} 
          title={st('community.forum.title', 'Discussion Forum')} 
          description={st('community.forum.description', 'Exchange ideas and ask questions')} 
        />
        <NavMenuItem 
          to="/community/explore" 
          icon={BookOpen} 
          title={'Publications collaboratives'} 
          description={'Articles et stratégies de la communauté'} 
        />
        <NavMenuItem 
          to="/community/contribute" 
          icon={Edit} 
          title={'Contribuer'} 
          description={'Écrire un article ou partager une stratégie'} 
        />
        <NavMenuItem 
          to="/projects" 
          icon={Award} 
          title={st('community.projects.title', 'Projects & Challenges')} 
          description={st('community.projects.description', 'New problems every week')} 
        />
        <NavMenuItem 
          to="/community/pair-programming" 
          icon={Code} 
          title={st('community.pair.title', 'Pair Programming')} 
          description={st('community.pair.description', 'Code together on projects')} 
        />
        <NavMenuItem 
          to="/community/leaderboard" 
          icon={LineChart} 
          title={st('community.leaderboard.title', 'Leaderboard & Hackathons')} 
          description={st('community.leaderboard.description', 'Rankings and events')} 
        />
      </ul>
    </div>
  );
};

export default CommunityMenu;
