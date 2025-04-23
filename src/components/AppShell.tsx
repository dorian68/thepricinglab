
import React, { Suspense, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import ModernNavbar from './ModernNavbar';
import Footer from './Footer';
import { useTranslation } from 'react-i18next';
import ChatBubble from './chat/ChatBubble';
import { useAuth } from '@/contexts/AuthContext';

const AppShell: React.FC = () => {
  // Initialize the translation hook to ensure i18n is properly loaded
  const { t } = useTranslation();
  const { isAuthenticated, profile, isLoading } = useAuth();

  useEffect(() => {
    console.log("AppShell: Auth state", { isAuthenticated, profile, isLoading });
  }, [isAuthenticated, profile, isLoading]);
  
  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite overflow-x-hidden">
      <ModernNavbar />
      <div className="flex-1">
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center">Chargement...</div>}>
          <Outlet />
        </Suspense>
      </div>
      <Footer />
      <ChatBubble />
    </div>
  );
};

export default AppShell;
