
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Cpu, BarChart3, Shield, Zap } from 'lucide-react';
import ToolPageLayout from './ToolPageLayout';

const capabilities = [
  { icon: BarChart3, title: 'Geometric Brownian Motion', description: 'Simulate asset price trajectories under the standard GBM model with configurable drift and volatility.' },
  { icon: Zap, title: 'Jump-Diffusion (Merton)', description: 'Add Poisson-distributed jumps to capture sudden market moves and fat-tailed return distributions.' },
  { icon: Shield, title: 'Value-at-Risk', description: 'Compute VaR and CVaR at configurable confidence levels from simulated P&L distributions.' },
  { icon: Cpu, title: 'Browser-Based Compute', description: 'All simulations run locally via Pyodide (Python in WebAssembly). No server round-trips, no data leaves your browser.' },
];

const MonteCarloSimulator: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ToolPageLayout
      title="Monte Carlo Simulator"
      metaDescription="Simulate stochastic asset price paths using GBM and jump-diffusion models. Compute Value-at-Risk and expected shortfall from simulated distributions."
      headline="Monte Carlo Simulator"
      valueProp="Stochastic path simulation & risk metric computation."
      supportingText="Generate thousands of price trajectories under Geometric Brownian Motion or Merton jump-diffusion dynamics. Compute Value-at-Risk (VaR), Expected Shortfall (CVaR), and terminal distribution statistics — all computed locally in your browser via Pyodide."
      trustSignals={[
        'GBM & Jump-Diffusion',
        'VaR / CVaR computation',
        'Pyodide (WASM)',
        'No server-side data',
        'Configurable paths & steps',
      ]}
      methodology={[
        { label: 'Geometric Brownian Motion', content: 'The base model uses the Euler-Maruyama discretization of dS = μS dt + σS dW, where W is a Wiener process. Each time step generates a normally-distributed random increment scaled by √dt.' },
        { label: 'Jump-Diffusion (Merton 1976)', content: 'Extends GBM with a compound Poisson process: dS/S = (μ−λk)dt + σdW + J dN, where N is Poisson(λ) and J is log-normally distributed. Captures sudden large moves not modeled by pure diffusion.' },
        { label: 'Risk Metrics', content: 'VaR is computed as the α-quantile of the simulated P&L distribution. CVaR (Expected Shortfall) is the conditional mean of losses beyond VaR. Both are estimated from the empirical distribution of terminal values.' },
        { label: 'Convergence & Limitations', content: 'Monte Carlo convergence rate is O(1/√N). Variance reduction techniques (antithetic variates, control variates) are not yet implemented. Results are subject to sampling noise — increase path count for more stable estimates.' },
      ]}
      relatedResources={[
        { title: 'Monte Carlo Methods', description: 'Learn the theory behind stochastic simulation and variance reduction.', path: '/courses/complex/monte-carlo', type: 'course' },
        { title: 'Black-Scholes Calculator', description: 'Compare MC estimates with analytical BSM prices.', path: '/tools/black-scholes', type: 'tool' },
        { title: 'Volatility Calculator', description: 'Estimate historical volatility to parameterize your simulations.', path: '/tools/volatility-calculator', type: 'tool' },
      ]}
      bottomCta={{
        headline: 'Learn Monte Carlo methods in depth',
        description: 'From Euler discretization to variance reduction — master the simulation techniques used by quant desks.',
        primaryLabel: 'Monte Carlo Course',
        primaryPath: '/courses/complex/monte-carlo',
        secondaryLabel: 'Explore All Tools',
        secondaryPath: '/tools',
      }}
    >
      {/* Coming Soon state */}
      <div className="max-w-4xl mx-auto">
        <Card className="bg-card border-border overflow-hidden">
          <CardContent className="p-0">
            {/* Status banner */}
            <div className="px-6 py-4 bg-primary/10 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-sm font-medium text-foreground">Engine upgrade in progress</span>
              </div>
              <span className="text-xs text-muted-foreground">Pyodide runtime refactoring</span>
            </div>

            {/* Capabilities preview */}
            <div className="p-6 md:p-8">
              <h2 className="text-lg font-bold terminal-text mb-2">What this tool computes</h2>
              <p className="text-sm text-muted-foreground mb-6">
                The Monte Carlo simulator is being rebuilt for improved performance and stability. Here's what it will deliver:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {capabilities.map(({ icon: Icon, title, description }) => (
                  <div key={title} className="p-4 rounded-lg bg-secondary/30 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
                  </div>
                ))}
              </div>

              {/* Static output preview */}
              <div className="rounded-lg border border-border bg-secondary/20 p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3 terminal-text">Expected Output Preview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Paths', value: '10,000' },
                    { label: 'Mean Terminal', value: '$105.12' },
                    { label: 'VaR (95%)', value: '$-8.34' },
                    { label: 'CVaR (95%)', value: '$-12.71' },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-3 rounded bg-card border border-border text-center">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
                      <div className="text-base font-bold text-foreground mt-1">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button variant="finance" onClick={() => navigate('/courses/complex/monte-carlo')}>
                  Learn MC Theory <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10" onClick={() => navigate('/tools')}>
                  Explore Other Tools
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ToolPageLayout>
  );
};

export default MonteCarloSimulator;
