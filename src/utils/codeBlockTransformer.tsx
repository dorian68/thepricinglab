
import React from 'react';
import { createRoot } from 'react-dom/client';
import PythonCodeBlock from '@/components/python/PythonCodeBlock';

const detectLanguage = (className: string | null): string | null => {
  if (!className) return null;
  
  const match = className.match(/language-(\w+)/);
  return match ? match[1] : null;
};

export const transformCodeBlocks = (containerElement: HTMLElement) => {
  if (!containerElement) return;
  
  // Chercher tous les blocs de code
  const preElements = containerElement.querySelectorAll('pre');
  
  preElements.forEach(preElement => {
    const codeElement = preElement.querySelector('code');
    if (!codeElement) return;
    
    const language = detectLanguage(codeElement.className);
    
    // Ne transformer que les blocs de code Python
    if (language === 'python' || language === 'py') {
      const code = codeElement.textContent || '';
      
      // Créer un conteneur pour le composant React
      const container = document.createElement('div');
      container.className = 'python-code-container';
      
      // Remplacer le bloc pre par notre conteneur
      preElement.parentNode?.replaceChild(container, preElement);
      
      // Rendre notre composant React dans le conteneur
      const root = createRoot(container);
      root.render(<PythonCodeBlock code={code} title="Python" />);
    }
  });
};
