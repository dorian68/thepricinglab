
import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  Home, BookOpen, Dumbbell, Users, CreditCard, Wrench, FileText, Bug, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import NavItem from "./NavItem";
import LanguageSwitcher from "../LanguageSwitcher";
import TrainingLabMenu from "./TrainingLabMenu";
import TradingLabMenu from "./TradingLabMenu";
import CoursesMenu from "./CoursesMenu";
import CommunityMenu from "./CommunityMenu";
import ToolsMenu from "./ToolsMenu";

const DesktopNav = () => {
  const { t } = useTranslation();

  return (
    <div className="hidden md:flex items-center justify-between w-full">
      <div className="flex items-center">
        <Link to="/" className="flex-shrink-0 flex items-center">
          <span className="terminal-text text-finance-accent text-xl font-bold">THE PRICING LAB</span>
        </Link>
        
        <div className="ml-10">
          <NavigationMenu>
            <NavigationMenuList>
              
              {/* Courses */}
              <NavItem 
                icon={BookOpen} 
                label={t('navbar.courses')}
              >
                <CoursesMenu />
              </NavItem>

              {/* Trading Lab Section */}
              <NavItem 
                icon={BarChart3} 
                label={t('navbar.tradingLab', 'Trading Lab')}
                highlighted={true}
              >
                <TradingLabMenu />
              </NavItem>
              
              {/* Community */}
              <NavItem 
                icon={Users} 
                label={t('navbar.community')}
              >
                <CommunityMenu />
              </NavItem>
              
              {/* Pricing */}
              <NavItem 
                to="/pricing" 
                icon={CreditCard} 
                label={t('navbar.pricing', 'Tarifs')} 
              />
              
              {/* Tools */}
              <NavItem 
                icon={Wrench} 
                label={t('navbar.tools')}
              >
                <ToolsMenu />
              </NavItem>
              
              {/* Blog */}
              <NavItem 
                to="/blog" 
                icon={FileText} 
                label={t('navbar.blog')} 
              />
              
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <LanguageSwitcher />
        <div className="ml-4 flex items-center md:ml-6">
          <Button variant="financeOutline" size="sm" className="mr-2" asChild>
            <Link to="/login">
              {t('navbar.login')}
            </Link>
          </Button>
          <Button variant="finance" size="sm" asChild>
            <Link to="/signup">
              {t('navbar.signup')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DesktopNav;
