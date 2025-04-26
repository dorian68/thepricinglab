
import React, { Suspense, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import ModernNavbar from './ModernNavbar';
import Footer from './Footer';
import { useTranslation } from 'react-i18next';
import ChatBubble from './chat/ChatBubble';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const AppShell: React.FC = () => {
  // Initialize the translation hook to ensure i18n is properly loaded
  const { t, i18n } = useTranslation();
  const { isAuthenticated, profile, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("AppShell: Auth state", { isAuthenticated, profile, isLoading });
    
    // Check that i18n has been properly initialized
    if (i18n && !i18n.isInitialized) {
      console.error("i18n has not been properly initialized");
      toast.error(t("common.error", "Error"), {
        description: t("i18n.initError", "Translation problem. Reload may be required."),
      });
    } else {
      console.log("i18n initialized successfully in AppShell");
    }
  }, [isAuthenticated, profile, isLoading, i18n, t]);
  
  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite overflow-x-hidden">
      <ModernNavbar />
      <div className="flex-1">
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center">{t('common.loading', 'Loading...')}</div>}>
          <Outlet />
        </Suspense>
      </div>
      <Footer />
      <ChatBubble />
    </div>
  );
};

export default AppShell;
