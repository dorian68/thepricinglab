
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  Home, BookOpen, Dumbbell, Users, CreditCard, Wrench, FileText, Bug, BarChart3, LogOut,
  Code, PieChart, FileSpreadsheet, Activity, LayoutDashboard, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  console.log("DesktopNav: Auth state", { isAuthenticated, profile })

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
                label={st('navbar.courses', 'Cours')}
              >
                <CoursesMenu />
              </NavItem>

              {/* Labo Trading */}
              <NavItem 
                to="/labo-trading" 
                icon={BarChart3} 
                label={st('navbar.laboTrading', 'Labo de Trading')}
              />

              {/* Outils */}
              <NavItem 
                icon={Wrench} 
                label={st('navbar.tools', 'Outils')}
              >
                <ToolsMenu />
              </NavItem>

              {/* Exercices */}
              <NavItem 
                to="/exercices" 
                icon={Dumbbell} 
                label={st('navbar.exercices', 'Exercices')} 
              />

              {/* Notebooks */}
              <NavItem 
                to="/notebooks" 
                icon={Code} 
                label={st('navbar.notebooks', 'Notebooks')} 
              />
              
              {/* PRO Features */}
              {isProUser() && (
                <>
                  {/* Surface de Volatilité PRO */}
                  <NavItem 
                    to="/vol-surface" 
                    icon={TrendingUp} 
                    label={
                      <div className="flex items-center gap-2">
                        {st('navbar.volSurface', 'Surface de Vol')}
                        <Badge variant="premium" className="text-xs">PRO</Badge>
                      </div>
                    }
                  />

                  {/* Quant PRO Tools */}
                  <NavItem 
                    to="/quant-tools-pro" 
                    icon={Activity} 
                    label={
                      <div className="flex items-center gap-2">
                        {st('navbar.quantProTools', 'Quant PRO Tools')}
                        <Badge variant="premium" className="text-xs">PRO</Badge>
                      </div>
                    }
                  />

                  {/* Rapports PRO */}
                  <NavItem 
                    to="/rapports" 
                    icon={FileSpreadsheet} 
                    label={
                      <div className="flex items-center gap-2">
                        {st('navbar.rapports', 'Rapports')}
                        <Badge variant="premium" className="text-xs">PRO</Badge>
                      </div>
                    }
                  />

                  {/* API PRO */}
                  <NavItem 
                    to="/api" 
                    icon={PieChart} 
                    label={
                      <div className="flex items-center gap-2">
                        {st('navbar.api', 'API')}
                        <Badge variant="premium" className="text-xs">PRO</Badge>
                      </div>
                    }
                  />
                </>
              )}

              {/* Admin Dashboard */}
              {isAdminUser() && (
                <NavItem 
                  to="/dashboard" 
                  icon={LayoutDashboard} 
                  label={
                    <div className="flex items-center gap-2">
                      {st('navbar.dashboard', 'Dashboard')}
                      <Badge variant="error" className="text-xs">ADMIN</Badge>
                    </div>
                  }
                />
              )}
              
              {/* Community */}
              <NavItem 
                icon={Users} 
                label={st('navbar.community', 'Communauté')}
              >
                <CommunityMenu />
              </NavItem>
              
              {/* Pricing */}
              <NavItem 
                to="/pricing" 
                icon={CreditCard} 
                label={st('navbar.pricing', 'Tarifs')} 
              />
              
              {/* Blog */}
              <NavItem 
                to="/blog" 
                icon={FileText} 
                label={st('navbar.blog', 'Blog')} 
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
                {profile.prenom 
                  ? `${st('navbar.greeting', 'Bonjour')}, ${profile.prenom}` 
                  : st('navigation.profile', 'Mon compte')}
              </Link>
              <Button 
                variant="financeOutline" 
                size="sm" 
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                {st('auth.signout.button', 'Déconnexion')}
              </Button>
            </div>
          ) : (
            <>
              <Button variant="financeOutline" size="sm" className="mr-2" asChild>
                <Link to="/login">
                  {st('auth.signin.button', 'Se connecter')}
                </Link>
              </Button>
              <Button variant="finance" size="sm" asChild>
                <Link to="/signup">
                  {st('auth.signup.button', "S'inscrire")}
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
