import { BrowserRouter as Router } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { AuthProvider } from './contexts/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import ClaudeFrontend from './claude/ClaudeFrontend';
import { AgentProvider } from './agent/AgentProvider';
import AgentDock from './agent/AgentDock';
import i18n from './i18n';
import RouteMetadata from './components/RouteMetadata';

const queryClient = new QueryClient();

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Router>
              <ScrollToTop />
              <RouteMetadata />
              <AgentProvider>
                <ClaudeFrontend />
                <AgentDock />
              </AgentProvider>
            </Router>
          </AuthProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </I18nextProvider>
  );
}

export default App;
