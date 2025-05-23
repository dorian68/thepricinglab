
import React, { useEffect, useRef } from 'react';
import { NotebookContent } from '@/types/notebook';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

interface NotebookViewerProps {
  notebook: NotebookContent | null;
  isLoading: boolean;
  error: string | null;
}

const NotebookViewer: React.FC<NotebookViewerProps> = ({ notebook, isLoading, error }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!notebook || !containerRef.current) return;
    
    // Dynamic import of nbpreview (or similar library) would happen here
    // This is a simplified version that renders markdown and code cells
    
    const renderNotebook = async () => {
      const container = containerRef.current;
      if (!container || !notebook) return;
      
      container.innerHTML = '';
      
      // Add styles for notebook rendering
      const style = document.createElement('style');
      style.innerHTML = `
        .notebook-cell { padding: 10px; margin-bottom: 10px; }
        .code-cell { background-color: #1e1e2e; border-radius: 4px; font-family: monospace; }
        .code-cell pre { padding: 10px; margin: 0; overflow-x: auto; }
        .markdown-cell { color: #e2e8f0; }
        .cell-output { border-top: 1px solid #2d3748; margin-top: 10px; padding-top: 10px; }
      `;
      container.appendChild(style);
      
      // Render each cell
      notebook.cells.forEach((cell, index) => {
        const cellDiv = document.createElement('div');
        cellDiv.className = `notebook-cell ${cell.cell_type}-cell`;
        
        if (cell.cell_type === 'code') {
          const pre = document.createElement('pre');
          pre.textContent = cell.source.join('');
          cellDiv.appendChild(pre);
          
          // Add cell outputs if any
          if (cell.outputs && cell.outputs.length > 0) {
            const outputDiv = document.createElement('div');
            outputDiv.className = 'cell-output';
            
            cell.outputs.forEach(output => {
              if (output.text) {
                const outputPre = document.createElement('pre');
                outputPre.textContent = Array.isArray(output.text) ? output.text.join('') : output.text;
                outputDiv.appendChild(outputPre);
              } else if (output.data && output.data['text/plain']) {
                const outputPre = document.createElement('pre');
                outputPre.textContent = Array.isArray(output.data['text/plain']) 
                  ? output.data['text/plain'].join('') 
                  : output.data['text/plain'];
                outputDiv.appendChild(outputPre);
              }
              // Images would be handled here
            });
            
            cellDiv.appendChild(outputDiv);
          }
        } else if (cell.cell_type === 'markdown') {
          // In a real implementation, we would use a markdown renderer here
          const textDiv = document.createElement('div');
          textDiv.textContent = cell.source.join('');
          cellDiv.appendChild(textDiv);
        }
        
        container.appendChild(cellDiv);
      });
    };
    
    renderNotebook();
  }, [notebook]);
  
  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-32" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-24" />
        <Skeleton className="h-8 w-2/3" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-red-500 font-medium text-lg">{error}</p>
        <p className="text-gray-400 mt-2">Failed to load notebook content</p>
      </Card>
    );
  }
  
  if (!notebook) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-400">Select a notebook to view its contents</p>
      </Card>
    );
  }
  
  return (
    <div className="overflow-auto h-full">
      <div ref={containerRef} className="p-4 finance-card"></div>
    </div>
  );
};

export default NotebookViewer;
