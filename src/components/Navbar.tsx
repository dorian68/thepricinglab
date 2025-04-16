
import React from 'react';

/**
 * Compatibility component to transition from the old Navbar to AppShell
 * This component simply renders nothing since we're using the AppShell directly
 * 
 * @deprecated Do not use this component. Use the global AppShell layout instead.
 */
const Navbar: React.FC = () => {
  console.warn('Deprecated: Do not use <Navbar> component directly anymore. The navbar is now part of the AppShell layout. This component will be removed in a future update.');
  
  // Render nothing - the navbar is now part of the global layout
  return null;
};

export default Navbar;
