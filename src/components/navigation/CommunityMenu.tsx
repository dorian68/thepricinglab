
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
            title: safeTranslate(t, 'navbar.community.forum.title', 'Forum'),
            href: "/community/forum",
            description: safeTranslate(t, 'navbar.community.forum.desc', 'Exchange with the community'),
            icon: <MessageCircle className="h-5 w-5" />,
          },
          {
            title: safeTranslate(t, 'navbar.community.contribute.title', 'Contribute'),
            href: "/community/contribute",
            description: safeTranslate(t, 'navbar.community.contribute.desc', 'Share your knowledge'),
            icon: <ScrollText className="h-5 w-5" />,
          },
          {
            title: safeTranslate(t, 'navbar.community.pair.title', 'Pair Programming'),
            href: "/community/pair-programming",
            description: safeTranslate(t, 'navbar.community.pair.desc', 'Code in collaboration'),
            icon: <Code2 className="h-5 w-5" />,
          },
          {
            title: safeTranslate(t, 'navbar.community.challenge.title', 'Weekly Challenge'),
            href: "/community/weekly-challenge",
            description: safeTranslate(t, 'navbar.community.challenge.desc', 'Take on the weekly challenge'),
            icon: <Trophy className="h-5 w-5" />,
          },
          {
            title: safeTranslate(t, 'navbar.community.notebook.title', 'Notebook Playground'),
            href: "/community/playground",
            description: safeTranslate(t, 'navbar.community.notebook.desc', 'Explore and test notebooks'),
            icon: <BookOpen className="h-5 w-5" />,
          },
          {
            title: safeTranslate(t, 'navbar.community.jobs.title', 'Job Opportunities'),
            href: "/jobs",
            description: safeTranslate(t, 'navbar.community.jobs.desc', 'Careers in quantitative finance'),
            icon: <Briefcase className="h-5 w-5" />,
          },
        ]}
      />
    </div>
  );
};

export default CommunityMenu;
