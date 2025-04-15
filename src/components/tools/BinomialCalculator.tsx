
import { useState } from "react";
import { Tree, TreeNode } from "react-d3-tree";

// Types for binomial tree nodes
type BinomialNode = {
  name: string;
  attributes: {
    price: number;
    optionValue?: number;
  };
  children?: BinomialNode[];
};

const BinomialCalculator = () => {
  const [spot, setSpot] = useState<number>(100);
  const [strike, setStrike] = useState<number>(100);
  const [volatility, setVolatility] = useState<number>(0.2);
  const [riskFreeRate, setRiskFreeRate] = useState<number>(0.05);
  const [timeToMaturity, setTimeToMaturity] = useState<number>(1);
  const [steps, setSteps] = useState<number>(3);
  const [optionType, setOptionType] = useState<string>("call");
  const [callPrice, setCallPrice] = useState<number | null>(null);
  const [putPrice, setPutPrice] = useState<number | null>(null);
  const [treeData, setTreeData] = useState<BinomialNode | null>(null);
  
  // Function to calculate option price using binomial model
  const calculate = () => {
    // Time step
    const dt = timeToMaturity / steps;
    
    // Calculate up and down factors
    const up = Math.exp(volatility * Math.sqrt(dt));
    const down = 1 / up;
    
    // Calculate risk-neutral probability
    const p = (Math.exp(riskFreeRate * dt) - down) / (up - down);
    
    // Initialize stock price tree
    const stockTree: number[][] = Array(steps + 1).fill(0).map(() => Array(steps + 1).fill(0));
    
    // Initialize option price tree
    const optionTree: number[][] = Array(steps + 1).fill(0).map(() => Array(steps + 1).fill(0));
    
    // Build stock price tree
    for (let i = 0; i <= steps; i++) {
      for (let j = 0; j <= i; j++) {
        stockTree[i][j] = spot * Math.pow(up, j) * Math.pow(down, i - j);
      }
    }
    
    // Calculate option values at expiration
    for (let j = 0; j <= steps; j++) {
      if (optionType === "call") {
        optionTree[steps][j] = Math.max(0, stockTree[steps][j] - strike);
      } else {
        optionTree[steps][j] = Math.max(0, strike - stockTree[steps][j]);
      }
    }
    
    // Backward induction
    for (let i = steps - 1; i >= 0; i--) {
      for (let j = 0; j <= i; j++) {
        optionTree[i][j] = Math.exp(-riskFreeRate * dt) * (p * optionTree[i + 1][j + 1] + (1 - p) * optionTree[i + 1][j]);
      }
    }
    
    // Set the calculated prices
    if (optionType === "call") {
      setCallPrice(optionTree[0][0]);
      setPutPrice(null);
    } else {
      setCallPrice(null);
      setPutPrice(optionTree[0][0]);
    }
    
    // Create tree data for visualization
    const createTreeNode = (i: number, j: number): BinomialNode => {
      if (i > steps) return { name: "", attributes: { price: 0 } };
      
      return {
        name: `S_${i},${j}`,
        attributes: {
          price: parseFloat(stockTree[i][j].toFixed(2)),
          optionValue: parseFloat(optionTree[i][j].toFixed(2))
        },
        children: i < steps ? [
          createTreeNode(i + 1, j),
          createTreeNode(i + 1, j + 1)
        ] : []
      };
    };
    
    setTreeData(createTreeNode(0, 0));
  };
  
  return (
    <div className="finance-card p-6">
      <h3 className="text-xl font-medium mb-6">Calculatrice Binomiale</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="space-y-4">
            <div>
              <label className="block text-finance-lightgray text-sm mb-1">Prix spot</label>
              <input
                type="number"
                value={spot}
                onChange={(e) => setSpot(parseFloat(e.target.value) || 0)}
                className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
              />
            </div>
            
            <div>
              <label className="block text-finance-lightgray text-sm mb-1">Prix d'exercice</label>
              <input
                type="number"
                value={strike}
                onChange={(e) => setStrike(parseFloat(e.target.value) || 0)}
                className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
              />
            </div>
            
            <div>
              <label className="block text-finance-lightgray text-sm mb-1">Volatilité (décimal)</label>
              <input
                type="number"
                step="0.01"
                value={volatility}
                onChange={(e) => setVolatility(parseFloat(e.target.value) || 0)}
                className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
              />
            </div>
            
            <div>
              <label className="block text-finance-lightgray text-sm mb-1">Taux d'intérêt (décimal)</label>
              <input
                type="number"
                step="0.01"
                value={riskFreeRate}
                onChange={(e) => setRiskFreeRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
              />
            </div>
            
            <div>
              <label className="block text-finance-lightgray text-sm mb-1">Temps jusqu'à maturité (années)</label>
              <input
                type="number"
                step="0.1"
                value={timeToMaturity}
                onChange={(e) => setTimeToMaturity(parseFloat(e.target.value) || 0)}
                className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
              />
            </div>
            
            <div>
              <label className="block text-finance-lightgray text-sm mb-1">Nombre d'étapes</label>
              <input
                type="number"
                min="1"
                max="5"
                value={steps}
                onChange={(e) => setSteps(parseInt(e.target.value) || 1)}
                className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
              />
              <p className="text-finance-lightgray text-xs mt-1">Limité à 5 pour la visualisation</p>
            </div>
            
            <div>
              <label className="block text-finance-lightgray text-sm mb-1">Type d'option</label>
              <select
                value={optionType}
                onChange={(e) => setOptionType(e.target.value)}
                className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
              >
                <option value="call">Call</option>
                <option value="put">Put</option>
              </select>
            </div>
            
            <button
              onClick={calculate}
              className="finance-button w-full"
            >
              Calculer
            </button>
          </div>
        </div>
        
        <div>
          <h4 className="text-finance-offwhite font-medium mb-4">Résultats</h4>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="finance-card p-4">
              <p className="text-finance-lightgray text-sm mb-1">Prix {optionType === "call" ? "Call" : "Put"}</p>
              <p className="text-2xl font-medium text-finance-offwhite">
                {optionType === "call" 
                  ? callPrice !== null ? callPrice.toFixed(2) : "—" 
                  : putPrice !== null ? putPrice.toFixed(2) : "—"}
              </p>
            </div>
            
            <div className="finance-card p-4">
              <p className="text-finance-lightgray text-sm mb-1">Modèle</p>
              <p className="text-lg font-medium text-finance-offwhite">Binomial CRR</p>
            </div>
          </div>
          
          <div className="finance-card p-4 bg-finance-charcoal/50 mb-4">
            <h5 className="text-finance-offwhite font-medium mb-2">Paramètres du modèle</h5>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="text-finance-lightgray py-1">Facteur de hausse (u)</td>
                  <td className="text-finance-offwhite text-right py-1">
                    {Math.exp(volatility * Math.sqrt(timeToMaturity / steps)).toFixed(4)}
                  </td>
                </tr>
                <tr>
                  <td className="text-finance-lightgray py-1">Facteur de baisse (d)</td>
                  <td className="text-finance-offwhite text-right py-1">
                    {(1 / Math.exp(volatility * Math.sqrt(timeToMaturity / steps))).toFixed(4)}
                  </td>
                </tr>
                <tr>
                  <td className="text-finance-lightgray py-1">Probabilité risque-neutre (p)</td>
                  <td className="text-finance-offwhite text-right py-1">
                    {((Math.exp(riskFreeRate * (timeToMaturity / steps)) - (1 / Math.exp(volatility * Math.sqrt(timeToMaturity / steps)))) / 
                      (Math.exp(volatility * Math.sqrt(timeToMaturity / steps)) - (1 / Math.exp(volatility * Math.sqrt(timeToMaturity / steps))))).toFixed(4)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {treeData && (
            <div className="relative h-60 w-full bg-finance-charcoal/30 rounded border border-finance-steel/20 overflow-hidden">
              <div className="p-2 text-finance-accent text-xs absolute top-0 left-0 z-10">
                Arbre binomial (visualisation simplifiée)
              </div>
              
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-finance-offwhite font-medium">S₀ = {spot.toFixed(2)}</p>
                  <p className="text-finance-accent">V₀ = {optionType === "call" ? callPrice?.toFixed(2) : putPrice?.toFixed(2)}</p>
                
                  <div className="mt-4 flex justify-center space-x-8">
                    <div>
                      <p className="text-finance-offwhite">S₁ᵘ = {(spot * Math.exp(volatility * Math.sqrt(timeToMaturity / steps))).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-finance-offwhite">S₁ᵈ = {(spot / Math.exp(volatility * Math.sqrt(timeToMaturity / steps))).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="border-t border-finance-steel/20 pt-4 mt-4">
        <p className="text-finance-lightgray text-sm">
          Le modèle binomial (Cox-Ross-Rubinstein) divise la période jusqu'à l'expiration en étapes discrètes. À chaque étape, 
          le prix du sous-jacent peut monter ou descendre par un facteur déterminé par la volatilité. Cette approche est particulièrement
          utile pour évaluer les options américaines qui peuvent être exercées avant la maturité.
        </p>
      </div>
    </div>
  );
};

export default BinomialCalculator;
