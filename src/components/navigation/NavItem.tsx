
import React, { ElementType, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  
  // Handle click on navigation links to close dropdown
  const handleLinkClick = (linkTo?: string) => {
    setIsOpen(false);
    if (linkTo) {
      navigate(linkTo);
    }
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && 
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // If there are children, render a dropdown menu
  if (children) {
    return (
      <NavigationMenuItem className="relative">
        <NavigationMenuTrigger
          ref={triggerRef}
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
            ref={menuRef}
            className="absolute"
            onMouseLeave={() => setIsOpen(false)}
            onClick={(e) => {
              // Find closest link element
              const linkElement = (e.target as HTMLElement).closest('a');
              if (linkElement && linkElement.getAttribute('href')) {
                handleLinkClick(linkElement.getAttribute('href') || undefined);
              }
            }}
            style={{
              left: triggerRef.current ? triggerRef.current.offsetLeft : 0
            }}
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
