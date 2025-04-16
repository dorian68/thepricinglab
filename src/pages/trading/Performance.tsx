
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { safeTranslate } from '../../utils/translationUtils';

const Performance = () => {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>{safeTranslate(t, 'tradingLab.performance', 'Performances')} | The Trading Lab</title>
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-finance-accent mb-6">
          {safeTranslate(t, 'tradingLab.performance', 'Performances')}
        </h1>
        <p className="text-finance-offwhite mb-8">
          {safeTranslate(t, 'tradingLab.performanceDesc', 'Track and analyze your trading results to improve your strategies')}
        </p>
        <div className="bg-finance-charcoal p-6 rounded-lg shadow-md">
          <p className="text-finance-offwhite">Coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default Performance;
