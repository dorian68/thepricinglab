
import React, { useState } from 'react';
import { useNotebookSearch } from '@/hooks/useNotebookSearch';
import { useNotebook } from '@/hooks/useNotebook';
import { NotebookItem } from '@/types/notebook';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NotebookList from '@/components/playground/NotebookList';
import NotebookViewer from '@/components/playground/NotebookViewer';
import NotebookRunner from '@/components/playground/NotebookRunner';
import NotebookFilters from '@/components/playground/NotebookFilters';
import NotebookSharing from '@/components/playground/NotebookSharing';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';
import { BookOpen, Code, Server } from 'lucide-react';

const Playground: React.FC = () => {
  const { notebooks, isLoading, filter, updateFilter } = useNotebookSearch();
  const [selectedNotebook, setSelectedNotebook] = useState<NotebookItem | null>(null);
  const { notebook, tplNotebook, isLoading: isNotebookLoading, error: notebookError, getShareableUrl, shareNotebookAsGist } = useNotebook(
    selectedNotebook?.download_url
  );
  const { t } = useTranslation();
  const categories = ['European', 'Monte-Carlo', 'Exotic', 'Back-test'];

  const handleSelectNotebook = (notebook: NotebookItem) => {
    setSelectedNotebook(notebook);
  };

  const handleFilterChange = (category: string) => {
    updateFilter({ category });
  };

  const handleSearchChange = (query: string) => {
    updateFilter({ query: query || 'option pricing notebook' });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Notebook Playground | The Pricing Library</title>
        <meta 
          name="description" 
          content="Explore, run and modify quantitative finance notebooks with The Pricing Library" 
        />
        {selectedNotebook && (
          <link rel="canonical" href={selectedNotebook.html_url} />
        )}
      </Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold terminal-text mb-2">
            <BookOpen className="inline-block mr-2 h-6 w-6 text-finance-accent" />
            Notebook Playground
          </h1>
          <p className="text-finance-lightgray">
            Explore, run, and modify Python notebooks for quantitative finance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <NotebookFilters 
            onFilterChange={handleFilterChange}
            onSearchChange={handleSearchChange}
            categories={categories}
            activeCategory={filter.category}
            isLoading={isLoading}
          />
          
          <NotebookList 
            notebooks={notebooks} 
            isLoading={isLoading}
            onSelect={handleSelectNotebook}
            selectedId={selectedNotebook?.id}
          />
        </div>
        
        <div className="lg:col-span-2">
          <div className="finance-card p-4">
            <Tabs defaultValue="view" className="w-full">
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
                
                {selectedNotebook && notebook && (
                  <NotebookSharing 
                    getShareableUrl={getShareableUrl}
                    shareAsGist={shareNotebookAsGist}
                    notebookName={selectedNotebook.name}
                  />
                )}
              </div>
              
              <Separator className="mb-4" />
              
              <TabsContent value="view">
                <NotebookViewer 
                  notebook={notebook} 
                  isLoading={isNotebookLoading}
                  error={notebookError}
                />
              </TabsContent>
              
              <TabsContent value="run">
                <div className="space-y-4">
                  <NotebookRunner notebook={tplNotebook} />
                  <NotebookViewer 
                    notebook={tplNotebook} 
                    isLoading={isNotebookLoading}
                    error={notebookError}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Playground;
