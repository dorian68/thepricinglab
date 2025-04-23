
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  Home, BookOpen, Dumbbell, Users, CreditCard, Wrench, FileText, Bug, BarChart3, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import NavItem from "./NavItem";
import LanguageSwitcher from "../LanguageSwitcher";
import TrainingLabMenu from "./TrainingLabMenu";
import TradingLabMenu from "./TradingLabMenu";
import CoursesMenu from "./CoursesMenu";
import CommunityMenu from "./CommunityMenu";
import ToolsMenu from "./ToolsMenu";

const DesktopNav = () => {
  const { t } = useTranslation()
  const { user, profile, signOut, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  console.log("DesktopNav: Auth state", { isAuthenticated, profile })

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate("/")
      toast(t("auth.signout.success", "Déconnexion réussie"), {
        description: t("auth.signout.successMessage", "À bientôt !")
      })
    } catch (error) {
      toast(t("auth.signout.error", "Erreur"), {
        description: t("auth.signout.errorMessage", "Une erreur est survenue lors de la déconnexion")
      })
    }
  }

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
          {isAuthenticated && profile ? (
            <div className="flex items-center gap-4">
              <Link 
                to="/dashboard" 
                className="text-finance-offwhite hover:text-finance-accent transition-colors"
              >
                {profile.prenom ? `Bonjour, ${profile.prenom}` : "Mon compte"}
              </Link>
              <Button 
                variant="financeOutline" 
                size="sm" 
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                {t('auth.signout.button', 'Déconnexion')}
              </Button>
            </div>
          ) : (
            <>
              <Button variant="financeOutline" size="sm" className="mr-2" asChild>
                <Link to="/login">
                  {t('auth.signin.button', 'Se connecter')}
                </Link>
              </Button>
              <Button variant="finance" size="sm" asChild>
                <Link to="/signup">
                  {t('auth.signup.button', "S'inscrire")}
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default DesktopNav
