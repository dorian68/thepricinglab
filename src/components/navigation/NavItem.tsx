
import React from "react";
import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import {
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
  NavigationMenuTrigger,
  NavigationMenuContent,
  navigationMenuTriggerHighlightedStyle,
} from "@/components/ui/navigation-menu";

interface NavItemProps {
  to?: string;
  icon?: LucideIcon;
  label: string;
  children?: React.ReactNode;
  highlighted?: boolean;
}

const NavItem = ({ to, icon: Icon, label, children, highlighted = false }: NavItemProps) => {
  // If there are children, render a dropdown menu
  if (children) {
    return (
      <NavigationMenuItem>
        <NavigationMenuTrigger 
          className={highlighted ? "text-finance-accent bg-finance-accent/10 hover:bg-finance-accent/20" : ""}
        >
          {Icon && <Icon className="w-4 h-4 mr-2" />}
          {label}
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          {children}
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  // Otherwise, render a simple link
  return (
    <NavigationMenuItem>
      <Link 
        to={to || "/"} 
        className={navigationMenuTriggerStyle() + (highlighted ? " text-finance-accent bg-finance-accent/10 hover:bg-finance-accent/20" : "")}
      >
        {Icon && <Icon className="w-4 h-4 mr-2" />}
        {label}
      </Link>
    </NavigationMenuItem>
  );
};

export default NavItem;
