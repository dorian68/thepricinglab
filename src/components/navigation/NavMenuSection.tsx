
import React from "react";
import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface NavMenuItemProps {
  to: string;
  icon?: LucideIcon;
  title: string;
  description?: string;
}

const NavMenuItem = ({ to, icon: Icon, title, description }: NavMenuItemProps) => (
  <li>
    <Link 
      to={to}
      className="flex p-2 hover:bg-finance-charcoal/50 rounded-md"
    >
      {Icon && (
        <div className="mr-3 text-finance-accent">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div>
        <div className="font-medium">{title}</div>
        {description && <div className="text-sm text-finance-lightgray">{description}</div>}
      </div>
    </Link>
  </li>
);

interface NavMenuSectionProps {
  title?: string;
  children: React.ReactNode;
}

const NavMenuSection = ({ title, children }: NavMenuSectionProps) => (
  <div>
    {title && <h3 className="font-medium text-sm mb-1 text-finance-accent">{title}</h3>}
    <ul className="space-y-2">
      {children}
    </ul>
  </div>
);

export { NavMenuItem, NavMenuSection };
