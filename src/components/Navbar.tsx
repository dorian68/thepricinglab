import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sun,
  Moon,
  Menu,
  X,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Shield,
  BrainCircuit,
  LucideIcon,
  Newspaper,
  UsersRound,
  Code,
  Puzzle,
  Flame,
  Coins,
  MessageSquare,
  ScrollText,
  Settings,
  HelpCircle,
  LogOut,
  User,
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  href: string;
  label: string;
  icon?: LucideIcon;
}

const Navbar = () => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const mainNavItems: NavItem[] = [
    { href: "/courses", label: t('navbar.courses', 'Cours'), icon: BookOpen },
    { href: "/practice", label: t('navbar.practice', 'Pratique'), icon: GraduationCap },
    { href: "/tools", label: t('navbar.tools', 'Outils'), icon: BrainCircuit },
    { href: "/community", label: t('navbar.community', 'Communauté'), icon: UsersRound },
    { href: "/blog", label: t('navbar.blog', 'Blog'), icon: Newspaper },
  ];

  const mobileNavItems: NavItem[] = [
    { href: "/dashboard", label: t('navbar.dashboard', 'Tableau de bord'), icon: LayoutDashboard },
    { href: "/projects", label: t('navbar.projects', 'Projets'), icon: Code },
    { href: "/survival-mode", label: t('navbar.survivalMode', 'Mode Survie'), icon: Flame },
    { href: "/quizzes", label: t('navbar.quizzes', 'Quizzes'), icon: Puzzle },
    { href: "/pricing", label: t('navbar.pricing', 'Tarifs'), icon: Coins },
    { href: "/mentoring", label: t('navbar.mentoring', 'Mentoring'), icon: MessageSquare },
    { href: "/leaderboard", label: t('navbar.leaderboard', 'Classement'), icon: ScrollText },
    { href: "/bug-report", label: t('navbar.bugReport', 'Signaler un bug'), icon: HelpCircle },
  ];

  const { user, signOut, isAuthenticated, profile } = useAuth();

  // Check if user is admin
  const isAdmin = user?.user_metadata?.role === 'admin';

  return (
    <>
      <nav className="bg-finance-dark border-b border-finance-steel/10 sticky top-0 z-50">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0">
                <img
                  className="h-8 w-auto"
                  src="/logo.png"
                  alt="The Pricing Library"
                />
              </Link>
              
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {mainNavItems.map((item) => (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className={({ isActive }) =>
                        `text-finance-steel hover:text-finance-accent transition-colors duration-200 flex items-center space-x-1 px-3 py-2 rounded-md ${
                          isActive ? 'bg-finance-burgundy/20 text-finance-offwhite' : ''
                        }`
                      }
                    >
                      {item.icon && <item.icon className="h-4 w-4" />}
                      <span className="text-sm font-medium">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              >
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
              
              {isAdmin && (
                <Link
                  to="/admin-dashboard"
                  className="text-finance-steel hover:text-finance-accent transition-colors duration-200 flex items-center space-x-1 px-3 py-2 rounded-md bg-red-900/20 border border-red-500/30"
                >
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-medium">Admin</span>
                </Link>
              )}
              
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/login"
                    className="text-finance-steel hover:text-finance-accent transition-colors duration-200 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    {t('navbar.login', 'Se connecter')}
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-finance-accent text-finance-dark hover:bg-finance-burgundy transition-colors duration-200 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    {t('navbar.signup', 'S\'inscrire')}
                  </Link>
                </>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email} />
                        <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 mr-2">
                    <DropdownMenuLabel>{profile?.prenom || user?.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>{t('navbar.dashboard', 'Tableau de bord')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile">
                        <User className="mr-2 h-4 w-4" />
                        <span>{t('navbar.profile', 'Profil')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>{t('navbar.settings', 'Paramètres')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={async () => {
                      await signOut();
                      closeMobileMenu();
                    }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t('navbar.logout', 'Se déconnecter')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            <div className="-mr-2 flex md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                <span className="sr-only">Open main menu</span>
              </Button>
            </div>
          </div>
        </div>
        
      </nav>
      
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="bg-finance-dark border-r border-finance-steel/10 w-80">
          <SheetHeader className="space-y-2">
            <SheetTitle>{t('navbar.menu', 'Menu')}</SheetTitle>
            <SheetDescription>
              {t('navbar.explore', 'Explorez les différentes sections de la plateforme')}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 flex flex-col space-y-2">
            {mainNavItems.map((item) => (
              <SheetTrigger asChild key={item.href}>
                <Link
                  to={item.href}
                  className="text-finance-steel hover:text-finance-accent transition-colors duration-200 flex items-center space-x-2 px-4 py-2 rounded-md"
                  onClick={closeMobileMenu}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </SheetTrigger>
            ))}
            <h3 className="text-finance-steel uppercase font-bold text-xs px-4 mt-4">{t('navbar.more', 'Plus')}</h3>
            {mobileNavItems.map((item) => (
              <SheetTrigger asChild key={item.href}>
                <Link
                  to={item.href}
                  className="text-finance-steel hover:text-finance-accent transition-colors duration-200 flex items-center space-x-2 px-4 py-2 rounded-md"
                  onClick={closeMobileMenu}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </SheetTrigger>
            ))}
            <h3 className="text-finance-steel uppercase font-bold text-xs px-4 mt-4">{t('navbar.account', 'Compte')}</h3>
            {!isAuthenticated ? (
              <>
                <SheetTrigger asChild>
                  <Link
                    to="/login"
                    className="text-finance-steel hover:text-finance-accent transition-colors duration-200 flex items-center space-x-2 px-4 py-2 rounded-md"
                    onClick={closeMobileMenu}
                  >
                    {t('navbar.login', 'Se connecter')}
                  </Link>
                </SheetTrigger>
                <SheetTrigger asChild>
                  <Link
                    to="/signup"
                    className="bg-finance-accent text-finance-dark hover:bg-finance-burgundy transition-colors duration-200 flex items-center space-x-2 px-4 py-2 rounded-md"
                    onClick={closeMobileMenu}
                  >
                    {t('navbar.signup', 'S\'inscrire')}
                  </Link>
                </SheetTrigger>
              </>
            ) : (
              <>
                <SheetTrigger asChild>
                  <Link
                    to="/profile"
                    className="text-finance-steel hover:text-finance-accent transition-colors duration-200 flex items-center space-x-2 px-4 py-2 rounded-md"
                    onClick={closeMobileMenu}
                  >
                    <User className="h-4 w-4" />
                    {t('navbar.profile', 'Profil')}
                  </Link>
                </SheetTrigger>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-finance-steel hover:text-finance-accent transition-colors duration-200 flex items-center space-x-2 px-4 py-2 rounded-md justify-start"
                    onClick={async () => {
                      await signOut();
                      closeMobileMenu();
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    {t('navbar.logout', 'Se déconnecter')}
                  </Button>
                </SheetTrigger>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="ml-2 mt-4"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Navbar;
