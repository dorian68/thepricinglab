
import React, { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import { loadPyodide } from '@/services/pyodideService';

interface PyodideLoaderProps {
  onLoad?: () => void;
}

const PyodideLoader: React.FC<PyodideLoaderProps> = ({ onLoad }) => {
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

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {!isLoaded && !isLoading && (
        <button
          onClick={handleLoad}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Charger l'environnement Python
        </button>
      )}
      
      {isLoading && (
        <div className="flex flex-col items-center">
          <Loader className="h-8 w-8 animate-spin text-blue-600 mb-2" />
          <p className="text-sm text-gray-600">Chargement de l'environnement Python...</p>
          <p className="text-xs text-gray-500 mt-1">(~10-15MB, cela peut prendre quelques instants)</p>
        </div>
      )}
      
      {error && (
        <div className="text-red-500 text-sm text-center max-w-xs">
          <p>Erreur lors du chargement de Pyodide:</p>
          <p className="font-mono text-xs mt-1 bg-red-50 p-2 rounded">{error}</p>
          <button
            onClick={handleLoad}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      )}
    </div>
  );
};

export default PyodideLoader;
