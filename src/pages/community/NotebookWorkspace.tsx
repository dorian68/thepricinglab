
import React from 'react';
import { Helmet } from 'react-helmet-async';
import SEOHead from '@/components/SEOHead';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Code, 
  Github, 
  Play, 
  BookOpen, 
  Zap,
  Users,
  TrendingUp,
  FileText
} from 'lucide-react';
import GitHubIntegration from '@/components/github/GitHubIntegration';
import { PyodideLoader } from '@/components/python/PyodideLoader';

const NotebookWorkspace: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <SEOHead
        title="Notebook Workspace - Code Python interactif avec GitHub"
        description="Connectez votre compte GitHub et exécutez vos notebooks Python directement dans la plateforme. Éditeur Monaco intégré avec environnement Pyodide."
        keywords="python notebook, github integration, code editor, jupyter, finance quantitative, pyodide, monaco editor"
        canonical="https://thepricinglibrary.com/community/notebook-workspace"
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold terminal-text mb-2">
            <Code className="inline-block mr-2 h-6 w-6 text-finance-accent" />
            Notebook Workspace
          </h1>
          <p className="text-finance-lightgray">
            Connectez GitHub et exécutez vos projets Python directement dans la plateforme
          </p>
        </div>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="finance-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-full bg-finance-burgundy/20">
                <Github className="h-5 w-5 text-finance-accent" />
              </div>
              <h3 className="font-medium">GitHub Integration</h3>
            </div>
            <p className="text-sm text-finance-lightgray">
              Connectez votre compte GitHub pour accéder à vos repositories et fichiers Python.
            </p>
          </CardContent>
        </Card>

        <Card className="finance-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-full bg-finance-burgundy/20">
                <Play className="h-5 w-5 text-finance-accent" />
              </div>
              <h3 className="font-medium">Code Execution</h3>
            </div>
            <p className="text-sm text-finance-lightgray">
              Exécutez vos scripts Python avec Pyodide et visualisez les résultats en temps réel.
            </p>
          </CardContent>
        </Card>

        <Card className="finance-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-full bg-finance-burgundy/20">
                <FileText className="h-5 w-5 text-finance-accent" />
              </div>
              <h3 className="font-medium">Monaco Editor</h3>
            </div>
            <p className="text-sm text-finance-lightgray">
              Éditeur de code avancé avec coloration syntaxique et autocomplétion.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Python Environment Status */}
      <Card className="finance-card mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2 text-finance-accent" />
            Python Environment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PyodideLoader />
          <div className="mt-4 p-4 bg-finance-charcoal/30 rounded-lg">
            <h4 className="font-medium mb-2">Available Libraries:</h4>
            <div className="flex flex-wrap gap-2">
              {[
                'NumPy', 'Pandas', 'Matplotlib', 'SciPy', 'SymPy', 
                'Scikit-learn', 'NetworkX', 'Beautiful Soup'
              ].map((lib) => (
                <Badge key={lib} variant="secondary" className="text-xs">
                  {lib}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main GitHub Integration */}
      <GitHubIntegration />

      {/* Usage Tips */}
      <Card className="finance-card mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-finance-accent" />
            Tips & Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Getting Started</h4>
              <ul className="text-sm text-finance-lightgray space-y-2">
                <li>• Connect your GitHub account using OAuth</li>
                <li>• Browse your repositories and select Python files</li>
                <li>• Use the Monaco editor for advanced code editing</li>
                <li>• Execute code and view results instantly</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Best Practices</h4>
              <ul className="text-sm text-finance-lightgray space-y-2">
                <li>• Save your work regularly</li>
                <li>• Use matplotlib for data visualization</li>
                <li>• Leverage NumPy and Pandas for data analysis</li>
                <li>• Check execution history for debugging</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotebookWorkspace;
