
import React, { useEffect } from 'react';
import { autoScanAndTransform } from './codeBlockTransformer';
import PyodideLoader from '@/components/python/PyodideLoader';

// Ce composant peut être inclus dans n'importe quelle page pour activer l'exécution Python
const PythonActivator: React.FC = () => {
  useEffect(() => {
    // Activer la recherche et transformation automatique
    autoScanAndTransform();
    
    // Réactiver après changement de route
    const handleRouteChange = () => {
      setTimeout(autoScanAndTransform, 500);
    };
    
    // Écouter les changements d'URL
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
  
  return (
    <div className="python-executor-container">
      <PyodideLoader onLoad={() => {
        console.log('Pyodide chargé avec succès');
        autoScanAndTransform(); // Re-transformer après chargement
      }} />
    </div>
  );
};

export default PythonActivator;
