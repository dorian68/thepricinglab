
import React from "react";
import { Calculator, Activity, Waves, Sigma, LineChart, Gauge } from "lucide-react";
import { NavMenuSection, NavMenuLink } from "./NavMenuSection";
import { useTranslation } from "react-i18next";
import { safeTranslate } from "../../utils/translationUtils";

const ToolsMenu = () => {
  const { t } = useTranslation();
  const st = (key: string, defaultValue: string) => safeTranslate(t, key, defaultValue);

  return (
    <div className="p-4 w-[400px]">
      <p className="text-sm text-primary mb-4 font-medium">
        {st('tools.subtitle', 'Browser-based pricing, simulation & calibration tools')}
      </p>
      <ul className="space-y-3">
        <NavMenuLink 
          to="/tools/volatility-calculator" 
          icon={<Gauge className="h-4 w-4" />} 
          title={st('tools.volatilityCalculator', 'Volatility Calculator')} 
          description={st('tools.volatilityCalculatorDesc', 'Realized vol estimation & rolling analysis')} 
        />
        <NavMenuLink 
          to="/tools/black-scholes" 
          icon={<Calculator className="h-4 w-4" />} 
          title={st('tools.blackScholesCalculator', 'Black-Scholes Pricer')} 
          description={st('tools.blackScholesCalculatorDesc', 'European option pricing & Greeks analytics')} 
        />
        <NavMenuLink 
          to="/tools/monte-carlo" 
          icon={<Waves className="h-4 w-4" />} 
          title={st('tools.monteCarloSimulator', 'Monte Carlo Simulator')} 
          description={st('tools.monteCarloSimulatorDesc', 'Stochastic path simulation & VaR computation')} 
        />
        <NavMenuLink 
          to="/tools/model-calibration" 
          icon={<Sigma className="h-4 w-4" />} 
          title={st('tools.modelCalibration', 'Model Calibration')} 
          description={st('tools.modelCalibrationDesc', 'SABR, Heston & Black model fitting')} 
        />
        <NavMenuLink 
          to="/tools/payoff-visualizer" 
          icon={<LineChart className="h-4 w-4" />} 
          title={st('tools.payoffVisualizer', 'Payoff Visualizer')} 
          description={st('tools.payoffVisualizerDesc', 'Multi-leg strategy payoff analysis')}
        />
      </ul>
    </div>
  );
};

export default ToolsMenu;
