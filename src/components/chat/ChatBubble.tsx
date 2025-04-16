
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Minus, Maximize, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ChatBubble: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const bubbleRef = useRef<HTMLDivElement>(null);

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
    if (e.target !== bubbleRef.current) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const onDrag = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = Math.max(0, Math.min(window.innerWidth - 70, e.clientX - dragStart.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 70, e.clientY - dragStart.y));
    
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
    } else {
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', endDrag);
    }

    return () => {
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', endDrag);
    };
  }, [isDragging]);

  // Ajuster la position si la fenêtre est redimensionnée
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 70),
        y: Math.min(prev.y, window.innerHeight - 70)
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
        transition: isDragging ? 'none' : 'all 0.2s ease-in-out'
      }}
      className={`select-none`}
    >
      {isOpen ? (
        <div
          ref={bubbleRef}
          onMouseDown={startDrag}
          className={`bg-white dark:bg-finance-charcoal rounded-lg shadow-lg overflow-hidden transition-all 
            ${isMinimized ? 'w-auto h-auto p-0' : 'w-80 h-96'}`}
        >
          {!isMinimized && (
            <>
              <div className="p-3 bg-finance-accent dark:bg-finance-accent/80 text-white flex justify-between items-center cursor-grab">
                <h3 className="font-medium">Assistant Trading Lab</h3>
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
                  {/* Contenu du chat ici - à remplacer par ChatWidget */}
                  <div className="space-y-4">
                    <div className="bg-finance-accent/10 p-2 rounded-lg rounded-tl-none max-w-[80%] ml-2">
                      <p className="text-sm">Bonjour ! Comment puis-je vous aider avec votre apprentissage des options financières aujourd'hui ?</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 border-t border-gray-200 dark:border-finance-steel/10 flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Tapez votre message..." 
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
          className="h-14 w-14 bg-finance-accent shadow-lg hover:bg-finance-accent/80 text-white rounded-full flex items-center justify-center animate-pulse"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export default ChatBubble;
