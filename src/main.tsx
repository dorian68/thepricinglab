
import React from 'react' 
import { createRoot } from 'react-dom/client'
// Import i18n configuration first to ensure it's loaded before components
import './i18n'
import App from './App.tsx'
import './index.css'
import { TooltipProvider } from "@/components/ui/tooltip"

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </React.StrictMode>
);
