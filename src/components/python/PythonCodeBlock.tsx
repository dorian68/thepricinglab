
import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, X, Loader, Check, Code, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { usePythonExecution } from '@/hooks/usePythonExecution';
import { useToast } from '@/hooks/use-toast';

interface PythonCodeBlockProps {
  code: string;
  className?: string;
  title?: string;
}

const PythonCodeBlock: React.FC<PythonCodeBlockProps> = ({ code: initialCode, className = '', title }) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isOutputCollapsed, setIsOutputCollapsed] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
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
  
  useEffect(() => {
    if (isEditorOpen && editorRef.current) {
      const scrollToEditor = () => {
        editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
      // Small delay to ensure DOM is updated
      const timeoutId = setTimeout(scrollToEditor, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isEditorOpen]);
  
  return (
    <div 
      ref={editorRef}
      className={`my-4 rounded-lg overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Bloc de code en lecture seule */}
      {!isEditorOpen && (
        <div className="relative group">
          <div className="absolute top-0 right-0 p-2 flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 opacity-70 hover:opacity-100"
              onClick={handleCopyClick}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          {title && (
            <div className="bg-slate-800 text-slate-200 text-xs py-1 px-4">
              {title}
            </div>
          )}
          
          <pre className="bg-slate-900 text-slate-50 p-4 overflow-x-auto text-sm font-mono">
            <code>{initialCode}</code>
          </pre>
          
          <div className="flex justify-end mt-1 pr-1">
            <Button
              size="sm" 
              variant="outline" 
              className="flex items-center space-x-1 text-xs py-1 h-8 bg-slate-100 dark:bg-slate-800"
              onClick={handleRunClick}
            >
              <Play className="h-3.5 w-3.5" />
              <span>Exécuter</span>
            </Button>
          </div>
        </div>
      )}
      
      {/* Éditeur interactif */}
      {isEditorOpen && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg shadow-md bg-slate-50 dark:bg-slate-900 transition-all duration-300 transform">
          <div className="flex items-center justify-between p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
            <div className="flex items-center space-x-2">
              <Code className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium">{title || "Code Python"}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-500"
                onClick={() => reset()}
                title="Réinitialiser"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-500"
                onClick={() => setIsEditorOpen(false)}
                title="Fermer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Éditeur de code */}
          <div className="p-2">
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="font-mono text-sm min-h-[150px] resize-y bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600"
              placeholder="Entrez votre code Python ici..."
            />
          </div>
          
          <div className="flex justify-end p-2 border-t border-slate-200 dark:border-slate-700">
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

export default PythonCodeBlock;
