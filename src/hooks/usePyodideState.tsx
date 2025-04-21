
import { useState, useEffect } from 'react';
import { isPyodideLoaded } from '@/services/pyodideService';

/**
 * Hook pour gérer l'état de chargement de Pyodide
 * @returns Un objet contenant l'état de chargement de Pyodide et une fonction pour vérifier si Pyodide est chargé
 */
export const usePyodideState = () => {
  const [isPyodideAvailable, setIsPyodideAvailable] = useState(false);
  const [isCheckingState, setIsCheckingState] = useState(true);

  useEffect(() => {
    // Vérifier si Pyodide est déjà chargé
    const isLoaded = isPyodideLoaded();
    setIsPyodideAvailable(isLoaded);
    setIsCheckingState(false);
    
    // Observer pour détecter si Pyodide est chargé après le montage
    if (!isLoaded) {
      const intervalId = setInterval(() => {
        if (isPyodideLoaded()) {
          setIsPyodideAvailable(true);
          clearInterval(intervalId);
        }
      }, 1000);
      
      return () => clearInterval(intervalId);
    }
  }, []);

  // Fonction pour vérifier manuellement l'état
  const checkPyodideState = () => {
    setIsPyodideAvailable(isPyodideLoaded());
  };

  return {
    isPyodideAvailable,
    isCheckingState,
    checkPyodideState
  };
};

export default usePyodideState;
