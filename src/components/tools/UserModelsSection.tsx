
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalibrationModel, CalibrationModelFormData } from '@/types/community';
import { PlusCircle, Filter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserModelCard from './UserModelCard';
import ModelSubmissionDialog from './ModelSubmissionDialog';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

interface UserModelsSectionProps {
  isAuthenticated: boolean;
  userName: string;
  userId: string;
}

const UserModelsSection: React.FC<UserModelsSectionProps> = ({ 
  isAuthenticated,
  userName,
  userId
}) => {
  // In a real app, we would fetch these from a database
  const [userModels, setUserModels] = useState<CalibrationModel[]>([
    {
      id: '1',
      name: 'Enhanced Heston Model',
      description: 'Une variante du modèle Heston avec une calibration plus robuste pour les marchés volatils',
      code: 'function calibrateEnhancedHeston(marketData) {\n  // Implementation\n}',
      domain: 'vol',
      author: 'Sophie Martin',
      authorId: 'user1',
      createdAt: '2023-04-15',
      isPublic: true,
      isDraft: false
    },
    {
      id: '2',
      name: 'Jump Diffusion SABR',
      description: 'Intégration de sauts dans le modèle SABR pour mieux capturer les événements extrêmes',
      code: '// Jump Diffusion SABR model\nclass JumpDiffusionSABR {\n  constructor() {...}\n  calibrate() {...}\n}',
      domain: 'equity',
      author: 'Jean Dupont',
      authorId: 'user2',
      createdAt: '2023-05-22',
      isPublic: true,
      isDraft: false
    }
  ]);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  const handleTestModel = (model: CalibrationModel) => {
    toast.info(`Test du modèle "${model.name}" lancé`, {
      description: "Cette fonctionnalité est en cours de développement"
    });
  };
  
  const handleSubmitModel = (formData: CalibrationModelFormData) => {
    const newModel: CalibrationModel = {
      id: uuidv4(),
      ...formData,
      author: userName,
      authorId: userId,
      createdAt: new Date().toISOString(),
      isDraft: true
    };
    
    setUserModels(prev => [newModel, ...prev]);
    setDialogOpen(false);
    
    toast.success('Modèle ajouté avec succès', {
      description: formData.isPublic 
        ? "Votre modèle a été ajouté en tant que brouillon public."
        : "Votre modèle privé a été ajouté. Il n'est visible que par vous."
    });
  };
  
  // Filter models based on the active tab
  const getFilteredModels = () => {
    switch (activeTab) {
      case 'public':
        return userModels.filter(model => model.isPublic);
      case 'private':
        return userModels.filter(model => !model.isPublic);
      case 'mine':
        return userModels.filter(model => model.authorId === userId);
      default:
        return userModels;
    }
  };
  
  const filteredModels = getFilteredModels();
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium text-finance-accent">Modèles contributifs</h2>
        {isAuthenticated && (
          <Button 
            onClick={() => setDialogOpen(true)}
            variant="finance"
            size="sm"
            className="flex items-center gap-1"
          >
            <PlusCircle size={16} />
            <span>Ajouter un modèle</span>
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-finance-charcoal">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="public">Publics</TabsTrigger>
            <TabsTrigger value="private">Privés</TabsTrigger>
            {isAuthenticated && <TabsTrigger value="mine">Mes modèles</TabsTrigger>}
          </TabsList>
          
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Filter size={14} />
            <span>Filtrer</span>
          </Button>
        </div>
        
        <TabsContent value="all" className="mt-0">
          {filteredModels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredModels.map(model => (
                <UserModelCard 
                  key={model.id}
                  model={model}
                  onTest={handleTestModel}
                  isOwner={model.authorId === userId}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 bg-finance-steel/5 border-dashed border-finance-steel/30">
              <div className="text-center">
                <p className="text-finance-lightgray">Aucun modèle disponible dans cette catégorie</p>
                {isAuthenticated && (
                  <Button 
                    variant="outline" 
                    className="mt-4 border-finance-accent text-finance-accent"
                    onClick={() => setDialogOpen(true)}
                  >
                    Soyez le premier à ajouter un modèle
                  </Button>
                )}
              </div>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="public" className="mt-0">
          {filteredModels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredModels.map(model => (
                <UserModelCard 
                  key={model.id}
                  model={model}
                  onTest={handleTestModel}
                  isOwner={model.authorId === userId}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 bg-finance-steel/5 border-dashed border-finance-steel/30">
              <div className="text-center">
                <p className="text-finance-lightgray">Aucun modèle public disponible</p>
                {isAuthenticated && (
                  <Button 
                    variant="outline" 
                    className="mt-4 border-finance-accent text-finance-accent"
                    onClick={() => setDialogOpen(true)}
                  >
                    Soyez le premier à ajouter un modèle public
                  </Button>
                )}
              </div>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="private" className="mt-0">
          {filteredModels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredModels.map(model => (
                <UserModelCard 
                  key={model.id}
                  model={model}
                  onTest={handleTestModel}
                  isOwner={model.authorId === userId}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 bg-finance-steel/5 border-dashed border-finance-steel/30">
              <div className="text-center">
                <p className="text-finance-lightgray">Aucun modèle privé disponible</p>
                {isAuthenticated && (
                  <Button 
                    variant="outline" 
                    className="mt-4 border-finance-accent text-finance-accent"
                    onClick={() => setDialogOpen(true)}
                  >
                    Ajouter un modèle privé
                  </Button>
                )}
              </div>
            </Card>
          )}
        </TabsContent>
        
        {isAuthenticated && (
          <TabsContent value="mine" className="mt-0">
            {filteredModels.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredModels.map(model => (
                  <UserModelCard 
                    key={model.id}
                    model={model}
                    onTest={handleTestModel}
                    isOwner={model.authorId === userId}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 bg-finance-steel/5 border-dashed border-finance-steel/30">
                <div className="text-center">
                  <p className="text-finance-lightgray">Vous n'avez pas encore ajouté de modèle</p>
                  <Button 
                    variant="outline" 
                    className="mt-4 border-finance-accent text-finance-accent"
                    onClick={() => setDialogOpen(true)}
                  >
                    Ajouter votre premier modèle
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
      
      {isAuthenticated && (
        <ModelSubmissionDialog 
          open={dialogOpen} 
          onOpenChange={setDialogOpen}
          onSubmit={handleSubmitModel}
          userName={userName}
        />
      )}
    </div>
  );
};

export default UserModelsSection;
