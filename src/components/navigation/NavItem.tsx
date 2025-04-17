
import React, { ElementType } from "react";
import { Link } from "react-router-dom";
import {
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
  NavigationMenuContent,
  navigationMenuTriggerStyle,
  navigationMenuTriggerHighlightedStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

interface NavItemProps {
  to?: string;
  icon: ElementType;
  label: string;
  highlighted?: boolean;
  children?: React.ReactNode;
}

const NavItem = ({ to, icon: Icon, label, highlighted = false, children }: NavItemProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  // Handle click on navigation links to close dropdown
  const handleLinkClick = () => {
    setIsOpen(false);
  };

  // If there are children, render a dropdown menu
  if (children) {
    return (
      <NavigationMenuItem className="relative" onMouseLeave={() => setIsOpen(false)}>
        <NavigationMenuTrigger
          onMouseEnter={() => setIsOpen(true)}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            highlighted ? navigationMenuTriggerHighlightedStyle() : navigationMenuTriggerStyle(),
            "flex items-center gap-1"
          )}
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </NavigationMenuTrigger>
        {isOpen && (
          <NavigationMenuContent 
            className="absolute"
            onMouseLeave={() => setIsOpen(false)}
            onClick={handleLinkClick}
          >
            {children}
          </NavigationMenuContent>
        )}
      </NavigationMenuItem>
    );
  }

  // If there are no children, render a simple link
  return (
    <NavigationMenuItem>
      <Link
        to={to || "#"}
        className={cn(
          highlighted ? navigationMenuTriggerHighlightedStyle() : navigationMenuTriggerStyle(),
          "flex items-center gap-1"
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </Link>
    </NavigationMenuItem>
  );
};

export default NavItem;
