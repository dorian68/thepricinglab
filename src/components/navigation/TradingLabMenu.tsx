
import React from "react";
import { LineChart, Workflow, Share2, GitBranch, BarChart } from "lucide-react";
import { NavMenuSection, NavMenuLink } from "./NavMenuSection";
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
        <NavMenuLink 
          to="/exercises" 
          icon={<LineChart className="h-4 w-4" />} 
          title={st('tradingLab.exercises', 'Exercises')} 
          description={st('tradingLab.exercisesDesc', 'Practice with interactive exercises')} 
        />
        <NavMenuLink 
          to="/trading/backtest" 
          icon={<Workflow className="h-4 w-4" />} 
          title={st('tradingLab.backtest', 'Backtest')} 
          description={st('tradingLab.backtestDesc', 'Evaluate strategies on historical data')} 
        />
        <NavMenuLink 
          to="/trading/scenarios" 
          icon={<Share2 className="h-4 w-4" />} 
          title={st('tradingLab.scenarios', 'Scenarios')} 
          description={st('tradingLab.scenariosDesc', 'Test market scenarios and assumptions')} 
        />
        <NavMenuLink 
          to="/trading/strategies" 
          icon={<GitBranch className="h-4 w-4" />} 
          title={st('tradingLab.strategies', 'Strategies')} 
          description={st('tradingLab.strategiesDesc', 'Build and test trading strategies')} 
        />
        <NavMenuLink 
          to="/trading/performance" 
          icon={<BarChart className="h-4 w-4" />} 
          title={st('tradingLab.performance', 'Performance')} 
          description={st('tradingLab.performanceDesc', 'Track and analyze your results')} 
        />
      </ul>
    </div>
  );
};

export default TradingLabMenu;
