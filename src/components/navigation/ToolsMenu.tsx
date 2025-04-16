
import React from "react";
import { Calculator, Activity, Waves, Sigma } from "lucide-react";
import { NavMenuItem } from "./NavMenuSection";

const ToolsMenu = () => {
  return (
    <div className="p-4 w-[380px]">
      <p className="text-sm text-finance-accent mb-4 font-medium">Outils de calcul et simulateurs pour vos analyses quantitatives</p>
      <ul className="space-y-3">
        <NavMenuItem 
          to="/tools/volatility-calculator" 
          icon={Calculator} 
          title="Calculatrices de Volatilité" 
          description="Outils d'analyse de vol" 
        />
        <NavMenuItem 
          to="/tools/black-scholes" 
          icon={Activity} 
          title="Simulateur Black-Scholes" 
          description="Pricing d'options" 
        />
        <NavMenuItem 
          to="/tools/monte-carlo" 
          icon={Waves} 
          title="Générateur Monte Carlo" 
          description="Simulation de scénarios" 
        />
        <NavMenuItem 
          to="/tools/model-calibration" 
          icon={Sigma} 
          title="Calibration de Modèles" 
          description="Analyse de surfaces de vol" 
        />
      </ul>
    </div>
  );
};

export default ToolsMenu;
