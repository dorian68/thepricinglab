
import React, { useState } from 'react';
import { Play, RotateCcw, X, Loader, Check, Code, Copy, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { usePythonExecution } from '@/hooks/usePythonExecution';
import { useToast } from '@/hooks/use-toast';

interface PythonExerciseProps {
  problem: string;
  initialCode: string;
  solution?: string;
  hints?: string[];
  className?: string;
  title?: string;
}

const PythonExercise: React.FC<PythonExerciseProps> = ({ 
  problem, 
  initialCode, 
  solution, 
  hints = [], 
  className = '', 
  title 
}) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isOutputCollapsed, setIsOutputCollapsed] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(-1);
  const { code, setCode, result, execute, reset } = usePythonExecution(initialCode);
  const { toast } = useToast();
  
  const handleRunClick = () => {
    if (!isEditorOpen) {
      setIsEditorOpen(true);
    } else {
      execute();
    }
  };
  
  const handleCopyClick = () => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copié !",
      description: "Le code a été copié dans le presse-papiers",
    });
  };
  
  const showNextHint = () => {
    if (currentHintIndex < hints.length - 1) {
      setCurrentHintIndex(currentHintIndex + 1);
      toast({
        title: "Indice débloqué",
        description: `Indice ${currentHintIndex + 2}/${hints.length} révélé`,
      });
    }
  };
  
  const toggleSolution = () => {
    if (!showSolution) {
      toast({
        title: "Solution révélée",
        description: "N'oubliez pas d'essayer de résoudre l'exercice par vous-même d'abord !",
      });
    }
    setShowSolution(!showSolution);
    if (!showSolution && solution) {
      setCode(solution);
    }
  };
  
  return (
    <div className={`my-6 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 ${className}`}>
      {/* En-tête de l'exercice */}
      <div className="bg-slate-100 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold mb-2">{title || "Exercice Python"}</h3>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: problem }} />
        </div>
      </div>
      
      {/* Bloc de code initial */}
      {!isEditorOpen && (
        <div className="relative group">
          <div className="absolute top-2 right-2 flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 opacity-70 hover:opacity-100"
              onClick={handleCopyClick}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          <pre className="bg-slate-900 text-slate-50 p-4 overflow-x-auto text-sm font-mono">
            <code>{initialCode}</code>
          </pre>
          
          <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-900">
            <div className="flex space-x-2">
              {hints.length > 0 && (
                <Button
                  size="sm" 
                  variant="outline" 
                  onClick={showNextHint}
                  disabled={currentHintIndex >= hints.length - 1}
                >
                  Indice {currentHintIndex >= 0 ? `${currentHintIndex + 1}/${hints.length}` : ''}
                </Button>
              )}
              
              {solution && (
                <Button
                  size="sm" 
                  variant="outline" 
                  onClick={toggleSolution}
                  className="flex items-center space-x-1"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Solution</span>
                </Button>
              )}
            </div>
            
            <Button
              size="sm" 
              variant="default" 
              className="flex items-center space-x-1"
              onClick={handleRunClick}
            >
              <Play className="h-3.5 w-3.5" />
              <span>Exécuter</span>
            </Button>
          </div>
          
          {/* Affichage des indices */}
          {currentHintIndex >= 0 && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800">
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                Indice {currentHintIndex + 1}:
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-200">
                {hints[currentHintIndex]}
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Éditeur interactif */}
      {isEditorOpen && (
        <div className="bg-slate-50 dark:bg-slate-900 transition-all duration-300 transform">
          <div className="p-3">
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="font-mono text-sm min-h-[200px] resize-y bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600"
              placeholder="Entrez votre code Python ici..."
            />
          </div>
          
          <div className="flex items-center justify-between p-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => reset()}
                className="flex items-center space-x-1"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Réinitialiser</span>
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditorOpen(false)}
                className="flex items-center space-x-1"
              >
                <X className="h-3.5 w-3.5" />
                <span>Fermer</span>
              </Button>
              
              {solution && (
                <Button
                  size="sm" 
                  variant="outline" 
                  onClick={toggleSolution}
                  className="flex items-center space-x-1"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Solution</span>
                </Button>
              )}
            </div>
            
            <Button
              size="sm"
              className="flex items-center space-x-1"
              onClick={execute}
              disabled={result.isLoading}
            >
              {result.isLoading ? (
                <>
                  <Loader className="h-3.5 w-3.5 animate-spin" />
                  <span>Exécution...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  <span>Exécuter</span>
                </>
              )}
            </Button>
          </div>
          
          {/* Affichage des résultats */}
          {(result.result || result.error || result.plots.length > 0) && (
            <div className="border-t border-slate-200 dark:border-slate-700">
              <div 
                className="flex items-center justify-between p-2 cursor-pointer bg-slate-100 dark:bg-slate-800"
                onClick={() => setIsOutputCollapsed(!isOutputCollapsed)}
              >
                <span className="text-sm font-medium flex items-center">
                  {result.error ? (
                    <span className="text-red-500 flex items-center">
                      <X className="h-4 w-4 mr-1" />
                      Erreur
                    </span>
                  ) : (
                    <span className="text-green-500 flex items-center">
                      <Check className="h-4 w-4 mr-1" />
                      Résultat
                    </span>
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  {isOutputCollapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {!isOutputCollapsed && (
                <div className="p-3">
                  {result.error ? (
                    <pre className="text-xs text-red-500 font-mono p-2 bg-red-50 dark:bg-red-900/20 rounded overflow-x-auto">
                      {result.error}
                    </pre>
                  ) : result.result ? (
                    <pre className="text-xs font-mono p-2 bg-slate-100 dark:bg-slate-800 rounded overflow-x-auto">
                      {result.result}
                    </pre>
                  ) : null}
                  
                  {result.plots.length > 0 && (
                    <div className="mt-3 space-y-3">
                      <h4 className="text-sm font-medium">Visualisations:</h4>
                      {result.plots.map((plot, index) => (
                        <div key={index} className="flex justify-center">
                          <img 
                            src={plot} 
                            alt={`Plot ${index + 1}`} 
                            className="max-w-full rounded border border-slate-300 dark:border-slate-600"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PythonExercise;
