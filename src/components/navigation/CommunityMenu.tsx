
import React from "react";
import { NavMenuSection } from "./NavMenuSection";
import { UsersRound, MessageCircle, ScrollText, Code2, Trophy, Briefcase, BookOpen } from "lucide-react";
import { safeTranslate } from "../../utils/translationUtils";
import { useTranslation } from "react-i18next";

const CommunityMenu: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-2">
      <NavMenuSection
        items={[
          {
            title: "Forum",
            href: "/community/forum",
            description: "Échangez avec la communauté",
            icon: <MessageCircle className="h-5 w-5" />,
          },
          {
            title: "Contribuer",
            href: "/community/contribute",
            description: "Partagez vos connaissances",
            icon: <ScrollText className="h-5 w-5" />,
          },
          {
            title: "Pair Programming",
            href: "/community/pair-programming",
            description: "Codez en collaboration",
            icon: <Code2 className="h-5 w-5" />,
          },
          {
            title: "Weekly Challenge",
            href: "/community/weekly-challenge",
            description: "Relevez le défi hebdomadaire",
            icon: <Trophy className="h-5 w-5" />,
          },
          {
            title: "Notebook Playground",
            href: "/community/playground",
            description: "Explorez et testez des notebooks",
            icon: <BookOpen className="h-5 w-5" />,
          },
          {
            title: "Offres d'emploi",
            href: "/jobs",
            description: "Carrières en finance quantitative",
            icon: <Briefcase className="h-5 w-5" />,
          },
        ]}
      />
    </div>
  );
};

export default CommunityMenu;
