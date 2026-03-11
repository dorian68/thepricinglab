
import React from 'react';
import { createRoot } from 'react-dom/client';
import PythonCodeBlock from '@/components/python/PythonCodeBlock';
import PythonActivator from '@/utils/pythonActivator';
import { isPyodideLoaded } from '@/services/pyodideService';
import { safeTranslate, cleanCaptions } from '@/utils/translationUtils';

const detectLanguage = (className: string | null): string | null => {
  if (!className) return null;
  
  const match = className.match(/language-(\w+)/);
  return match ? match[1] : null;
};

export const transformCodeBlocks = (containerElement: HTMLElement) => {
  if (!containerElement) return;
  
  const preElements = containerElement.querySelectorAll('pre');
  
  let pythonBlocksFound = false;
  
  preElements.forEach((preElement, index) => {
    if (preElement.getAttribute('data-transformed') === 'true') {
      return;
    }
    
    const codeElement = preElement.querySelector('code');
    if (!codeElement) return;
    
    const language = detectLanguage(codeElement.className);
    
    if (language === 'python' || language === 'py') {
      pythonBlocksFound = true;
      const code = codeElement.textContent || '';
      
      preElement.setAttribute('data-transformed', 'true');
      
      let title = "Python";
      const prevElement = preElement.previousElementSibling;
      if (prevElement && ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(prevElement.tagName)) {
        title = cleanCaptions(prevElement.textContent || 'Python');
      }
      
      const wrapper = document.createElement('div');
      wrapper.className = 'python-block-wrapper relative';
      
      const container = document.createElement('div');
      container.className = 'python-code-container';
      
      wrapper.appendChild(container);
      
      preElement.parentNode?.replaceChild(wrapper, preElement);
      
      const codeRoot = createRoot(container);
      codeRoot.render(<PythonCodeBlock code={code} title={title} />);
    }
  });
  
  return pythonBlocksFound;
};

export const autoScanAndTransform = () => {
  const potentialContainers = [
    document.querySelector('.prose'),
    document.querySelector('.content'),
    document.querySelector('article'),
    document.querySelector('[data-content="exercise"]'),
    document.querySelector('.exercise-content'),
    document.querySelector('.blog-content'),
    document.querySelector('[data-type="python-content"]'),
    document.querySelector('main'),
  ].filter(Boolean) as HTMLElement[];
  
  let anyPythonBlocksFound = false;
  
  potentialContainers.forEach((container) => {
    const pythonBlocksFound = transformCodeBlocks(container);
    if (pythonBlocksFound) {
      anyPythonBlocksFound = true;
    }
  });
  
  return anyPythonBlocksFound;
};
