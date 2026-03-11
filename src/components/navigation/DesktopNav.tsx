
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  BookOpen, Dumbbell, Users, Wrench, FileText, BarChart3, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/use-permissions";
import { toast } from "sonner";
import NavItem from "./NavItem";
import LanguageSwitcher from "../LanguageSwitcher";
import TrainingLabMenu from "./TrainingLabMenu";
import TradingLabMenu from "./TradingLabMenu";
import CoursesMenu from "./CoursesMenu";
import CommunityMenu from "./CommunityMenu";
import ToolsMenu from "./ToolsMenu";
import { safeTranslate } from "../../utils/translationUtils";

const DesktopNav = () => {
  const { t } = useTranslation()
  const { user, profile, signOut, isAuthenticated, isLoading } = useAuth()
  const { isProUser, isAdminUser } = usePermissions()
  const navigate = useNavigate()

  const st = (key: string, defaultValue: string) => safeTranslate(t, key, defaultValue);

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate("/")
      toast(st("auth.signout.success", "Déconnexion réussie"), {
        description: st("auth.signout.successMessage", "À bientôt !")
      })
    } catch (error) {
      toast(st("auth.signout.error", "Erreur"), {
        description: st("auth.signout.errorMessage", "Une erreur est survenue lors de la déconnexion")
      })
    }
  }

  return (
    <div className="hidden lg:flex items-center justify-between w-full bg-transparent">
      <div className="flex items-center">
        <Link to="/" className="flex-shrink-0 flex items-center">
          <span className="terminal-text text-sm font-bold tracking-wider">THE PRICING LIBRARY</span>
        </Link>
        
        <div className="ml-8">
          <NavigationMenu>
            <NavigationMenuList className="gap-0">
              <NavItem icon={BookOpen} label={st('navbar.courses', 'Cours')}><CoursesMenu /></NavItem>
              <NavItem icon={BarChart3} label={st('navbar.laboTrading', 'Labo de Trading')}><TradingLabMenu /></NavItem>
              <NavItem icon={Wrench} label={st('navbar.tools', 'Outils')}><ToolsMenu /></NavItem>
              <NavItem to="/exercices" icon={Dumbbell} label={st('navbar.exercices', 'Exercices')} />
              <NavItem icon={Users} label={st('navbar.community.label', 'Communauté')}><CommunityMenu /></NavItem>
              <NavItem to="/blog" icon={FileText} label={st('navbar.blog', 'Blog')} />
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <div className="flex items-center gap-2">
          {isAuthenticated && profile ? (
            <div className="flex items-center gap-3">
              <Link 
                to="/dashboard" 
                className="text-sm text-foreground hover:text-primary transition-colors"
              >
                {profile.prenom 
                  ? `${st('navbar.greeting', 'Bonjour')}, ${profile.prenom}` 
                  : st('navigation.profile', 'Mon compte')}
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-xs"
              >
                <LogOut className="h-3.5 w-3.5" />
                {st('auth.signout.button', 'Déconnexion')}
              </Button>
            </div>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link to="/login">{st('auth.signin.button', 'Se connecter')}</Link>
              </Button>
              <Button variant="finance" size="sm" asChild>
                <Link to="/signup">{st('auth.signup.button', "S'inscrire")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default DesktopNav
