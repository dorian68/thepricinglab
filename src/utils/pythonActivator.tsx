
import React, { useEffect } from 'react';
import { autoScanAndTransform } from './codeBlockTransformer';
import PyodideLoader from '@/components/python/PyodideLoader';
import { useIsMobile } from '@/hooks/use-mobile';
import { isPyodideLoaded } from '@/services/pyodideService';

interface PythonActivatorProps {
  discreet?: boolean;
  scanOnLoad?: boolean;
  inline?: boolean;
  className?: string;
  autoLoad?: boolean;
}

// Ce composant peut être inclus dans n'importe quelle page pour activer l'exécution Python
const PythonActivator: React.FC<PythonActivatorProps> = ({ 
  discreet = true, 
  scanOnLoad = true,
  inline = false,
  className = "",
  autoLoad = false
}) => {
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (scanOnLoad) {
      // Si Pyodide est déjà chargé, transformer immédiatement
      if (isPyodideLoaded()) {
        setTimeout(autoScanAndTransform, 100);
      }
      
      // Réactiver après changement de route
      const handleRouteChange = () => {
        setTimeout(autoScanAndTransform, 500);
      };
      
      // Écouter les changements d'URL
      window.addEventListener('popstate', handleRouteChange);
      
      return () => {
        window.removeEventListener('popstate', handleRouteChange);
      };
    }
  }, [scanOnLoad]);
  
  return (
    <div className={`python-executor-container ${inline ? 'inline-block' : ''} ${className}`}>
      <PyodideLoader 
        discreet={discreet}
        autoLoad={autoLoad}
        onLoad={() => {
          console.log('Pyodide chargé avec succès');
          autoScanAndTransform(); // Re-transformer après chargement
        }} 
      />
    </div>
  );
};

export default PythonActivator;
