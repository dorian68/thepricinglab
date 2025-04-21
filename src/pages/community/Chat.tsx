
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { safeTranslate } from '@/utils/translationUtils';
import { 
  MessageSquare, 
  Users, 
  Send, 
  Search, 
  Clock, 
  PlusCircle,
  Menu,
  X,
  ChevronRight,
  Settings,
  MoreHorizontal,
  FileCode,
  Image,
  Link,
  Smile
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

// Données mockées pour les canaux
const channels = [
  { id: 'general', name: 'Général', unread: 3, description: 'Discussions générales sur la finance quantitative' },
  { id: 'derivatives', name: 'Produits dérivés', unread: 0, description: 'Discussions sur les options, futures, swaps et autres dérivés' },
  { id: 'volatility', name: 'Volatilité', unread: 7, description: 'Discussions sur les modèles de volatilité et leur calibration' },
  { id: 'python', name: 'Python', unread: 0, description: 'Entraide et discussions sur Python pour la finance' },
  { id: 'careers', name: 'Carrières', unread: 0, description: 'Offres d\'emploi, discussions sur les carrières en finance quantitative' },
  { id: 'events', name: 'Événements', unread: 2, description: 'Annonces et discussions sur les événements à venir' }
];

// Données mockées pour les messages
const mockMessages = [
  {
    id: 1,
    channel: 'general',
    user: {
      name: 'QuantDev',
      avatar: 'https://i.pravatar.cc/150?img=1'
    },
    content: 'Bonjour à tous ! Je suis nouveau dans ce groupe. Je travaille principalement sur le pricing d\'options exotiques.',
    timestamp: '09:30',
    reactions: [
      { emoji: '👋', count: 3 },
      { emoji: '🚀', count: 1 }
    ]
  },
  {
    id: 2,
    channel: 'general',
    user: {
      name: 'MathFinance',
      avatar: 'https://i.pravatar.cc/150?img=2'
    },
    content: 'Bienvenue @QuantDev ! Sur quels types d\'options exotiques travailles-tu principalement ?',
    timestamp: '09:33',
    reactions: []
  },
  {
    id: 3,
    channel: 'general',
    user: {
      name: 'VolTrader',
      avatar: 'https://i.pravatar.cc/150?img=3'
    },
    content: 'Quelqu\'un a-t-il des ressources sur l\'implémentation des modèles SABR en Python ? Je cherche des exemples de code efficaces.',
    timestamp: '09:45',
    reactions: []
  },
  {
    id: 4,
    channel: 'general',
    user: {
      name: 'QuantDev',
      avatar: 'https://i.pravatar.cc/150?img=1'
    },
    content: '@MathFinance Je travaille principalement sur les options barrière et les options asiatiques. J\'utilise Monte Carlo avec réduction de variance.',
    timestamp: '09:47',
    reactions: [
      { emoji: '👍', count: 2 }
    ]
  },
  {
    id: 5,
    channel: 'general',
    user: {
      name: 'AlgoTrader',
      avatar: 'https://i.pravatar.cc/150?img=4'
    },
    content: '@VolTrader J\'ai récemment publié un notebook sur GitHub avec une implémentation SABR. Je te partage le lien en privé.',
    timestamp: '09:52',
    reactions: [
      { emoji: '🙏', count: 1 }
    ]
  }
];

// Données mockées pour les utilisateurs en ligne
const onlineUsers = [
  { id: 1, name: 'QuantDev', avatar: 'https://i.pravatar.cc/150?img=1', status: 'online' },
  { id: 2, name: 'MathFinance', avatar: 'https://i.pravatar.cc/150?img=2', status: 'online' },
  { id: 3, name: 'VolTrader', avatar: 'https://i.pravatar.cc/150?img=3', status: 'away' },
  { id: 4, name: 'AlgoTrader', avatar: 'https://i.pravatar.cc/150?img=4', status: 'online' },
  { id: 5, name: 'DataAnalyst', avatar: 'https://i.pravatar.cc/150?img=5', status: 'offline' },
  { id: 6, name: 'RiskManager', avatar: 'https://i.pravatar.cc/150?img=6', status: 'online' },
  { id: 7, name: 'OptionStrategist', avatar: 'https://i.pravatar.cc/150?img=7', status: 'away' },
  { id: 8, name: 'PyDeveloper', avatar: 'https://i.pravatar.cc/150?img=8', status: 'online' }
];

const Chat = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [activeChannel, setActiveChannel] = useState('general');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(mockMessages);
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrer les messages par canal actif
  const channelMessages = messages.filter(msg => msg.channel === activeChannel);
  
  // Définir le titre et la description du canal actif
  const currentChannel = channels.find(ch => ch.id === activeChannel);

  // Scroll au dernier message à chaque changement de canal ou nouveau message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannel]);

  // Fermer la sidebar sur mobile lors du changement de canal
  const handleChannelChange = (channelId: string) => {
    setActiveChannel(channelId);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  // Envoi d'un nouveau message
  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        channel: activeChannel,
        user: {
          name: 'Vous',
          avatar: 'https://i.pravatar.cc/150?img=10'
        },
        content: message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reactions: []
      };
      
      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  // Gérer la touche Enter pour envoyer le message
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="container mx-auto px-0 md:px-4 py-0 md:py-8 h-[calc(100vh-64px)]">
      <div className="flex h-full bg-finance-dark rounded-lg overflow-hidden border border-finance-steel/10">
        {/* Sidebar - Canaux et utilisateurs */}
        <div 
          className={`${
            showSidebar ? 'flex' : 'hidden'
          } flex-col w-full md:w-72 bg-finance-charcoal border-r border-finance-steel/10 h-full`}
        >
          <div className="p-3 border-b border-finance-steel/10 flex justify-between items-center">
            <h2 className="font-medium text-finance-accent">
              {safeTranslate(t, 'community.chat.channels', 'Canaux')}
            </h2>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowSidebar(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-2">
            <div className="relative mb-3">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-finance-lightgray" />
              <Input 
                placeholder={safeTranslate(t, 'community.chat.searchChannels', 'Rechercher des canaux...')}
                className="pl-8 h-8 text-sm bg-finance-dark"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button variant="outline" size="sm" className="w-full mb-3 flex items-center justify-center">
              <PlusCircle className="h-4 w-4 mr-2" />
              {safeTranslate(t, 'community.chat.newChannel', 'Nouveau canal')}
            </Button>
          </div>
          
          <Tabs defaultValue="channels" className="flex-1 flex flex-col">
            <TabsList className="h-10 w-full bg-transparent border-b border-finance-steel/10">
              <TabsTrigger 
                value="channels" 
                className="flex-1 data-[state=active]:text-finance-accent data-[state=active]:border-b-2 data-[state=active]:border-finance-accent rounded-none"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {safeTranslate(t, 'community.chat.channels', 'Canaux')}
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="flex-1 data-[state=active]:text-finance-accent data-[state=active]:border-b-2 data-[state=active]:border-finance-accent rounded-none"
              >
                <Users className="h-4 w-4 mr-2" />
                {safeTranslate(t, 'community.chat.users', 'Utilisateurs')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="channels" className="flex-1 overflow-y-auto p-0 m-0">
              <div className="py-2">
                {channels
                  .filter(channel => channel.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(channel => (
                    <button
                      key={channel.id}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between rounded hover:bg-finance-dark/30 ${
                        activeChannel === channel.id ? 'bg-finance-dark/50 text-finance-accent' : 'text-finance-offwhite'
                      }`}
                      onClick={() => handleChannelChange(channel.id)}
                    >
                      <div className="flex items-center">
                        <span className="text-sm font-medium">#{channel.name}</span>
                      </div>
                      {channel.unread > 0 && (
                        <Badge variant="default" className="bg-finance-accent text-xs">
                          {channel.unread}
                        </Badge>
                      )}
                    </button>
                  ))}
              </div>
            </TabsContent>
            
            <TabsContent value="users" className="flex-1 overflow-y-auto p-0 m-0">
              <div className="py-2">
                {onlineUsers
                  .filter(user => user.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(user => (
                    <div
                      key={user.id}
                      className="px-3 py-2 flex items-center hover:bg-finance-dark/30 cursor-pointer"
                    >
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full overflow-hidden">
                          <img 
                            src={user.avatar} 
                            alt={user.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div 
                          className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-finance-charcoal rounded-full ${
                            user.status === 'online' ? 'bg-green-500' : 
                            user.status === 'away' ? 'bg-yellow-500' : 
                            'bg-gray-500'
                          }`}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm">{user.name}</span>
                    </div>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="p-3 border-t border-finance-steel/10">
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <Settings className="h-4 w-4 mr-2" />
              {safeTranslate(t, 'community.chat.settings', 'Paramètres du chat')}
            </Button>
          </div>
        </div>
        
        {/* Zone principale de chat */}
        <div className="flex-1 flex flex-col h-full">
          {/* En-tête du canal */}
          <div className="p-3 border-b border-finance-steel/10 flex justify-between items-center">
            <div className="flex items-center">
              {!showSidebar && (
                <Button variant="ghost" size="sm" className="mr-2 h-8 w-8 p-0" onClick={() => setShowSidebar(true)}>
                  <Menu className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h2 className="font-medium text-finance-accent flex items-center">
                  #{currentChannel?.name}
                </h2>
                <p className="text-finance-lightgray text-xs">
                  {currentChannel?.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Search className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    {safeTranslate(t, 'community.chat.pinChannel', 'Épingler le canal')}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    {safeTranslate(t, 'community.chat.muteNotifications', 'Désactiver les notifications')}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    {safeTranslate(t, 'community.chat.channelInfo', 'Informations sur le canal')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {channelMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-finance-lightgray">
                <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
                <p className="mb-2">
                  {safeTranslate(t, 'community.chat.noMessages', 'Aucun message dans ce canal')}
                </p>
                <p className="text-sm">
                  {safeTranslate(t, 'community.chat.startConversation', 'Soyez le premier à envoyer un message !')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {channelMessages.map((msg) => (
                  <div key={msg.id} className="flex items-start">
                    <div className="mr-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <img 
                          src={msg.user.avatar} 
                          alt={msg.user.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <span className="font-medium mr-2">{msg.user.name}</span>
                        <span className="text-finance-lightgray text-xs flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {msg.timestamp}
                        </span>
                      </div>
                      
                      <div className="text-finance-offwhite mb-2">
                        {msg.content}
                      </div>
                      
                      {msg.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {msg.reactions.map((reaction, index) => (
                            <button key={index} className="flex items-center bg-finance-charcoal/50 px-2 py-0.5 rounded-full text-xs">
                              <span className="mr-1">{reaction.emoji}</span>
                              <span>{reaction.count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          {/* Zone de saisie de message */}
          <div className="p-3 border-t border-finance-steel/10">
            <div className="relative">
              <Textarea
                placeholder={safeTranslate(t, 'community.chat.typeMessage', 'Écrivez votre message...')}
                className="min-h-[80px] resize-none pr-12"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div className="absolute bottom-3 right-3 flex items-center">
                <button className="text-finance-lightgray hover:text-finance-accent p-1">
                  <Smile className="h-5 w-5" />
                </button>
                <button className="text-finance-lightgray hover:text-finance-accent p-1">
                  <FileCode className="h-5 w-5" />
                </button>
                <button className="text-finance-lightgray hover:text-finance-accent p-1">
                  <Image className="h-5 w-5" />
                </button>
                <button className="text-finance-lightgray hover:text-finance-accent p-1">
                  <Link className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="flex justify-end mt-2">
              <Button 
                variant="finance"
                className="flex items-center"
                onClick={handleSendMessage}
                disabled={!message.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                {safeTranslate(t, 'community.chat.send', 'Envoyer')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
