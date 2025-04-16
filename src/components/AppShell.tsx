
import React from 'react';
import { Outlet } from 'react-router-dom';
import ModernNavbar from './ModernNavbar';
import Footer from './Footer';

const AppShell: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite">
      <ModernNavbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

export default AppShell;
