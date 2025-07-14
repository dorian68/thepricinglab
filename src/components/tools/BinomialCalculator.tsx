
import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { Info } from "lucide-react";
import Tree from "react-d3-tree";

// Custom node types for the binomial tree
type NodeData = {
  id: string;
  price: number;
  probability?: number;
  isCall?: boolean;
  optionValue?: number;
};

// Custom component for tree nodes
const CustomNode = ({ nodeDatum }: { nodeDatum: any }) => {
  const nodeData = nodeDatum as NodeData;
  return (
    <g>
      <circle r={20} fill={nodeData.isCall ? "#4A89DC" : "#ea384c"} />
      <text
        dy=".31em"
        fontSize={9}
        fontFamily="Arial"
        textAnchor="middle"
        fill="white"
        style={{ pointerEvents: "none" }}
      >
        {nodeData.price.toFixed(2)}
      </text>
      {nodeData.optionValue !== undefined && (
        <text
          dy="-.5em"
          dx="1.5em"
          fontSize={8}
          fontFamily="Arial"
          textAnchor="middle"
          fill="#e5e5e5"
        >
          {nodeData.optionValue.toFixed(2)}
        </text>
      )}
    </g>
  );
};

const BinomialCalculator = () => {
  const { t } = useTranslation();
  const [spotPrice, setSpotPrice] = useState<number>(100);
  const [strike, setStrike] = useState<number>(100);
  const [volatility, setVolatility] = useState<number>(20);
  const [timeToExpiry, setTimeToExpiry] = useState<number>(1);
  const [riskFreeRate, setRiskFreeRate] = useState<number>(5);
  const [steps, setSteps] = useState<number>(3);
  const [optionType, setOptionType] = useState<string>("call");
  const [treeData, setTreeData] = useState<any>(null);
  const [optionPrice, setOptionPrice] = useState<number | null>(null);

  const calculateBinomialTree = () => {
    // Convert inputs to proper formats for calculations
    const S = spotPrice;
    const K = strike;
    const sigma = volatility / 100;
    const T = timeToExpiry;
    const r = riskFreeRate / 100;
    const N = steps;
    const isCall = optionType === "call";

    // Time step
    const dt = T / N;
    
    // Up and down factors
    const u = Math.exp(sigma * Math.sqrt(dt));
    const d = 1 / u;
    
    // Risk-neutral probability
    const p = (Math.exp(r * dt) - d) / (u - d);

    // Create price tree
    let prices: number[][] = [];
    for (let i = 0; i <= N; i++) {
      prices[i] = [];
      for (let j = 0; j <= i; j++) {
        prices[i][j] = S * Math.pow(u, j) * Math.pow(d, i - j);
      }
    }

    // Create option value tree (backward induction)
    let optionValues: number[][] = [];
    for (let i = 0; i <= N; i++) {
      optionValues[i] = [];
    }

    // Terminal payoffs
    for (let j = 0; j <= N; j++) {
      if (isCall) {
        optionValues[N][j] = Math.max(0, prices[N][j] - K);
      } else {
        optionValues[N][j] = Math.max(0, K - prices[N][j]);
      }
    }

    // Backward induction
    for (let i = N - 1; i >= 0; i--) {
      for (let j = 0; j <= i; j++) {
        optionValues[i][j] = Math.exp(-r * dt) * (p * optionValues[i + 1][j + 1] + (1 - p) * optionValues[i + 1][j]);
      }
    }

    // Set option price
    setOptionPrice(optionValues[0][0]);

    // Structure the tree data for d3 visualization
    const createTreeNodes = (i: number, j: number): any => {
      if (i > N) return null;
      
      const node = {
        name: `${i}-${j}`,
        attributes: {
          price: prices[i][j],
          optionValue: optionValues[i][j]
        },
        price: prices[i][j],
        optionValue: optionValues[i][j],
        isCall: isCall,
        children: []
      };

      if (i < N) {
        const upChild = createTreeNodes(i + 1, j + 1);
        const downChild = createTreeNodes(i + 1, j);
        if (upChild) node.children.push(upChild);
        if (downChild) node.children.push(downChild);
      }

      return node;
    };

    const treeRoot = createTreeNodes(0, 0);
    setTreeData(treeRoot);
  };

  return (
    <div className="finance-card p-6">
      <h3 className="text-xl font-medium mb-6">{t('tools.binomial.title')}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-finance-lightgray text-sm mb-1">Prix Spot</label>
          <input 
            type="number" 
            value={spotPrice}
            onChange={(e) => setSpotPrice(Number(e.target.value))}
            className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
          />
        </div>
        
        <div>
          <label className="block text-finance-lightgray text-sm mb-1">Strike</label>
          <input 
            type="number" 
            value={strike}
            onChange={(e) => setStrike(Number(e.target.value))}
            className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
          />
        </div>
        
        <div>
          <label className="block text-finance-lightgray text-sm mb-1">Volatilité (%)</label>
          <input 
            type="number" 
            value={volatility}
            onChange={(e) => setVolatility(Number(e.target.value))}
            className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
          />
        </div>
        
        <div>
          <label className="block text-finance-lightgray text-sm mb-1">Temps à Maturité (années)</label>
          <input 
            type="number" 
            value={timeToExpiry}
            onChange={(e) => setTimeToExpiry(Number(e.target.value))}
            className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
            step="0.1"
          />
        </div>
        
        <div>
          <label className="block text-finance-lightgray text-sm mb-1">Taux sans risque (%)</label>
          <input 
            type="number" 
            value={riskFreeRate}
            onChange={(e) => setRiskFreeRate(Number(e.target.value))}
            className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
          />
        </div>
        
        <div>
          <label className="block text-finance-lightgray text-sm mb-1">Nombre d'étapes</label>
          <input 
            type="number" 
            value={steps}
            onChange={(e) => setSteps(Number(e.target.value))}
            className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
            min="1"
            max="5"
          />
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
      </div>
      
      <button 
        onClick={calculateBinomialTree} 
        className="finance-button mb-6"
      >
        Calculer
      </button>
      
      {optionPrice !== null && (
        <div className="mb-6 p-4 bg-finance-charcoal/50 rounded border border-finance-steel/30">
          <p className="text-finance-offwhite">
            Prix de l'option: <span className="font-bold text-finance-accent">{optionPrice.toFixed(4)}</span>
          </p>
        </div>
      )}
      
      {treeData && (
        <div className="h-80 bg-finance-charcoal/30 rounded border border-finance-steel/20 mb-6">
          <Tree 
            data={treeData}
            pathFunc="step"
            orientation="vertical"
            renderCustomNodeElement={CustomNode}
            separation={{ siblings: 1, nonSiblings: 1.2 }}
            translate={{ x: 300, y: 40 }}
            zoom={0.7}
          />
        </div>
      )}
      
      <div className="bg-finance-charcoal/50 p-4 rounded-lg border border-finance-steel/20 flex items-start">
        <Info className="h-5 w-5 text-finance-accent flex-shrink-0 mt-0.5 mr-3" />
        <div>
          <h4 className="text-finance-offwhite font-medium mb-1">À propos du modèle binomial</h4>
          <p className="text-finance-lightgray text-sm">
            Le modèle binomial est une méthode numérique pour l'évaluation d'options. Il discrétise le temps jusqu'à expiration en étapes multiples, 
            avec deux mouvements possibles à chaque étape (up ou down). Ce modèle est particulièrement utile pour les options américaines et 
            les structures exotiques path-dependent.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BinomialCalculator;
