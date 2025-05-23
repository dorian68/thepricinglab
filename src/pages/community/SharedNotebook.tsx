
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { decodeNotebookFromURL } from '@/services/notebookService';
import { NotebookContent } from '@/types/notebook';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NotebookViewer from '@/components/playground/NotebookViewer';
import NotebookRunner from '@/components/playground/NotebookRunner';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { BookOpen, Code, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const SharedNotebook: React.FC = () => {
  const location = useLocation();
  const [notebook, setNotebook] = useState<NotebookContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadNotebook = () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams(location.search);
        const encodedNotebook = params.get('notebook');
        
        if (!encodedNotebook) {
          setError('No notebook data found in URL');
          setIsLoading(false);
          return;
        }
        
        const decodedNotebook = decodeNotebookFromURL(encodedNotebook);
        
        if (!decodedNotebook) {
          setError('Failed to decode notebook data');
          setIsLoading(false);
          return;
        }
        
        setNotebook(decodedNotebook);
      } catch (err) {
        setError('Failed to load shared notebook');
        console.error('Error loading notebook:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadNotebook();
  }, [location.search]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Shared Notebook | The Pricing Library</title>
        <meta 
          name="description" 
          content="View and run shared quantitative finance notebook" 
        />
      </Helmet>

      <div className="flex items-center mb-6">
        <Link to="/community/playground" className="text-finance-accent hover:text-finance-accent/80 mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold terminal-text mb-2">
            <BookOpen className="inline-block mr-2 h-6 w-6 text-finance-accent" />
            Shared Notebook
          </h1>
          <p className="text-finance-lightgray">
            This notebook has been shared with TPL enhancements
          </p>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          
          <Button asChild variant="outline" className="mt-4">
            <Link to="/community/playground">
              Go to Playground
            </Link>
          </Button>
        </Alert>
      ) : (
        <div className="finance-card p-4">
          <Tabs defaultValue="run" className="w-full">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="view" className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  View
                </TabsTrigger>
                <TabsTrigger value="run" className="flex items-center">
                  <Code className="h-4 w-4 mr-2" />
                  Run
                </TabsTrigger>
              </TabsList>
            </div>
            
            <Separator className="mb-4" />
            
            <TabsContent value="view">
              <NotebookViewer 
                notebook={notebook} 
                isLoading={isLoading}
                error={error}
              />
            </TabsContent>
            
            <TabsContent value="run">
              <div className="space-y-4">
                <NotebookRunner notebook={notebook} />
                <NotebookViewer 
                  notebook={notebook} 
                  isLoading={isLoading}
                  error={error}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default SharedNotebook;
