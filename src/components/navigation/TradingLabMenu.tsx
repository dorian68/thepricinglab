
import React from "react";
import { LineChart, Workflow, Share2, GitBranch, BarChart } from "lucide-react";
import { NavMenuItem } from "./NavMenuSection";
import { useTranslation } from "react-i18next";

const TradingLabMenu = () => {
  const { t } = useTranslation();

  return (
    <div className="p-4 w-[380px]">
      <p className="text-sm text-finance-accent mb-4 font-medium">
        {t('tradingLab.subtitle', 'Test, validate and monitor your trading strategies')}
      </p>
      <ul className="space-y-3">
        <NavMenuItem 
          to="/trading/exercises" 
          icon={LineChart} 
          title={t('tradingLab.exercises', 'Exercices')} 
          description={t('tradingLab.exercisesDesc', 'Practice with interactive exercises')} 
        />
        <NavMenuItem 
          to="/trading/backtest" 
          icon={Workflow} 
          title={t('tradingLab.backtest', 'Backtest')} 
          description={t('tradingLab.backtestDesc', 'Evaluate strategies on historical data')} 
        />
        <NavMenuItem 
          to="/trading/scenarios" 
          icon={Share2} 
          title={t('tradingLab.scenarios', 'Scénarios')} 
          description={t('tradingLab.scenariosDesc', 'Test market scenarios and assumptions')} 
        />
        <NavMenuItem 
          to="/trading/strategies" 
          icon={GitBranch} 
          title={t('tradingLab.strategies', 'Stratégies')} 
          description={t('tradingLab.strategiesDesc', 'Build and test trading strategies')} 
        />
        <NavMenuItem 
          to="/trading/performance" 
          icon={BarChart} 
          title={t('tradingLab.performance', 'Performances')} 
          description={t('tradingLab.performanceDesc', 'Track and analyze your results')} 
        />
      </ul>
    </div>
  );
};

export default TradingLabMenu;
