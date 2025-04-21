
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Minimize, Maximize, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerContent, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import ChatWidget from './ChatWidget';
import { useTranslation } from 'react-i18next';

const ChatBubble: React.FC = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ 
    x: typeof window !== 'undefined' ? window.innerWidth - 80 : 0, 
    y: typeof window !== 'undefined' ? window.innerHeight - 100 : 0 
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const bubbleRef = useRef<HTMLButtonElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Positionnement initial du bouton flottant (en bas à droite)
    const updatePosition = () => {
      const margin = 20; // marge par rapport au bord de l'écran
      setPosition({
        x: window.innerWidth - 70 - margin,
        y: window.innerHeight - 70 - margin
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  // Appliquer l'effet split-screen seulement sur desktop
  useEffect(() => {
    const rootElement = document.getElementById('root');
    if (rootElement && !isMobile) {
      if (isOpen && !isMinimized) {
        rootElement.style.width = '75%';
        rootElement.style.transition = 'width 0.3s ease-in-out';
      } else {
        rootElement.style.width = '100%';
      }
    }
    
    return () => {
      if (rootElement) {
        rootElement.style.width = '100%';
      }
    };
  }, [isOpen, isMinimized, isMobile]);

  // Bloquer le scroll lorsque le chat est ouvert sur mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMobile]);

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

  const closeChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
  };

  // Fonctions pour le drag & drop sur desktop
  const startDrag = (e: React.MouseEvent) => {
    if (isMobile) return;
    if (e.target !== bubbleRef.current && 
        (chatContainerRef.current && !chatContainerRef.current.contains(e.target as Node))) return;
    
    if ((e.target as HTMLElement).closest('button[role="button"]')) return;
    
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const onDrag = (e: MouseEvent) => {
    if (!isDragging || isMobile) return;
    
    const bubbleSize = 70;
    const chatWidth = isOpen ? 320 : bubbleSize;
    const chatHeight = isOpen ? 400 : bubbleSize;
    
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
    if (isDragging && !isMobile) {
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

  // Version mobile (utilise Drawer de shadcn)
  if (isMobile) {
    return (
      <>
        <Drawer>
          <DrawerTrigger asChild>
            <Button 
              variant="default" 
              size="icon" 
              className="fixed bottom-5 right-5 h-14 w-14 bg-finance-accent shadow-lg hover:bg-finance-accent/80 text-white rounded-full flex items-center justify-center z-50"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-[90vh] bg-finance-dark text-finance-offwhite border-t border-finance-steel/20">
            <div className="p-3 bg-finance-accent/80 text-white flex justify-between items-center sticky top-0">
              <h3 className="font-medium">{t('chat.title', 'Chat')}</h3>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-white">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
            <div className="flex flex-col h-[calc(100%-3rem)] p-2">
              <div className="flex-grow overflow-y-auto p-2">
                <ChatWidget />
              </div>
              <div className="p-3 border-t border-finance-steel/10 flex gap-2 bg-finance-dark sticky bottom-0">
                <input 
                  type="text" 
                  placeholder={t('chat.placeholder', 'Type your message...')}
                  className="flex-grow p-2 rounded border border-finance-steel/30 dark:bg-finance-charcoal focus:outline-none focus:ring-1 focus:ring-finance-accent"
                />
                <Button size="icon" className="h-10 w-10 rounded-full bg-finance-accent hover:bg-finance-accent/80">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Version desktop (fenêtre flottante avec drag & drop)
  return (
    <>
      {isOpen && (
        <div
          ref={chatContainerRef}
          className={`fixed right-0 top-0 ${isMinimized ? 'w-auto h-auto' : 'w-1/4'} h-screen 
          bg-finance-dark border-l border-finance-steel/30 
          shadow-lg overflow-hidden transition-all duration-300 z-[1000]`}
          style={{
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            transition: isDragging ? 'none' : 'all 0.3s ease-in-out'
          }}
          onMouseDown={startDrag}
        >
          {!isMinimized && (
            <>
              <div className="p-3 bg-finance-accent/80 text-white flex justify-between items-center">
                <h3 className="font-medium">{t('chat.title', 'Chat')}</h3>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-white" onClick={minimizeChat}>
                    <Minimize className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-white" onClick={closeChat}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-col h-[calc(100%-3rem)]">
                <div className="flex-grow p-3 overflow-y-auto">
                  <ChatWidget />
                </div>
                <div className="p-3 border-t border-finance-steel/10 flex gap-2">
                  <input 
                    type="text" 
                    placeholder={t('chat.placeholder', 'Type your message...')}
                    className="flex-grow p-2 rounded border border-finance-steel/30 dark:bg-finance-charcoal focus:outline-none focus:ring-1 focus:ring-finance-accent"
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
      )}
      
      <Button 
        onClick={toggleChat} 
        size="icon" 
        ref={bubbleRef}
        className="fixed h-14 w-14 bg-finance-accent shadow-lg hover:bg-finance-accent/80 text-white rounded-full flex items-center justify-center z-50"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transition: isDragging ? 'none' : 'all 0.2s ease-in-out'
        }}
        onMouseDown={startDrag}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </>
  );
};

export default ChatBubble;
