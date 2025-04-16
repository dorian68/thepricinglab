
import React from 'react';

// Ce composant sera implémenté ultérieurement pour se connecter à une API IA
const ChatWidget: React.FC = () => {
  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="bg-finance-accent/10 p-2 rounded-lg rounded-tl-none max-w-[80%] ml-2">
        <p className="text-sm">Bonjour ! Comment puis-je vous aider avec votre apprentissage des options financières aujourd'hui ?</p>
      </div>
      
      <div className="bg-finance-accent/10 p-2 rounded-lg rounded-tl-none max-w-[80%] ml-2">
        <p className="text-sm">Vous pouvez me poser des questions sur le pricing d'options, les modèles de volatilité, ou les stratégies de trading.</p>
      </div>
    </div>
  );
};

export default ChatWidget;
