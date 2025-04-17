
import { useState, useCallback } from 'react';
import { executePythonCode } from '@/services/pyodideService';
import { CodeExecutionResult } from '@/types/pyodide';
import { useToast } from '@/hooks/use-toast';

export const usePythonExecution = (initialCode: string = '') => {
  const [code, setCode] = useState(initialCode);
  const [result, setResult] = useState<CodeExecutionResult>({
    result: '',
    error: null,
    plots: [],
    isLoading: false
  });
  const { toast } = useToast();

  const execute = useCallback(async () => {
    if (!code.trim()) {
      toast({
        title: "Code vide",
        description: "Veuillez entrer du code Python à exécuter",
        variant: "destructive"
      });
      return;
    }

    setResult(prev => ({ ...prev, isLoading: true }));
    
    try {
      toast({
        title: "Exécution en cours",
        description: "Veuillez patienter pendant l'exécution de votre code Python"
      });
      
      const execResult = await executePythonCode(code);
      
      setResult({
        ...execResult,
        isLoading: false
      });
      
      toast({
        title: execResult.error ? "Erreur d'exécution" : "Exécution réussie",
        description: execResult.error || "Votre code a été exécuté avec succès",
        variant: execResult.error ? "destructive" : "default"
      });
    } catch (error) {
      setResult({
        result: '',
        error: error instanceof Error ? error.message : String(error),
        plots: [],
        isLoading: false
      });
      
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'exécution",
        variant: "destructive"
      });
    }
  }, [code, toast]);

  const reset = useCallback(() => {
    setCode(initialCode);
    setResult({
      result: '',
      error: null,
      plots: [],
      isLoading: false
    });
  }, [initialCode]);

  return {
    code,
    setCode,
    result,
    execute,
    reset
  };
};
