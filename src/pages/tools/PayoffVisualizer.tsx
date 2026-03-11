
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { safeTranslate } from '@/utils/translationUtils';
import { StrategyParameters } from '@/types/strategies';
import StrategyBuilder from '@/components/strategies/StrategyBuilder';
import StrategyResults from '@/components/strategies/StrategyResults';
import usePayoffCalculator from '@/hooks/usePayoffCalculator';
import ToolPageLayout from '@/components/tools/ToolPageLayout';

const PayoffVisualizer: React.FC = () => {
  const { t } = useTranslation();

  const [parameters, setParameters] = useState<StrategyParameters>({
    spotPrice: 100,
    volatility: 0.2,
    timeToMaturity: 1,
    interestRate: 0.03,
    dividendYield: 0.01,
    legs: []
  });

  const { result, isCalculating } = usePayoffCalculator(parameters);

  return (
    <ToolPageLayout
      title="Option Payoff Visualizer"
      metaDescription="Build multi-leg option strategies and analyze payoff diagrams, P&L profiles, and Greeks exposure at expiry. Interactive strategy construction with real-time visualization."
      headline="Option Payoff Visualizer"
      valueProp="Build multi-leg strategies and analyze payoff diagrams in real time."
      supportingText="Construct calls, puts, and spreads with configurable strikes, quantities, and premiums. Visualize the aggregate payoff at expiry, identify breakeven points, and assess maximum profit/loss — essential for structuring, hedging, and pre-trade analysis."
      trustSignals={[
        'Multi-leg construction',
        'Real-time payoff chart',
        'Greeks via BS model',
        'Breakeven analysis',
        'No data leaves browser',
      ]}
      methodology={[
        { label: 'Payoff Computation', content: 'At expiry, call payoff = max(S_T − K, 0) and put payoff = max(K − S_T, 0). The net P&L for each leg includes the premium paid/received. The aggregate strategy P&L is the sum across all legs, accounting for position direction (long/short) and quantity.' },
        { label: 'Greeks Estimation', content: 'Greeks are computed using the Black-Scholes-Merton analytical formulas for each individual leg. Portfolio Greeks are the linear sum of individual leg Greeks, weighted by position size and direction.' },
        { label: 'Limitations', content: 'Payoff diagrams show intrinsic value at expiry only — they do not account for early exercise (American options), time value during the life of the option, transaction costs, or margin requirements. Greeks assume constant volatility across strikes (no smile adjustment).' },
      ]}
      relatedResources={[
        { title: 'Greeks Deep Dive', description: 'Understand how Delta, Gamma, Vega, and Theta interact in complex strategies.', path: '/courses/fundamentals/greeks', type: 'course' },
        { title: 'Black-Scholes Calculator', description: 'Price individual legs with the analytical BSM model.', path: '/tools/black-scholes', type: 'tool' },
        { title: 'Exotic Options', description: 'Explore barrier, Asian, and lookback payoffs beyond vanilla structures.', path: '/courses/complex/exotic-options', type: 'course' },
      ]}
      bottomCta={{
        headline: 'Master options strategy construction',
        description: 'From covered calls to iron condors — learn to build, analyze, and hedge multi-leg structures.',
        primaryLabel: 'Greeks Course',
        primaryPath: '/courses/fundamentals/greeks',
        secondaryLabel: 'Try BS Calculator',
        secondaryPath: '/tools/black-scholes',
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <StrategyBuilder parameters={parameters} onParametersChange={setParameters} />
        </div>
        <div>
          <StrategyResults result={result} isCalculating={isCalculating} />
        </div>
      </div>
    </ToolPageLayout>
  );
};

export default PayoffVisualizer;
