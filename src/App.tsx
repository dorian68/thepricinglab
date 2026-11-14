import { lazy, Suspense } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { HelmetProvider } from 'react-helmet-async';
import { LoaderCircle, Sparkles } from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import { AgentProvider, useAgent } from './agent/AgentProvider';
import NavigationSecurityBoundary from './security/NavigationSecurityBoundary';
import i18n from './i18n';
import './agent/agent.css';

const loadAgentDock = () => import('./agent/AgentDock');
const AgentDock = lazy(loadAgentDock);
const ClaudeFrontend = lazy(() => import('./claude/ClaudeFrontend'));

function ApplicationLoadingState() {
  return (
    <main
      data-application-loading="true"
      aria-busy="true"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#090d14',
        color: '#aeb7c5',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 12,
        letterSpacing: '0.08em',
      }}
    >
      THE PRICING LIBRARY · CHARGEMENT
    </main>
  );
}

function DeferredAgentDock() {
  const { open, setOpen } = useAgent();

  if (!open) {
    return (
      <button
        className="agui-fab"
        onClick={() => setOpen(true)}
        onPointerEnter={loadAgentDock}
        onFocus={loadAgentDock}
        aria-label="Ouvrir l'assistant"
      >
        <Sparkles size={18} aria-hidden="true" />
        <span className="agui-fab-dot" />
      </button>
    );
  }

  return (
    <Suspense fallback={(
      <button className="agui-fab open" onClick={() => setOpen(false)} aria-label="Fermer l'assistant">
        <LoaderCircle className="agui-loader-icon" size={18} aria-hidden="true" />
      </button>
    )}>
      <AgentDock />
    </Suspense>
  );
}

function App() {
  return (
    <HelmetProvider>
      <I18nextProvider i18n={i18n}>
        <AuthProvider>
          <Router>
            <NavigationSecurityBoundary>
              <ScrollToTop />
              <AgentProvider>
                <Suspense fallback={<ApplicationLoadingState />}>
                  <ClaudeFrontend />
                </Suspense>
                <DeferredAgentDock />
              </AgentProvider>
            </NavigationSecurityBoundary>
          </Router>
        </AuthProvider>
      </I18nextProvider>
    </HelmetProvider>
  );
}

export default App;
