import { BrowserRouter as Router } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { AuthProvider } from './contexts/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import ClaudeFrontend from './claude/ClaudeFrontend';
import { AgentProvider } from './agent/AgentProvider';
import AgentDock from './agent/AgentDock';
import i18n from './i18n';

const queryClient = new QueryClient();

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Helmet>
              <title>The Pricing Library — Learn Quantitative Finance & Options Pricing</title>
              <meta
                name="description"
                content="Master options pricing with interactive courses, simulators and advanced tools. Black-Scholes, Monte Carlo, Volatility and more."
              />
              <meta
                name="keywords"
                content="pricing financier, options, black-scholes, monte carlo, volatilité, finance quantitative, simulateurs financiers"
              />
              <link rel="canonical" href="https://thepricinglibrary.com" />
            </Helmet>
            <Router>
              <ScrollToTop />
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
