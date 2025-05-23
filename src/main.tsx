
import React, { Suspense } from 'react' 
import { createRoot } from 'react-dom/client'
// Import i18n configuration first to ensure it's loaded before components
import './i18n'
import App from './App.tsx'
import './index.css'
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "sonner"

// Define proper interface for ErrorBoundary state
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Define proper interface for ErrorBoundary props
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

// Error Boundary with proper TypeScript types
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Application Error:", error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center text-white p-4">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Une erreur est survenue</h1>
          <p className="mb-4">Nous sommes désolés pour ce problème. Notre équipe a été notifiée.</p>
          <pre className="bg-gray-800 p-4 rounded overflow-auto max-w-full max-h-[300px]">
            {this.state.error && this.state.error.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Recharger la page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Wrap with Suspense and ErrorBoundary
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<div className="h-screen w-full flex items-center justify-center text-white">Loading...</div>}>
        <TooltipProvider>
          <Toaster position="top-right" />
          <App />
        </TooltipProvider>
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>
);
