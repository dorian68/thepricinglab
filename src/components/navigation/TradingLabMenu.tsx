
import React from "react";
import { LineChart, Workflow, Share2, GitBranch, BarChart } from "lucide-react";
import { NavMenuItem } from "./NavMenuSection";
import { useTranslation } from "react-i18next";
import { safeTranslate } from "../../utils/translationUtils";

const TradingLabMenu = () => {
  const { t } = useTranslation();
  const st = (key: string, defaultValue: string) => safeTranslate(t, key, defaultValue);

  return (
    <div className="p-4 w-[380px]">
      <p className="text-sm text-finance-accent mb-4 font-medium">
        {st('tradingLab.subtitle', 'Test, validate and monitor your trading strategies')}
      </p>
      <ul className="space-y-3">
        <NavMenuItem 
          to="/exercises" 
          icon={LineChart} 
          title={st('tradingLab.exercises', 'Exercices')} 
          description={st('tradingLab.exercisesDesc', 'Practice with interactive exercises')} 
        />
        <NavMenuItem 
          to="/trading/backtest" 
          icon={Workflow} 
          title={st('tradingLab.backtest', 'Backtest')} 
          description={st('tradingLab.backtestDesc', 'Evaluate strategies on historical data')} 
        />
        <NavMenuItem 
          to="/trading/scenarios" 
          icon={Share2} 
          title={st('tradingLab.scenarios', 'Scénarios')} 
          description={st('tradingLab.scenariosDesc', 'Test market scenarios and assumptions')} 
        />
        <NavMenuItem 
          to="/trading/strategies" 
          icon={GitBranch} 
          title={st('tradingLab.strategies', 'Stratégies')} 
          description={st('tradingLab.strategiesDesc', 'Build and test trading strategies')} 
        />
        <NavMenuItem 
          to="/trading/performance" 
          icon={BarChart} 
          title={st('tradingLab.performance', 'Performances')} 
          description={st('tradingLab.performanceDesc', 'Track and analyze your results')} 
        />
      </ul>
    </div>
  );
};

export default TradingLabMenu;
