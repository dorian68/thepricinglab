
import React, { useState, useEffect } from 'react';
import { NotebookContent } from '@/types/notebook';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Zap } from 'lucide-react';
import { executePythonCode, isPyodideLoaded } from '@/services/pyodideService';
import PythonActivator from '@/utils/pythonActivator';
import { useToast } from '@/hooks/use-toast';

interface NotebookRunnerProps {
  notebook: NotebookContent | null;
}

const NotebookRunner: React.FC<NotebookRunnerProps> = ({ notebook }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPyodideReady, setIsPyodideReady] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [currentCell, setCurrentCell] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkPyodide = () => {
      setIsPyodideReady(isPyodideLoaded());
    };
    
    checkPyodide();
    const interval = setInterval(checkPyodide, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const runNotebook = async () => {
    if (!notebook || !isPyodideReady) {
      toast({
        title: "Python environment not ready",
        description: "Please wait for the Python environment to initialize",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    let cellIndex = 0;
    
    try {
      for (const cell of notebook.cells) {
        if (cell.cell_type === 'code') {
          setCurrentCell(cellIndex);
          const code = cell.source.join('');
          
          // Measure execution time for the pricing cell (simplified detection)
          const isPricingCell = code.toLowerCase().includes('price') || 
                                code.toLowerCase().includes('option') ||
                                code.toLowerCase().includes('vol');
          
          const startTime = performance.now();
          await executePythonCode(code);
          const endTime = performance.now();
          
          if (isPricingCell) {
            setExecutionTime(endTime - startTime);
          }
        }
        cellIndex++;
      }
      
      toast({
        title: "Notebook executed",
        description: "All cells were successfully run with TPL"
      });
    } catch (error) {
      console.error('Error running notebook:', error);
      toast({
        title: "Execution error",
        description: error instanceof Error ? error.message : "Failed to run notebook",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
      setCurrentCell(null);
    }
  };

  if (!notebook) {
    return null;
  }

  return (
    <Card className="p-4 mt-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Badge variant="outline" className="mb-2 bg-finance-dark">
            <Clock className="h-3 w-3 mr-1" />
            {executionTime ? `${executionTime.toFixed(1)}ms` : 'Not run yet'}
          </Badge>
          {executionTime && (
            <Badge className="ml-2 mb-2 bg-finance-accent/20 text-finance-accent">
              Powered by TPL
            </Badge>
          )}
          {isRunning && currentCell !== null && (
            <p className="text-xs text-finance-lightgray mt-1">
              Running cell {currentCell + 1} of {notebook.cells.filter(c => c.cell_type === 'code').length}...
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          <PythonActivator autoLoad={true} inline={true} className="mr-2" />
          
          <Button 
            variant="finance" 
            onClick={runNotebook} 
            disabled={isRunning || !isPyodideReady}
            className="flex items-center"
          >
            {isRunning ? <Zap className="h-4 w-4 mr-2 animate-pulse" /> : <Play className="h-4 w-4 mr-2" />}
            {isRunning ? "Running..." : "Run with TPL"}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default NotebookRunner;
