
import React from "react";
import { LucideIcon } from "lucide-react";

interface AchievementBadgeProps {
  icon: LucideIcon;
  name: string;
  description: string;
  unlocked: boolean;
}

const AchievementBadge = ({ 
  icon: Icon, 
  name, 
  description, 
  unlocked 
}: AchievementBadgeProps) => (
  <div className={`finance-card p-4 ${unlocked ? 'border-finance-accent/30' : 'opacity-50'}`}>
    <div className="flex gap-4">
      <div className={`p-3 rounded-full ${unlocked ? 'bg-finance-burgundy/20' : 'bg-finance-steel/10'}`}>
        <Icon className={`h-6 w-6 ${unlocked ? 'text-finance-accent' : 'text-finance-lightgray'}`} />
      </div>
      <div>
        <h3 className="text-finance-offwhite font-medium text-sm">{name}</h3>
        <p className="text-finance-lightgray text-xs">{description}</p>
      </div>
    </div>
  </div>
);

export default AchievementBadge;
