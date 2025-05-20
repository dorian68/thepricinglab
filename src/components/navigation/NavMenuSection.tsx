
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
  items?: NavMenuItem[];
  title?: string;
  className?: string;
  children?: React.ReactNode;
}

export const NavMenuSection: React.FC<NavMenuSectionProps> = ({ items, title, children, className = "" }) => {
  if (items) {
    return (
      <div className={`grid gap-3 ${className}`}>
        {title && <h3 className="mb-2 text-sm font-medium text-finance-accent">{title}</h3>}
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
  }
  
  // If no items are provided but children are, render children
  return (
    <div className={`grid gap-3 ${className}`}>
      {title && <h3 className="mb-2 text-sm font-medium text-finance-accent">{title}</h3>}
      {children}
    </div>
  );
};

// Export a simpler component for individual menu items
export const NavMenuLink: React.FC<Omit<NavMenuItem, 'href'> & { to: string }> = ({ 
  title, 
  description, 
  icon, 
  disabled,
  to 
}) => {
  return (
    <Link
      to={disabled ? "#" : to}
      className={`group grid grid-cols-[24px_1fr] items-start gap-3 rounded-lg p-3 text-finance-offwhite transition-colors hover:bg-finance-steel/20 hover:text-finance-offwhite ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      }`}
    >
      {icon && <div className="text-finance-accent">{icon}</div>}
      <div className="grid gap-1">
        <span className="font-medium leading-none group-hover:text-finance-accent transition-colors">
          {title}
        </span>
        <span className="text-xs leading-none text-finance-lightgray">
          {description}
        </span>
      </div>
    </Link>
  );
};
