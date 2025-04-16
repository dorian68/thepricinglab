
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n' // Import i18n configuration
import { TooltipProvider } from "@/components/ui/tooltip"
import React from 'react' // Add React import

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </React.StrictMode>
);
