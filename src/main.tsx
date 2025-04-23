
import React, { Suspense } from 'react' 
import { createRoot } from 'react-dom/client'
// Import i18n configuration first to ensure it's loaded before components
import './i18n'
import App from './App.tsx'
import './index.css'
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "sonner"

// Wrap with Suspense to handle i18n loading
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center text-white">Loading...</div>}>
      <TooltipProvider>
        <Toaster position="top-right" />
        <App />
      </TooltipProvider>
    </Suspense>
  </React.StrictMode>
);
