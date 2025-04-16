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
  const bubbleRef = useRef<HTMLButtonElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculateSafePosition = () => {
      const chatWidth = isOpen ? 320 : 70;
      const chatHeight = isOpen ? 400 : 70;
      
      return {
        x: Math.max(0, Math.min(window.innerWidth - chatWidth, position.x)),
        y: Math.max(0, Math.min(window.innerHeight - chatHeight, position.y))
      };
    };

    const handleResize = () => {
      setPosition(calculateSafePosition());
    };

    setPosition({
      x: window.innerWidth - 80,
      y: window.innerHeight - 100
    });

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setPosition(prev => {
        const chatWidth = 320;
        const chatHeight = 400;
        
        const newX = prev.x + chatWidth > window.innerWidth 
          ? window.innerWidth - chatWidth 
          : prev.x;
        
        const newY = prev.y - chatHeight + 70 < 0 
          ? 0 
          : prev.y - chatHeight + 70;
        
        return { x: newX, y: newY };
      });
    }
  }, [isOpen]);

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
    
    const chatWidth = isOpen ? 320 : 70;
    const chatHeight = isOpen ? 400 : 70;
    
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
          style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            transform: 'translate(0, -100%)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
          }}
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
