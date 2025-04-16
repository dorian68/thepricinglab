
import React from 'react';
import { useTranslation } from 'react-i18next';

const ChatWidget: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="bg-finance-accent/10 p-2 rounded-lg rounded-tl-none max-w-[80%] ml-2">
        <p className="text-sm">{t('chat.welcomeMessage')}</p>
      </div>
      
      <div className="bg-finance-accent/10 p-2 rounded-lg rounded-tl-none max-w-[80%] ml-2">
        <p className="text-sm">{t('chat.tipMessage')}</p>
      </div>
    </div>
  );
};

export default ChatWidget;
