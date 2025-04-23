
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
    
    // Vérifiez que i18n a été correctement initialisé
    if (!i18n.isInitialized) {
      console.error("i18n n'a pas été correctement initialisé");
      toast.error("Erreur d'initialisation", {
        description: "Problème avec les traductions. Rechargement nécessaire.",
      });
    }
  }, [isAuthenticated, profile, isLoading, i18n]);
  
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
