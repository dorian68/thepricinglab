
import React, { Suspense, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import ModernNavbar from './ModernNavbar';
import Footer from './Footer';
import NewsletterBanner from './NewsletterBanner';
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
    if (i18n && !i18n.isInitialized) {
      toast.error(t("common.error", "Error"), {
        description: t("i18n.initError", "Translation problem. Reload may be required."),
      });
    }
  }, [i18n, t]);
  
  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite overflow-x-hidden">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded">
        Skip to content
      </a>
      <ModernNavbar />
      <NewsletterBanner />
      <div className="flex-1" id="main-content">
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
