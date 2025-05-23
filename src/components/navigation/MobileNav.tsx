
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  X, Home, BookOpen, Dumbbell, Users, CreditCard, Wrench, FileText, Bug, BarChart3, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "../LanguageSwitcher";
import MobileNavSection from "./MobileNavSection";
import { safeTranslate } from "../../utils/translationUtils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sheet,
  SheetContent,
  SheetClose,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileNav = ({ isOpen, onClose }: MobileNavProps) => {
  const { t } = useTranslation();
  const { user, profile, signOut, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

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
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="left"
        className="w-full max-w-sm p-0 bg-finance-dark border-finance-steel/20"
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4 border-b border-finance-steel/20">
            <h2 className="text-finance-accent font-bold">Menu</h2>
            <SheetClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-finance-offwhite hover:text-finance-accent"
                aria-label={safeTranslate(t, 'navbar.closeMenu', 'Close menu')}
              >
                <X className="h-5 w-5" />
              </Button>
            </SheetClose>
          </div>

          <ScrollArea className="flex-1 px-2">
            <div className="py-4 space-y-2">
              <Link
                to="/"
                className="flex items-center px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium rounded-md hover:bg-finance-steel/10"
                onClick={onClose}
              >
                <Home className="w-4 h-4 mr-2" />
                {safeTranslate(t, 'navbar.home', 'Home')}
              </Link>

              {/* Courses */}
              <MobileNavSection 
                title={safeTranslate(t, 'navbar.courses', 'Cours')} 
                icon={BookOpen}
              >
                <Link
                  to="/courses/fundamentals/black-scholes"
                  className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium rounded-md hover:bg-finance-steel/10"
                  onClick={onClose}
                >
                  {safeTranslate(t, 'coursesPage.fundamentals.blackScholes.title', 'Black-Scholes Model')}
                </Link>
                <Link
                  to="/courses/fundamentals/yield-curves"
                  className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium rounded-md hover:bg-finance-steel/10"
                  onClick={onClose}
                >
                  {safeTranslate(t, 'coursesPage.fundamentals.yieldCurves.title', 'Yield Curves')}
                </Link>
                <Link
                  to="/courses/fundamentals/greeks"
                  className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium rounded-md hover:bg-finance-steel/10"
                  onClick={onClose}
                >
                  {safeTranslate(t, 'coursesPage.fundamentals.greeks.title', 'Option Greeks')}
                </Link>
                <Link
                  to="/courses/advanced/implied-vol"
                  className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium rounded-md hover:bg-finance-steel/10"
                  onClick={onClose}
                >
                  {safeTranslate(t, 'coursesPage.advanced.impliedVol.title', 'Implied Volatility')}
                </Link>
              </MobileNavSection>

              {/* Training Lab Section */}
              <MobileNavSection 
                title={safeTranslate(t, 'navbar.trainingLab', 'Training Lab')} 
                icon={Dumbbell} 
                highlighted={true}
              >
                <Link
                  to="/exercises"
                  className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium rounded-md hover:bg-finance-steel/10"
                  onClick={onClose}
                >
                  {safeTranslate(t, 'trainingLab.exercises', 'Exercices Interactifs')}
                </Link>
                <Link
                  to="/survival-mode"
                  className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium rounded-md hover:bg-finance-steel/10"
                  onClick={onClose}
                >
                  {safeTranslate(t, 'trainingLab.survivalMode', 'Mode Survie')}
                </Link>
                <Link
                  to="/quizzes"
                  className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium rounded-md hover:bg-finance-steel/10"
                  onClick={onClose}
                >
                  {safeTranslate(t, 'trainingLab.quizzes', 'Quiz Progressifs')}
                </Link>
              </MobileNavSection>

              {/* Trading Lab Section */}
              <MobileNavSection 
                title={safeTranslate(t, 'navbar.tradingLab', 'Trading Lab')} 
                icon={BarChart3}
              >
                <Link
                  to="/trading/exercises"
                  className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium rounded-md hover:bg-finance-steel/10"
                  onClick={onClose}
                >
                  {safeTranslate(t, 'tradingLab.exercises', 'Exercices')}
                </Link>
                <Link
                  to="/trading/backtest"
                  className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium rounded-md hover:bg-finance-steel/10"
                  onClick={onClose}
                >
                  {safeTranslate(t, 'tradingLab.backtest', 'Backtest')}
                </Link>
                <Link
                  to="/trading/scenarios"
                  className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium rounded-md hover:bg-finance-steel/10"
                  onClick={onClose}
                >
                  {safeTranslate(t, 'tradingLab.scenarios', 'Scénarios')}
                </Link>
                <Link
                  to="/trading/strategies"
                  className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium rounded-md hover:bg-finance-steel/10"
                  onClick={onClose}
                >
                  {safeTranslate(t, 'tradingLab.strategies', 'Stratégies')}
                </Link>
                <Link
                  to="/trading/performance"
                  className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium rounded-md hover:bg-finance-steel/10"
                  onClick={onClose}
                >
                  {safeTranslate(t, 'tradingLab.performance', 'Performances')}
                </Link>
              </MobileNavSection>

              {/* Community */}
              <MobileNavSection 
                title={safeTranslate(t, 'navbar.community', 'Communauté')} 
                icon={Users}
              >
                <Link
                  to="/community/forum"
                  className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium rounded-md hover:bg-finance-steel/10"
                  onClick={onClose}
                >
                  {safeTranslate(t, 'community.forum', 'Forum & Chat')}
                </Link>
                <Link
                  to="/community/challenges"
                  className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium rounded-md hover:bg-finance-steel/10"
                  onClick={onClose}
                >
                  {safeTranslate(t, 'community.challenges', 'Défis Hebdomadaires')}
                </Link>
                <Link
                  to="/community/pair-programming"
                  className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium rounded-md hover:bg-finance-steel/10"
                  onClick={onClose}
                >
                  {safeTranslate(t, 'community.pairProgramming', 'Pair Programming')}
                </Link>
                <Link
                  to="/community/leaderboard"
                  className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium rounded-md hover:bg-finance-steel/10"
                  onClick={onClose}
                >
                  {safeTranslate(t, 'community.leaderboard', 'Leaderboard & Hackathons')}
                </Link>
                <Link
                  to="/community/playground"
                  className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium rounded-md hover:bg-finance-steel/10"
                  onClick={onClose}
                >
                  {safeTranslate(t, 'navbar.community.notebook.title', 'Notebook Playground')}
                </Link>
              </MobileNavSection>

              {/* Pricing */}
              <Link
                to="/pricing"
                className="flex items-center px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium rounded-md hover:bg-finance-steel/10"
                onClick={onClose}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {safeTranslate(t, 'navbar.pricing', 'Tarifs')}
              </Link>

              {/* Tools */}
              <MobileNavSection 
                title={safeTranslate(t, 'navbar.tools', 'Outils')} 
                icon={Wrench}
              >
                <Link
                  to="/tools/volatility-calculator"
                  className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium rounded-md hover:bg-finance-steel/10"
                  onClick={onClose}
                >
                  {safeTranslate(t, 'tools.volatilityCalculator', 'Calculatrices de Volatilité')}
                </Link>
                <Link
                  to="/tools/black-scholes"
                  className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium rounded-md hover:bg-finance-steel/10"
                  onClick={onClose}
                >
                  {safeTranslate(t, 'tools.blackScholes', 'Simulateur Black-Scholes')}
                </Link>
                <Link
                  to="/tools/monte-carlo"
                  className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium rounded-md hover:bg-finance-steel/10"
                  onClick={onClose}
                >
                  {safeTranslate(t, 'tools.monteCarlo', 'Monte Carlo')}
                </Link>
                <Link
                  to="/tools/model-calibration"
                  className="block px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium rounded-md hover:bg-finance-steel/10"
                  onClick={onClose}
                >
                  {safeTranslate(t, 'tools.modelCalibration', 'Calibration de Modèles')}
                </Link>
              </MobileNavSection>

              {/* Blog */}
              <Link
                to="/blog"
                className="flex items-center px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium rounded-md hover:bg-finance-steel/10"
                onClick={onClose}
              >
                <FileText className="w-4 h-4 mr-2" />
                {safeTranslate(t, 'navbar.blog', 'Blog')}
              </Link>

              {/* Bug Report */}
              <Link
                to="/bug-report"
                className="flex items-center px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium rounded-md hover:bg-finance-steel/10"
                onClick={onClose}
              >
                <Bug className="w-4 h-4 mr-2" />
                {safeTranslate(t, 'navbar.bugs', 'Report Bug')}
              </Link>
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-finance-steel/20 space-y-4">
            <div className="flex justify-start">
              <LanguageSwitcher />
            </div>
            <div className="space-y-2">
              {isAuthenticated && profile ? (
                <div className="space-y-2">
                  <Link 
                    to="/dashboard" 
                    onClick={onClose}
                    className="flex items-center px-3 py-2 text-finance-offwhite hover:text-finance-accent font-medium rounded-md hover:bg-finance-steel/10"
                  >
                    {profile.prenom 
                      ? `${st('navbar.greeting', 'Bonjour')}, ${profile.prenom}` 
                      : st('navigation.profile', 'Mon compte')}
                  </Link>
                  <Button 
                    variant="financeOutline" 
                    size="sm" 
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    {st('auth.signout.button', 'Déconnexion')}
                  </Button>
                </div>
              ) : (
                <>
                  <Button variant="financeOutline" size="sm" className="w-full" asChild>
                    <Link to="/login" onClick={onClose}>
                      {safeTranslate(t, 'auth.signin.button', 'Se connecter')}
                    </Link>
                  </Button>
                  <Button variant="finance" size="sm" className="w-full" asChild>
                    <Link to="/signup" onClick={onClose}>
                      {safeTranslate(t, 'auth.signup.button', "S'inscrire")}
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
