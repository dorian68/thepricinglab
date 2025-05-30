
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Github, Link as LinkIcon, Plus } from 'lucide-react';
import { useGitHubConnection } from '../../hooks/useGitHubConnection';
import { toast } from 'sonner';

const GitHubConnector: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { connectWithUrl, isLoading } = useGitHubConnection();

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!repoUrl.trim()) {
      toast.error('Veuillez entrer une URL GitHub valide');
      return;
    }

    setIsSubmitting(true);
    try {
      await connectWithUrl(repoUrl.trim());
      toast.success('Projet ajouté avec succès !');
      setRepoUrl('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'ajout du projet');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="finance-card">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Github className="h-5 w-5 mr-2 text-finance-accent" />
          Ajouter un projet GitHub
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-finance-lightgray text-sm">
          Ajoutez un projet Python depuis GitHub pour l'explorer et le tester dans notre Playground.
        </div>
        
        <form onSubmit={handleUrlSubmit} className="space-y-3">
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-finance-lightgray" />
            <Input
              type="url"
              placeholder="https://github.com/username/repository"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="pl-10"
              disabled={isSubmitting || isLoading}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            variant="finance"
            disabled={isSubmitting || isLoading || !repoUrl.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Ajout en cours...' : 'Ajouter le projet'}
          </Button>
        </form>

        <div className="text-finance-lightgray text-xs">
          <strong>Exemples :</strong>
          <div className="mt-1 space-y-1">
            <div>• https://github.com/quantlib/quantlib</div>
            <div>• https://github.com/stefan-jansen/machine-learning-for-trading</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GitHubConnector;
