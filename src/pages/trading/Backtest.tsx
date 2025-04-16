
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { safeTranslate } from '../../utils/translationUtils';

const Backtest = () => {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>{safeTranslate(t, 'tradingLab.backtest', 'Backtest')} | The Trading Lab</title>
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-finance-accent mb-6">
          {safeTranslate(t, 'tradingLab.backtest', 'Backtest')}
        </h1>
        <p className="text-finance-offwhite mb-8">
          {safeTranslate(t, 'tradingLab.backtestDesc', 'Evaluate strategies on historical data to validate your approaches')}
        </p>
        <div className="bg-finance-charcoal p-6 rounded-lg shadow-md">
          <p className="text-finance-offwhite">Coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default Backtest;
