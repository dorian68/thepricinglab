
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
            title: safeTranslate(t, "navbar.community.forum.title", "Forum"),
            href: "/community/forum",
            description: safeTranslate(
              t,
              "navbar.community.forum.desc",
              "Échangez avec la communauté"
            ),
            icon: <MessageCircle className="h-5 w-5" />,
          },
          {
            title: safeTranslate(t, "navbar.community.contribute.title", "Contribuer"),
            href: "/community/contribute",
            description: safeTranslate(
              t,
              "navbar.community.contribute.desc",
              "Partagez vos connaissances"
            ),
            icon: <ScrollText className="h-5 w-5" />,
          },
          {
            title: safeTranslate(t, "navbar.community.pair.title", "Pair Programming"),
            href: "/community/pair-programming",
            description: safeTranslate(
              t,
              "navbar.community.pair.desc",
              "Codez en collaboration"
            ),
            icon: <Code2 className="h-5 w-5" />,
          },
          {
            title: safeTranslate(t, "navbar.community.challenge.title", "Weekly Challenge"),
            href: "/community/weekly-challenge",
            description: safeTranslate(
              t,
              "navbar.community.challenge.desc",
              "Relevez le défi hebdomadaire"
            ),
            icon: <Trophy className="h-5 w-5" />,
          },
          {
            title: safeTranslate(t, "navbar.community.notebook.title", "Notebook Playground"),
            href: "/community/playground",
            description: safeTranslate(
              t,
              "navbar.community.notebook.desc",
              "Explorez et testez des notebooks"
            ),
            icon: <BookOpen className="h-5 w-5" />,
          },
          {
            title: safeTranslate(t, "navbar.community.jobs.title", "Offres d'emploi"),
            href: "/jobs",
            description: safeTranslate(
              t,
              "navbar.community.jobs.desc",
              "Carrières en finance quantitative"
            ),
            icon: <Briefcase className="h-5 w-5" />,
          },
        ]}
      />
    </div>
  );
};

export default CommunityMenu;
