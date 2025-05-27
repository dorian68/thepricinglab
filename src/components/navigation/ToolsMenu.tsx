
import React from "react";
import { Calculator, Activity, Waves, Sigma, LineChart, Gauge } from "lucide-react";
import { NavMenuSection, NavMenuLink } from "./NavMenuSection";
import { useTranslation } from "react-i18next";
import { safeTranslate } from "../../utils/translationUtils";

const ToolsMenu = () => {
  const { t } = useTranslation();
  const st = (key: string, defaultValue: string) => safeTranslate(t, key, defaultValue);

  return (
    <div className="p-4 w-[380px]">
      <p className="text-sm text-finance-accent mb-4 font-medium">
        {st('tools.subtitle', 'Calculation tools and simulators for your quantitative analysis')}
      </p>
      <ul className="space-y-3">
        <NavMenuLink 
          to="/tools/volatility-calculator" 
          icon={<Gauge className="h-4 w-4" />} 
          title={st('tools.volatilityCalculator', 'Volatility Calculators')} 
          description={st('tools.volatilityCalculator', 'Historical volatility calculation')} 
        />
        <NavMenuLink 
          to="/tools/black-scholes" 
          icon={<Calculator className="h-4 w-4" />} 
          title={st('tools.blackScholes', 'Black-Scholes Calculator')} 
          description={st('tools.blackScholes', 'Option pricing')} 
        />
        <NavMenuLink 
          to="/tools/monte-carlo" 
          icon={<Waves className="h-4 w-4" />} 
          title={st('tools.monteCarlo', 'Monte Carlo Simulator')} 
          description={st('tools.monteCarlo', 'Path simulation')} 
        />
        <NavMenuLink 
          to="/tools/model-calibration" 
          icon={<Sigma className="h-4 w-4" />} 
          title={st('tools.modelCalibration', 'Model Calibration')} 
          description={st('tools.modelCalibration', 'Calibration and optimization')} 
        />
        <NavMenuLink 
          to="/tools/payoff-visualizer" 
          icon={<LineChart className="h-4 w-4" />} 
          title={st('tools.payoffVisualizer', 'Payoff Visualizer')} 
          description={st('tools.payoffVisualizer', 'Option strategy construction')} 
        />
      </ul>
    </div>
  );
};

export default ToolsMenu;
