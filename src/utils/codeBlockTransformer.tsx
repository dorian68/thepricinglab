
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
  
  // Log pour débogage
  console.log('Transformer activé sur:', containerElement);
  
  // Chercher tous les blocs de code
  const preElements = containerElement.querySelectorAll('pre');
  console.log(`Nombre de blocs pre trouvés: ${preElements.length}`);
  
  preElements.forEach((preElement, index) => {
    const codeElement = preElement.querySelector('code');
    if (!codeElement) return;
    
    const language = detectLanguage(codeElement.className);
    console.log(`Bloc #${index} - Langage détecté: ${language}`);
    
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
      
      console.log(`Bloc Python #${index} transformé avec succès`);
    }
  });
};

// Fonction d'auto-scan pour les pages où la référence directe au conteneur n'est pas disponible
export const autoScanAndTransform = () => {
  console.log('Auto-scan activé pour transformation Python');
  
  // Attendre que le DOM soit complètement chargé
  setTimeout(() => {
    // Chercher les conteneurs potentiels (articles, sections de contenu, etc.)
    const potentialContainers = [
      document.querySelector('.prose'),
      document.querySelector('.content'),
      document.querySelector('article'),
      document.querySelector('[data-content="exercise"]'),
      document.querySelector('.exercise-content'),
      document.querySelector('.blog-content'),
      document.querySelector('[data-type="python-content"]'),
      document.querySelector('main'),
      // Ajoutez d'autres sélecteurs si nécessaire
    ].filter(Boolean) as HTMLElement[];
    
    console.log(`Conteneurs potentiels trouvés: ${potentialContainers.length}`);
    
    potentialContainers.forEach((container, idx) => {
      console.log(`Transformation du conteneur #${idx}`);
      transformCodeBlocks(container);
    });
  }, 1000); // Délai pour s'assurer que le DOM est chargé
};
