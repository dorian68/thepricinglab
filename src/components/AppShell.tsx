
import React from 'react';
import { Outlet } from 'react-router-dom';
import ChatBubble from './chat/ChatBubble';

const AppShell: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Outlet />
      {/* Move ChatBubble outside of the main AppShell */}
    </div>
  );
};

export default AppShell;
