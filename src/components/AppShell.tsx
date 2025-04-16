
import React from 'react';
import { Outlet } from 'react-router-dom';
import ModernNavbar from './ModernNavbar';

const AppShell: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <ModernNavbar />
      <Outlet />
    </div>
  );
};

export default AppShell;
