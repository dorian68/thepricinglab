
import React from 'react';
import { createRoot } from 'react-dom/client';
import PythonCodeBlock from '@/components/python/PythonCodeBlock';
import PythonActivator from '@/utils/pythonActivator';
import { isPyodideLoaded } from '@/services/pyodideService';

const detectLanguage = (className: string | null): string | null => {
  if (!className) return null;
  
  const match = className.match(/language-(\w+)/);
  return match ? match[1] : null;
};

// Nettoyer les balises [caption] des titres
const cleanCaption = (text: string): string => {
  return text.replace(/\[caption\]\s*/g, '');
};

export const transformCodeBlocks = (containerElement: HTMLElement) => {
  if (!containerElement) return;
  
  // Log pour débogage
  console.log('Transformer activé sur:', containerElement);
  
  // Chercher tous les blocs de code
  const preElements = containerElement.querySelectorAll('pre');
  console.log(`Nombre de blocs pre trouvés: ${preElements.length}`);
  
  let pythonBlocksFound = false;
  
  preElements.forEach((preElement, index) => {
    const codeElement = preElement.querySelector('code');
    if (!codeElement) return;
    
    const language = detectLanguage(codeElement.className);
    console.log(`Bloc #${index} - Langage détecté: ${language}`);
    
    // Ne transformer que les blocs de code Python
    if (language === 'python' || language === 'py') {
      pythonBlocksFound = true;
      const code = codeElement.textContent || '';
      
      // Trouver un titre potentiel dans un élément précédent (h3, h4, etc.)
      let title = "Python";
      const prevElement = preElement.previousElementSibling;
      if (prevElement && ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(prevElement.tagName)) {
        title = cleanCaption(prevElement.textContent || 'Python');
      }
      
      // Créer un wrapper pour contenir le bloc de code et les contrôles
      const wrapper = document.createElement('div');
      wrapper.className = 'python-block-wrapper relative';
      
      // Créer un conteneur pour le composant React principal
      const container = document.createElement('div');
      container.className = 'python-code-container';
      
      // Ajouter les conteneurs au wrapper
      wrapper.appendChild(container);
      
      // Remplacer le bloc pre par notre wrapper
      preElement.parentNode?.replaceChild(wrapper, preElement);
      
      // Rendre le composant PythonCodeBlock avec activation Python intégrée
      const codeRoot = createRoot(container);
      codeRoot.render(<PythonCodeBlock code={code} title={title} />);
      
      console.log(`Bloc Python #${index} transformé avec succès`);
    }
  });
  
  return pythonBlocksFound;
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
    
    let anyPythonBlocksFound = false;
    
    potentialContainers.forEach((container, idx) => {
      console.log(`Transformation du conteneur #${idx}`);
      const pythonBlocksFound = transformCodeBlocks(container);
      if (pythonBlocksFound) {
        anyPythonBlocksFound = true;
      }
    });
    
    console.log(`Python blocks found: ${anyPythonBlocksFound}`);
  }, 1000); // Délai pour s'assurer que le DOM est chargé
};
