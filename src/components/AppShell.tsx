
import React from 'react';
import { Outlet } from 'react-router-dom';
import ChatBubble from './chat/ChatBubble';

const AppShell: React.FC = () => {
  return (
    <>
      <Outlet />
      <ChatBubble />
    </>
  );
};

export default AppShell;
