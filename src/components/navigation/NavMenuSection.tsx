
import React from "react";
import { Link } from "react-router-dom";

export interface NavMenuItem {
  title: string;
  href: string;
  description: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface NavMenuSectionProps {
  items: NavMenuItem[];
  className?: string;
}

export const NavMenuSection: React.FC<NavMenuSectionProps> = ({ items, className = "" }) => {
  return (
    <div className={`grid gap-3 ${className}`}>
      {items.map((item) => (
        <Link
          key={item.title}
          to={item.disabled ? "#" : item.href}
          className={`group grid grid-cols-[24px_1fr] items-start gap-3 rounded-lg p-3 text-finance-offwhite transition-colors hover:bg-finance-steel/20 hover:text-finance-offwhite ${
            item.disabled ? "cursor-not-allowed opacity-50" : ""
          }`}
        >
          {item.icon && <div className="text-finance-accent">{item.icon}</div>}
          <div className="grid gap-1">
            <span className="font-medium leading-none group-hover:text-finance-accent transition-colors">
              {item.title}
            </span>
            <span className="text-xs leading-none text-finance-lightgray">
              {item.description}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
};
