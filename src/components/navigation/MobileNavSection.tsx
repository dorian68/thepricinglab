
import React from "react";
import { LucideIcon } from "lucide-react";

interface MobileNavSectionProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  highlighted?: boolean;
}

const MobileNavSection = ({ title, icon: Icon, children, highlighted = false }: MobileNavSectionProps) => {
  const baseClasses = "space-y-1 pl-3 border-l";
  const regularClasses = "border-finance-steel/20";
  const highlightedClasses = "border-finance-accent/30 bg-finance-accent/5 rounded-md py-2";
  
  const classes = highlighted 
    ? `${baseClasses} ${highlightedClasses}`
    : `${baseClasses} ${regularClasses}`;

  return (
    <div className={classes}>
      <h3 className="flex items-center px-3 py-1 text-xs text-finance-accent font-medium uppercase">
        <Icon className="w-3 h-3 mr-2" />
        {title}
      </h3>
      {children}
    </div>
  );
};

export default MobileNavSection;
