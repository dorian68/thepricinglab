
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import ModernNavbar from '../../components/ModernNavbar';

const Scenarios = () => {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>{t('tradingLab.scenarios', 'Scénarios')} | The Trading Lab</title>
      </Helmet>
      <ModernNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-finance-accent mb-6">
          {t('tradingLab.scenarios', 'Scénarios')}
        </h1>
        <p className="text-finance-offwhite mb-8">
          {t('tradingLab.scenariosDesc', 'Test market scenarios and assumptions to prepare for different market conditions')}
        </p>
        <div className="bg-finance-charcoal p-6 rounded-lg shadow-md">
          <p className="text-finance-offwhite">Coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default Scenarios;
