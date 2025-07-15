
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
          title={st('tools.volatilityCalculator.title', 'Calculateur de Volatilité')} 
          description={st('tools.volatilityCalculator.desc', 'Calcul de volatilité historique')} 
        />
        <NavMenuLink 
          to="/tools/black-scholes" 
          icon={<Calculator className="h-4 w-4" />} 
          title={st('tools.blackScholes.title', 'Calculateur Black-Scholes')} 
          description={st('tools.blackScholes.desc', 'Pricing d\'options')} 
        />
        <NavMenuLink 
          to="/tools/monte-carlo" 
          icon={<Waves className="h-4 w-4" />} 
          title={st('tools.monteCarlo.title', 'Simulateur Monte Carlo')} 
          description={st('tools.monteCarlo.desc', 'Simulation de trajectoires')} 
        />
        <NavMenuLink 
          to="/tools/model-calibration" 
          icon={<Sigma className="h-4 w-4" />} 
          title={st('tools.modelCalibration.title', 'Calibration de Modèles')} 
          description={st('tools.modelCalibration.desc', 'Calibration et optimisation')} 
        />
        <NavMenuLink 
          to="/tools/payoff-visualizer" 
          icon={<LineChart className="h-4 w-4" />} 
          title={st('tools.payoffVisualizer.title', 'Visualiseur de Payoff')} 
          description={st('tools.payoffVisualizer.desc', 'Construction de stratégies d\'options')} 
        />
      </ul>
    </div>
  );
};

export default ToolsMenu;
