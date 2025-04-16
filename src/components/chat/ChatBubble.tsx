
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Minus, Maximize, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatWidget from './ChatWidget';
import { useTranslation } from 'react-i18next';

const ChatBubble: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ 
    x: window.innerWidth - 80, 
    y: window.innerHeight - 100 
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const bubbleRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Recalcule la position quand la fenêtre est redimensionnée
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        // Assurez-vous que la bulle reste dans les limites de l'écran après redimensionnement
        const newX = Math.min(prev.x, window.innerWidth - 80);
        const newY = Math.min(prev.y, window.innerHeight - 80);
        return { x: newX, y: newY };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Définit la position initiale en bas à droite
  useEffect(() => {
    setPosition({
      x: window.innerWidth - 80,
      y: window.innerHeight - 100
    });
  }, []);

  const toggleChat = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const minimizeChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(true);
  };

  const maximizeChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(false);
  };

  // Gestion du drag & drop de la bulle de chat
  const startDrag = (e: React.MouseEvent) => {
    if (e.target !== bubbleRef.current && e.target !== chatContainerRef.current) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const onDrag = (e: MouseEvent) => {
    if (!isDragging) return;
    
    // Limiter la position pour que la bulle reste toujours visible dans la fenêtre
    const chatWidth = isOpen ? 320 : 70; // Largeur estimée de la bulle ou du chat ouvert
    const chatHeight = isOpen ? 400 : 70; // Hauteur estimée de la bulle ou du chat ouvert
    
    const newX = Math.max(0, Math.min(window.innerWidth - chatWidth, e.clientX - dragStart.x));
    const newY = Math.max(0, Math.min(window.innerHeight - chatHeight, e.clientY - dragStart.y));
    
    setPosition({
      x: newX,
      y: newY
    });
  };

  const endDrag = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onDrag);
      window.addEventListener('mouseup', endDrag);
      window.addEventListener('touchmove', onDragTouch);
      window.addEventListener('touchend', endDrag);
    } else {
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', endDrag);
      window.removeEventListener('touchmove', onDragTouch);
      window.removeEventListener('touchend', endDrag);
    }

    return () => {
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', endDrag);
      window.removeEventListener('touchmove', onDragTouch);
      window.removeEventListener('touchend', endDrag);
    };
  }, [isDragging]);

  // Support tactile pour le drag
  const onDragTouch = (e: TouchEvent) => {
    if (!isDragging || !e.touches[0]) return;
    
    const touch = e.touches[0];
    const chatWidth = isOpen ? 320 : 70;
    const chatHeight = isOpen ? 400 : 70;
    
    const newX = Math.max(0, Math.min(window.innerWidth - chatWidth, touch.clientX - dragStart.x));
    const newY = Math.max(0, Math.min(window.innerHeight - chatHeight, touch.clientY - dragStart.y));
    
    setPosition({
      x: newX,
      y: newY
    });
  };

  const startDragTouch = (e: React.TouchEvent) => {
    if (!e.touches[0]) return;
    if (e.target !== bubbleRef.current && e.target !== chatContainerRef.current) return;
    
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
        transition: isDragging ? 'none' : 'all 0.2s ease-in-out'
      }}
      className="select-none"
    >
      {isOpen ? (
        <div
          ref={chatContainerRef}
          onMouseDown={startDrag}
          onTouchStart={startDragTouch}
          className={`bg-white dark:bg-finance-charcoal rounded-lg shadow-lg overflow-hidden transition-all 
            ${isMinimized ? 'w-auto h-auto p-0' : 'w-80 h-96'}`}
        >
          {!isMinimized && (
            <>
              <div className="p-3 bg-finance-accent dark:bg-finance-accent/80 text-white flex justify-between items-center cursor-grab">
                <h3 className="font-medium">{t('chat.title')}</h3>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-white" onClick={minimizeChat}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-white" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-col h-[calc(100%-3rem)]">
                <div className="flex-grow p-3 overflow-y-auto bg-gray-50 dark:bg-finance-dark/50">
                  <ChatWidget />
                </div>
                <div className="p-3 border-t border-gray-200 dark:border-finance-steel/10 flex gap-2">
                  <input 
                    type="text" 
                    placeholder={t('chat.placeholder')}
                    className="flex-grow p-2 rounded border border-gray-300 dark:border-finance-steel/30 dark:bg-finance-charcoal focus:outline-none focus:ring-1 focus:ring-finance-accent"
                  />
                  <Button size="icon" className="h-10 w-10 rounded-full bg-finance-accent hover:bg-finance-accent/80">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}

          {isMinimized && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 bg-finance-accent text-white rounded-full hover:bg-finance-accent/80"
              onClick={maximizeChat}
            >
              <Maximize className="h-5 w-5" />
            </Button>
          )}
        </div>
      ) : (
        <Button 
          onClick={toggleChat} 
          size="icon" 
          ref={bubbleRef}
          className="h-14 w-14 bg-finance-accent shadow-lg hover:bg-finance-accent/80 text-white rounded-full flex items-center justify-center"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export default ChatBubble;
