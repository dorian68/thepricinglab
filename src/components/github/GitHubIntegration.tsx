
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Github, 
  LogIn, 
  LogOut, 
  User, 
  Settings,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { githubOAuthService } from '@/services/githubOAuthService';
import GitHubRepositoryExplorer from './GitHubRepositoryExplorer';
import PythonCodeEditor from '../python/PythonCodeEditor';
import { GitHubFile, GitHubRepo } from '@/types/github';
import { GitHubService } from '@/services/githubService';

interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string;
  email: string;
}

const GitHubIntegration: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [selectedFile, setSelectedFile] = useState<{
    file: GitHubFile;
    repo: GitHubRepo;
    content: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored access token
    const storedToken = localStorage.getItem('github_access_token');
    const storedUser = localStorage.getItem('github_user');
    
    if (storedToken && storedUser) {
      setAccessToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }

    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
      handleOAuthCallback(code, state);
    }
  }, []);

  const handleOAuthCallback = async (code: string, state: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!githubOAuthService.validateState(state)) {
        throw new Error('Invalid OAuth state');
      }

      const token = await githubOAuthService.exchangeCodeForToken(code);
      const userInfo = await githubOAuthService.getUserInfo(token);
      
      setAccessToken(token);
      setUser(userInfo);
      setIsAuthenticated(true);
      
      // Store in localStorage
      localStorage.setItem('github_access_token', token);
      localStorage.setItem('github_user', JSON.stringify(userInfo));
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error('OAuth callback error:', error);
      setError('Failed to authenticate with GitHub. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    setError(null);
    githubOAuthService.initiateAuth();
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAccessToken(null);
    setUser(null);
    setSelectedFile(null);
    
    localStorage.removeItem('github_access_token');
    localStorage.removeItem('github_user');
  };

  const handleFileSelect = async (file: GitHubFile, repo: GitHubRepo) => {
    if (!accessToken) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const githubService = new GitHubService(accessToken);
      const content = await githubService.getFileContent(
        repo.owner.login, 
        repo.name, 
        file.path
      );
      
      setSelectedFile({
        file,
        repo,
        content
      });
    } catch (error) {
      console.error('Error loading file:', error);
      setError('Failed to load file content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSave = async (code: string) => {
    if (!selectedFile || !accessToken) return;
    
    // In a real implementation, you might want to save back to GitHub
    // or allow users to fork the repository
    console.log('Saving code:', code);
    
    // For now, just update local state
    setSelectedFile(prev => prev ? {
      ...prev,
      content: code
    } : null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finance-accent"></div>
          <span className="ml-3">Loading...</span>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Github className="h-6 w-6 mr-2" />
            Connect to GitHub
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-finance-lightgray">
            Connect your GitHub account to access your repositories and execute Python code directly in the platform.
          </p>
          
          {error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="bg-finance-charcoal/30 p-4 rounded-lg">
            <h4 className="font-medium mb-2">What you can do:</h4>
            <ul className="text-sm text-finance-lightgray space-y-1">
              <li>• Browse your repositories</li>
              <li>• Open Python files and Jupyter notebooks</li>
              <li>• Execute code with interactive output</li>
              <li>• Save and download your modifications</li>
            </ul>
          </div>
          
          <Button onClick={handleLogin} className="w-full">
            <LogIn className="h-4 w-4 mr-2" />
            Connect with GitHub
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src={user?.avatar_url} 
                alt={user?.name || user?.login} 
                className="w-10 h-10 rounded-full"
              />
              <div>
                <h3 className="font-medium">{user?.name || user?.login}</h3>
                <p className="text-sm text-finance-lightgray">Connected to GitHub</p>
              </div>
              <Badge variant="default" className="bg-green-900/20 text-green-400">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            </div>
            
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Repository Explorer or Code Editor */}
      {selectedFile ? (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-finance-lightgray">
                    {selectedFile.repo.name} / {selectedFile.file.path}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedFile(null)}
                >
                  Back to Explorer
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <PythonCodeEditor
            initialCode={selectedFile.content}
            fileName={selectedFile.file.name}
            language={selectedFile.file.name.endsWith('.ipynb') ? 'jupyter' : 'python'}
            onCodeChange={() => {}}
            onSave={handleCodeSave}
          />
        </div>
      ) : (
        <GitHubRepositoryExplorer
          accessToken={accessToken!}
          onFileSelect={handleFileSelect}
        />
      )}
    </div>
  );
};

export default GitHubIntegration;
