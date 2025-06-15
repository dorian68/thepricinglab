
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Github, 
  Folder, 
  FileText, 
  Play, 
  Code, 
  Star, 
  GitFork,
  Calendar,
  User
} from 'lucide-react';
import { GitHubService } from '@/services/githubService';
import { GitHubRepo, GitHubFile } from '@/types/github';

interface GitHubRepositoryExplorerProps {
  accessToken: string;
  onFileSelect: (file: GitHubFile, repo: GitHubRepo) => void;
}

const GitHubRepositoryExplorer: React.FC<GitHubRepositoryExplorerProps> = ({
  accessToken,
  onFileSelect
}) => {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [files, setFiles] = useState<GitHubFile[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [githubService] = useState(() => new GitHubService(accessToken));

  useEffect(() => {
    loadRepositories();
  }, [accessToken]);

  const loadRepositories = async () => {
    setIsLoading(true);
    try {
      const userRepos = await githubService.getUserRepos();
      setRepos(userRepos);
    } catch (error) {
      console.error('Error loading repositories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFiles = async (repo: GitHubRepo, path: string = '') => {
    setIsLoading(true);
    try {
      const repoFiles = await githubService.getRepoFiles(
        repo.owner.login, 
        repo.name, 
        path
      );
      setFiles(repoFiles);
      setCurrentPath(path);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepoSelect = (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    loadFiles(repo);
  };

  const handleFileClick = (file: GitHubFile) => {
    if (file.type === 'dir') {
      loadFiles(selectedRepo!, file.path);
    } else if (file.name.endsWith('.py') || file.name.endsWith('.ipynb')) {
      onFileSelect(file, selectedRepo!);
    }
  };

  const navigateBack = () => {
    if (currentPath) {
      const parentPath = currentPath.split('/').slice(0, -1).join('/');
      loadFiles(selectedRepo!, parentPath);
    }
  };

  const getFileIcon = (file: GitHubFile) => {
    if (file.type === 'dir') return <Folder className="h-4 w-4 text-blue-400" />;
    if (file.name.endsWith('.py')) return <Code className="h-4 w-4 text-green-400" />;
    if (file.name.endsWith('.ipynb')) return <FileText className="h-4 w-4 text-orange-400" />;
    return <FileText className="h-4 w-4 text-gray-400" />;
  };

  const isPythonFile = (file: GitHubFile) => 
    file.name.endsWith('.py') || file.name.endsWith('.ipynb');

  return (
    <div className="space-y-4">
      <Tabs defaultValue="repos" className="w-full">
        <TabsList>
          <TabsTrigger value="repos">Repositories</TabsTrigger>
          {selectedRepo && (
            <TabsTrigger value="files">
              {selectedRepo.name} Files
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="repos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Github className="h-5 w-5 mr-2" />
                Your Repositories
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finance-accent"></div>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {repos.map((repo) => (
                      <Card 
                        key={repo.id} 
                        className="cursor-pointer hover:border-finance-accent transition-colors"
                        onClick={() => handleRepoSelect(repo)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-finance-offwhite">
                              {repo.name}
                            </h3>
                            <div className="flex items-center space-x-2 text-xs text-finance-lightgray">
                              <div className="flex items-center">
                                <Star className="h-3 w-3 mr-1" />
                                {repo.stargazers_count}
                              </div>
                              <div className="flex items-center">
                                <GitFork className="h-3 w-3 mr-1" />
                                {repo.forks_count}
                              </div>
                            </div>
                          </div>
                          
                          {repo.description && (
                            <p className="text-sm text-finance-lightgray mb-3">
                              {repo.description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {repo.language && (
                                <Badge variant="secondary" className="text-xs">
                                  {repo.language}
                                </Badge>
                              )}
                              <div className="flex items-center text-xs text-finance-lightgray">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(repo.updated_at).toLocaleDateString()}
                              </div>
                            </div>
                            
                            <Button variant="outline" size="sm">
                              Explore
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {selectedRepo && (
          <TabsContent value="files">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Folder className="h-5 w-5 mr-2" />
                    {selectedRepo.name}
                    {currentPath && ` / ${currentPath}`}
                  </div>
                  {currentPath && (
                    <Button variant="outline" size="sm" onClick={navigateBack}>
                      Back
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finance-accent"></div>
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                            isPythonFile(file) 
                              ? 'hover:border-finance-accent bg-finance-charcoal/20' 
                              : 'hover:border-finance-steel/50'
                          }`}
                          onClick={() => handleFileClick(file)}
                        >
                          <div className="flex items-center space-x-3">
                            {getFileIcon(file)}
                            <span className="text-finance-offwhite">{file.name}</span>
                            {isPythonFile(file) && (
                              <Badge variant="secondary" className="text-xs">
                                Executable
                              </Badge>
                            )}
                          </div>
                          
                          {isPythonFile(file) && (
                            <Button variant="outline" size="sm">
                              <Play className="h-4 w-4 mr-1" />
                              Open
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default GitHubRepositoryExplorer;
