
import React from "react";
import { Calculator, Activity, Waves, Sigma, LineChart, Gauge } from "lucide-react";
import { NavMenuSection, NavMenuLink } from "./NavMenuSection";

const ToolsMenu = () => {
  return (
    <div className="p-4 w-[380px]">
      <p className="text-sm text-finance-accent mb-4 font-medium">Outils de calcul et simulateurs pour vos analyses quantitatives</p>
      <ul className="space-y-3">
        <NavMenuLink 
          to="/tools/volatility-calculator" 
          icon={<Gauge className="h-4 w-4" />} 
          title="Calculatrice de Volatilité" 
          description="Calcul de volatilité historique" 
        />
        <NavMenuLink 
          to="/tools/black-scholes" 
          icon={<Calculator className="h-4 w-4" />} 
          title="Black-Scholes Calculator" 
          description="Pricing d'options" 
        />
        <NavMenuLink 
          to="/tools/monte-carlo" 
          icon={<Waves className="h-4 w-4" />} 
          title="Simulateur Monte Carlo" 
          description="Simulation de trajectoires" 
        />
        <NavMenuLink 
          to="/tools/model-calibration" 
          icon={<Sigma className="h-4 w-4" />} 
          title="Calibration de Modèles" 
          description="Calibration et optimisation" 
        />
        <NavMenuLink 
          to="/tools/payoff-visualizer" 
          icon={<LineChart className="h-4 w-4" />} 
          title="Visualiseur de Payoff" 
          description="Construction de stratégies optionnelles" 
        />
      </ul>
    </div>
  );
};

export default ToolsMenu;
