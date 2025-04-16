
import React from 'react';
import AppShell from './AppShell';

/**
 * Compatibility component to transition from the old Navbar to AppShell
 * This component simply renders AppShell, which contains ModernNavbar
 * 
 * @deprecated Use <AppShell> directly in your layout instead
 */
const Navbar: React.FC = () => {
  console.warn('Deprecated: Please use AppShell instead of Navbar. This component will be removed in a future update.');
  
  return (
    <AppShell />
  );
};

export default Navbar;
