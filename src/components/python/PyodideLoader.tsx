
import React, { useState, useEffect } from 'react';
import { Loader, Play } from 'lucide-react';
import { loadPyodide } from '@/services/pyodideService';
import { Button } from '@/components/ui/button';

interface PyodideLoaderProps {
  onLoad?: () => void;
  discreet?: boolean;
}

const PyodideLoader: React.FC<PyodideLoaderProps> = ({ onLoad, discreet = true }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = async () => {
    if (isLoading || isLoaded) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await loadPyodide();
      setIsLoaded(true);
      onLoad?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Pyodide');
    } finally {
      setIsLoading(false);
    }
  };

  // Version discrète - pour placement à côté des blocs de code
  if (discreet) {
    if (isLoaded) return null;
    
    return (
      <div className="inline-flex items-center">
        {!isLoading ? (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs flex items-center gap-1 py-1"
            onClick={handleLoad}
          >
            <Play className="h-3 w-3" />
            <span>Activer Python</span>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs flex items-center gap-1 py-1"
            disabled
          >
            <Loader className="h-3 w-3 animate-spin" />
            <span>Chargement...</span>
          </Button>
        )}
        
        {error && (
          <div className="text-red-500 text-xs ml-2">{error}</div>
        )}
      </div>
    );
  }

  // Version standard (pour la page d'accueil si nécessaire)
  return (
    <div className="flex flex-col items-center justify-center p-4">
      {!isLoaded && !isLoading && (
        <Button
          onClick={handleLoad}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          size="sm"
        >
          <Play className="h-4 w-4 mr-2" />
          Activer l'environnement Python
        </Button>
      )}
      
      {isLoading && (
        <div className="flex flex-col items-center">
          <Loader className="h-6 w-6 animate-spin text-blue-600 mb-2" />
          <p className="text-sm text-gray-600">Chargement de Python...</p>
          <p className="text-xs text-gray-500 mt-1">(~10-15MB, cela peut prendre quelques instants)</p>
        </div>
      )}
      
      {error && (
        <div className="text-red-500 text-sm text-center max-w-xs">
          <p>Erreur lors du chargement de Pyodide:</p>
          <p className="font-mono text-xs mt-1 bg-red-50 p-2 rounded">{error}</p>
          <Button
            onClick={handleLoad}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
            size="sm"
          >
            Réessayer
          </Button>
        </div>
      )}
    </div>
  );
};

export default PyodideLoader;
