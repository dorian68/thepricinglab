
import React from "react";
import { LineChart, Workflow, Share2, GitBranch, BarChart } from "lucide-react";
import { NavMenuItem } from "./NavMenuSection";
import { useTranslation } from "react-i18next";
import { safeTranslate } from "../../utils/translationUtils";

const TradingLabMenu = () => {
  const { t } = useTranslation();

  return (
    <div className="p-4 w-[380px]">
      <p className="text-sm text-finance-accent mb-4 font-medium">
        {safeTranslate(t, 'tradingLab.subtitle', 'Test, validate and monitor your trading strategies')}
      </p>
      <ul className="space-y-3">
        <NavMenuItem 
          to="/trading/exercises" 
          icon={LineChart} 
          title={safeTranslate(t, 'tradingLab.exercises', 'Exercices')} 
          description={safeTranslate(t, 'tradingLab.exercisesDesc', 'Practice with interactive exercises')} 
        />
        <NavMenuItem 
          to="/trading/backtest" 
          icon={Workflow} 
          title={safeTranslate(t, 'tradingLab.backtest', 'Backtest')} 
          description={safeTranslate(t, 'tradingLab.backtestDesc', 'Evaluate strategies on historical data')} 
        />
        <NavMenuItem 
          to="/trading/scenarios" 
          icon={Share2} 
          title={safeTranslate(t, 'tradingLab.scenarios', 'Scénarios')} 
          description={safeTranslate(t, 'tradingLab.scenariosDesc', 'Test market scenarios and assumptions')} 
        />
        <NavMenuItem 
          to="/trading/strategies" 
          icon={GitBranch} 
          title={safeTranslate(t, 'tradingLab.strategies', 'Stratégies')} 
          description={safeTranslate(t, 'tradingLab.strategiesDesc', 'Build and test trading strategies')} 
        />
        <NavMenuItem 
          to="/trading/performance" 
          icon={BarChart} 
          title={safeTranslate(t, 'tradingLab.performance', 'Performances')} 
          description={safeTranslate(t, 'tradingLab.performanceDesc', 'Track and analyze your results')} 
        />
      </ul>
    </div>
  );
};

export default TradingLabMenu;
