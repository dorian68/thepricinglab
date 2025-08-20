
import React from "react";
import { NavMenuSection } from "./NavMenuSection";
import { UsersRound, MessageCircle, ScrollText, Code2, Trophy, Briefcase, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

const CommunityMenu: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-2">
      <NavMenuSection
        items={[
          {
            title: t('navbar.community.forum.title'),
            href: "/community/forum",
            description: t('navbar.community.forum.desc'),
            icon: <MessageCircle className="h-5 w-5" />,
          },
          {
            title: t('navbar.community.contribute.title'),
            href: "/community/contribute",
            description: t('navbar.community.contribute.desc'),
            icon: <ScrollText className="h-5 w-5" />,
          },
          {
            title: t('navbar.community.pair.title'),
            href: "/community/pair-programming",
            description: t('navbar.community.pair.desc'),
            icon: <Code2 className="h-5 w-5" />,
          },
          {
            title: t('navbar.community.challenge.title'),
            href: "/community/weekly-challenge",
            description: t('navbar.community.challenge.desc'),
            icon: <Trophy className="h-5 w-5" />,
          },
          {
            title: t('navbar.community.notebook.title'),
            href: "/community/playground",
            description: t('navbar.community.notebook.desc'),
            icon: <BookOpen className="h-5 w-5" />,
          },
          {
            title: t('navbar.community.jobs.title'),
            href: "/jobs",
            description: t('navbar.community.jobs.desc'),
            icon: <Briefcase className="h-5 w-5" />,
          },
        ]}
      />
    </div>
  );
};

export default CommunityMenu;
