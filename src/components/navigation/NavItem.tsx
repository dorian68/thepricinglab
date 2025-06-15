
import React from "react";
import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import {
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "@/components/ui/navigation-menu";

interface NavItemProps {
  to?: string;
  icon: LucideIcon;
  label: React.ReactNode; // Changed from string to ReactNode to accept JSX
  children?: React.ReactNode;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, children }) => {
  if (children) {
    // Dropdown menu item
    return (
      <NavigationMenuItem>
        <NavigationMenuTrigger className="text-finance-offwhite hover:text-finance-accent transition-colors">
          <Icon className="h-4 w-4 mr-2" />
          {label}
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          {children}
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  // Simple link item
  return (
    <NavigationMenuItem>
      <Link
        to={to || "#"}
        className="flex items-center px-3 py-2 text-finance-offwhite hover:text-finance-accent transition-colors"
      >
        <Icon className="h-4 w-4 mr-2" />
        {label}
      </Link>
    </NavigationMenuItem>
  );
};

export default NavItem;
