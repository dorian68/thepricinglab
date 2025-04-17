
import React from 'react';
import { Outlet } from 'react-router-dom';
import ModernNavbar from './ModernNavbar';
import Footer from './Footer';
import { useTranslation } from 'react-i18next';

const AppShell: React.FC = () => {
  // Initialize the translation hook to ensure i18n is properly loaded
  useTranslation();
  
  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite">
      <ModernNavbar />
      <div className="flex-1">
        <Outlet />
      </div>
      {/* Ce Footer est le seul qui doit être présent dans l'application */}
      <Footer />
    </div>
  );
};

export default AppShell;
