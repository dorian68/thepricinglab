
import React from "react";
import { Calculator, Activity, Waves, Sigma, LineChart, Gauge } from "lucide-react";
import { NavMenuItem } from "./NavMenuSection";

const ToolsMenu = () => {
  return (
    <div className="p-4 w-[380px]">
      <p className="text-sm text-finance-accent mb-4 font-medium">Outils de calcul et simulateurs pour vos analyses quantitatives</p>
      <ul className="space-y-3">
        <NavMenuItem 
          to="/tools/volatility-calculator" 
          icon={Gauge} 
          title="Calculatrice de Volatilité" 
          description="Calcul de volatilité historique" 
        />
        <NavMenuItem 
          to="/tools/black-scholes" 
          icon={Calculator} 
          title="Black-Scholes Calculator" 
          description="Pricing d'options" 
        />
        <NavMenuItem 
          to="/tools/monte-carlo" 
          icon={Waves} 
          title="Simulateur Monte Carlo" 
          description="Simulation de trajectoires" 
        />
        <NavMenuItem 
          to="/tools/model-calibration" 
          icon={Sigma} 
          title="Calibration de Modèles" 
          description="Calibration et optimisation" 
        />
      </ul>
    </div>
  );
};

export default ToolsMenu;
