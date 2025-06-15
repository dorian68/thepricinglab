import React, { useState, useEffect } from 'react';
import { useNotebookSearch } from '@/hooks/useNotebookSearch';
import { useNotebook } from '@/hooks/useNotebook';
import { NotebookItem } from '@/types/notebook';
import { ProjectMetadata, GitHubFile } from '@/types/github';
import { Helmet } from 'react-helmet-async';
import SEOHead from '@/components/SEOHead';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NotebookList from '@/components/playground/NotebookList';
import NotebookViewer from '@/components/playground/NotebookViewer';
import NotebookRunner from '@/components/playground/NotebookRunner';
import NotebookFilters from '@/components/playground/NotebookFilters';
import NotebookSharing from '@/components/playground/NotebookSharing';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';
import { BookOpen, Code, Server, Github, FileText, FolderOpen } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const Playground: React.FC = () => {
  const { notebooks, isLoading, filter, updateFilter } = useNotebookSearch();
  const [selectedNotebook, setSelectedNotebook] = useState<NotebookItem | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectMetadata | null>(null);
  const [selectedFile, setSelectedFile] = useState<GitHubFile | null>(null);
  const [searchParams] = useSearchParams();
  const { notebook, tplNotebook, isLoading: isNotebookLoading, error: notebookError, getShareableUrl, shareNotebookAsGist } = useNotebook(
    selectedNotebook?.download_url
  );
  const { t } = useTranslation();
  const categories = ['European', 'Monte-Carlo', 'Exotic', 'Back-test'];

  useEffect(() => {
    const projectId = searchParams.get('project');
    if (projectId) {
      // Try to load project from localStorage
      const storedProject = localStorage.getItem('playground-project');
      if (storedProject) {
        try {
          const project = JSON.parse(storedProject);
          if (project.id === decodeURIComponent(projectId)) {
            setSelectedProject(project);
          }
        } catch (e) {
          console.warn('Failed to load stored project:', e);
        }
      }
    }
  }, [searchParams]);

  const handleSelectNotebook = (notebook: NotebookItem) => {
    setSelectedNotebook(notebook);
    setSelectedProject(null);
    setSelectedFile(null);
  };

  const handleSelectFile = (file: GitHubFile) => {
    setSelectedFile(file);
    setSelectedNotebook(null);
  };

  const handleFilterChange = (category: string) => {
    updateFilter({ category });
  };

  const handleSearchChange = (query: string) => {
    updateFilter({ query: query || 'option pricing notebook' });
  };

  const getFileIcon = (file: GitHubFile) => {
    if (file.type === 'dir') return <FolderOpen className="h-4 w-4 text-finance-accent" />;
    if (file.name.endsWith('.py')) return <Code className="h-4 w-4 text-blue-400" />;
    if (file.name.endsWith('.ipynb')) return <BookOpen className="h-4 w-4 text-orange-400" />;
    if (file.name.toLowerCase().includes('readme')) return <FileText className="h-4 w-4 text-green-400" />;
    return <FileText className="h-4 w-4 text-finance-lightgray" />;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <SEOHead
        title="Notebook Playground - Exécutez vos modèles Python"
        description="Explorez et exécutez des notebooks Python de finance quantitative. Environnement interactif avec The Pricing Library préchargé."
        keywords="python notebook, jupyter, finance quantitative, playground, code execution, pricing models"
        canonical="https://thepricinglibrary.com/community/playground"
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold terminal-text mb-2">
            <BookOpen className="inline-block mr-2 h-6 w-6 text-finance-accent" />
            Notebook Playground
          </h1>
          <p className="text-finance-lightgray">
            {selectedProject ? 
              `Explorez le projet: ${selectedProject.repoName}` :
              'Explore, run, and modify Python notebooks for quantitative finance'
            }
          </p>
        </div>
        
        <div className="flex gap-3 mt-4 md:mt-0">
          <Button asChild variant="finance">
            <Link to="/community/notebook-workspace">
              <Github className="mr-2 h-4 w-4" />
              GitHub Workspace
            </Link>
          </Button>
        </div>
      </div>

      {/* Enhanced intro section with workspace link */}
      <Card className="finance-card mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3 flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-finance-accent" />
                Community Notebooks
              </h3>
              <p className="text-sm text-finance-lightgray mb-4">
                Explorez des notebooks de finance quantitative partagés par la communauté.
              </p>
              <Button variant="outline" size="sm">
                Parcourir les notebooks
              </Button>
            </div>
            
            <div>
              <h3 className="font-medium mb-3 flex items-center">
                <Github className="h-5 w-5 mr-2 text-finance-accent" />
                Your GitHub Projects
              </h3>
              <p className="text-sm text-finance-lightgray mb-4">
                Connectez GitHub et exécutez vos propres projets Python dans un environnement complet.
              </p>
              <Button asChild variant="finance" size="sm">
                <Link to="/community/notebook-workspace">
                  Accéder au Workspace
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          {selectedProject ? (
            <Card className="finance-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Github className="h-5 w-5 mr-2 text-finance-accent" />
                  {selectedProject.repoName}
                </CardTitle>
                <div className="text-sm text-finance-lightgray">
                  par {selectedProject.author}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-finance-lightgray">
                  {selectedProject.description}
                </p>
                
                <div className="flex flex-wrap gap-1">
                  {selectedProject.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div>
                  <h4 className="font-medium mb-2">Fichiers du projet</h4>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {selectedProject.files.map((file, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className={`w-full justify-start text-left ${
                          selectedFile?.path === file.path ? 'bg-finance-accent/20' : ''
                        }`}
                        onClick={() => handleSelectFile(file)}
                      >
                        {getFileIcon(file)}
                        <span className="ml-2 truncate">{file.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedProject(null);
                    setSelectedFile(null);
                  }}
                >
                  Retour aux notebooks
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
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
            </>
          )}
        </div>
        
        <div className="lg:col-span-2">
          <div className="finance-card p-4">
            <Tabs defaultValue="view" className="w-full">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="view" className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    {selectedProject ? 'Fichier' : 'View'}
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
                {selectedProject && selectedFile ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      {getFileIcon(selectedFile)}
                      <h3 className="font-medium">{selectedFile.name}</h3>
                    </div>
                    
                    {selectedFile.name.endsWith('.py') ? (
                      <div className="bg-finance-charcoal p-4 rounded-lg">
                        <pre className="text-sm text-finance-offwhite overflow-x-auto">
                          <code>
                            {`# Fichier Python: ${selectedFile.name}
# Cliquez sur l'onglet "Run" pour exécuter ce fichier dans l'environnement Python

# Contenu du fichier sera chargé ici...
print("Fichier ${selectedFile.name} prêt à être exécuté")`}
                          </code>
                        </pre>
                      </div>
                    ) : selectedFile.name.endsWith('.ipynb') ? (
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-finance-accent mx-auto mb-3" />
                        <p className="text-finance-lightgray">
                          Notebook Jupyter détecté. Utilisez l'onglet "Run" pour l'exécuter.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-finance-lightgray mx-auto mb-3 opacity-50" />
                        <p className="text-finance-lightgray">
                          Prévisualisation du fichier non disponible.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <NotebookViewer 
                    notebook={notebook} 
                    isLoading={isNotebookLoading}
                    error={notebookError}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="run">
                <div className="space-y-4">
                  {selectedProject ? (
                    <div className="bg-finance-charcoal p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Environnement Python - {selectedProject.repoName}</h4>
                        <Badge variant="secondary">TPL Ready</Badge>
                      </div>
                      <div className="text-sm text-finance-lightgray mb-3">
                        Environnement Python interactif avec The Pricing Library (TPL) préchargé.
                      </div>
                      <div className="bg-finance-dark p-3 rounded font-mono text-sm">
                        <div className="text-green-400">{`>>> import tpl as QuantLib`}</div>
                        <div className="text-green-400">{`>>> print("TPL Environment Ready")`}</div>
                        <div className="text-finance-offwhite">TPL Environment Ready</div>
                        <div className="text-green-400">{`>>> # Votre code ici...`}</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <NotebookRunner notebook={tplNotebook} />
                      <NotebookViewer 
                        notebook={tplNotebook} 
                        isLoading={isNotebookLoading}
                        error={notebookError}
                      />
                    </>
                  )}
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
