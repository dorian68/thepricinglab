
import { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  ArrowLeft,
  BookOpen, 
  Calculator, 
  Check, 
  ChevronRight, 
  Clock, 
  FileText, 
  GraduationCap, 
  Play,
  Download,
  Code,
  PenLine,
  Sliders,
  LineChart,
  GitFork,
  ChevronDown
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { blackScholes, normCDF } from "../../utils/options/blackScholes";

// Simplified Black-Scholes for Case 1
const simplifiedBlackScholes = (S: number, K: number, sigma: number) => {
  // r = 0, T = 1
  const d1 = (Math.log(S / K) + (0.5 * sigma * sigma)) / sigma;
  const d2 = d1 - sigma;
  
  const callPrice = S * normCDF(d1) - K * normCDF(d2);
  return {
    callPrice,
    d1,
    d2,
    Nd1: normCDF(d1),
    Nd2: normCDF(d2)
  };
};

// Simple Binomial Tree Pricing
const binomialOptionPricing = (S: number, K: number, sigma: number, steps: number = 3) => {
  const r = 0; // Risk-free rate = 0 for simplification
  const T = 1; // Time to maturity = 1 year
  
  const dt = T / steps;
  const u = Math.exp(sigma * Math.sqrt(dt));
  const d = 1 / u;
  const p = (Math.exp(r * dt) - d) / (u - d);
  
  // Initialize the asset prices at each node
  const assetPrices = Array(steps + 1).fill(0).map(() => Array(steps + 1).fill(0));
  for (let i = 0; i <= steps; i++) {
    for (let j = 0; j <= i; j++) {
      assetPrices[i][j] = S * Math.pow(u, j) * Math.pow(d, i - j);
    }
  }
  
  // Calculate option values at expiration
  const optionValues = Array(steps + 1).fill(0).map(() => Array(steps + 1).fill(0));
  for (let j = 0; j <= steps; j++) {
    optionValues[steps][j] = Math.max(0, assetPrices[steps][j] - K);
  }
  
  // Work backwards to calculate option values at earlier nodes
  for (let i = steps - 1; i >= 0; i--) {
    for (let j = 0; j <= i; j++) {
      optionValues[i][j] = (p * optionValues[i + 1][j + 1] + (1 - p) * optionValues[i + 1][j]) * Math.exp(-r * dt);
    }
  }
  
  return {
    price: optionValues[0][0],
    u,
    d,
    p,
    treeData: {
      assetPrices,
      optionValues
    }
  };
};

// Simple Chart Component for Case 2
const PriceChart = ({ spotPrices, callPrices }: { spotPrices: number[], callPrices: number[] }) => {
  const maxPrice = Math.max(...callPrices) * 1.1;
  const minSpot = Math.min(...spotPrices);
  const maxSpot = Math.max(...spotPrices);

  return (
    <div className="w-full h-64 relative bg-finance-dark border border-finance-steel/20 rounded-md">
      {/* Y-axis */}
      <div className="absolute left-10 top-4 bottom-10 w-px bg-finance-steel/30"></div>
      
      {/* X-axis */}
      <div className="absolute left-10 right-4 bottom-10 h-px bg-finance-steel/30"></div>
      
      {/* Y-axis label */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-finance-lightgray">
        Option Price
      </div>
      
      {/* X-axis label */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-finance-lightgray">
        Spot Price
      </div>
      
      {/* Data points */}
      <svg className="absolute inset-0 p-10 pb-10 pl-10" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={spotPrices.map((spot, i) => {
            const x = ((spot - minSpot) / (maxSpot - minSpot)) * 100;
            const y = 100 - ((callPrices[i] / maxPrice) * 100);
            return `${x},${y}`;
          }).join(' ')}
          stroke="#A62639"
          strokeWidth="2"
          fill="none"
        />
      </svg>
    </div>
  );
};

// Tree Node Visualization
const TreeNode = ({ 
  value, 
  optionValue,
  x, 
  y, 
  radius = 30 
}: { 
  value: number;
  optionValue: number;
  x: number;
  y: number;
  radius?: number;
}) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <circle r={radius} fill="#0F172A" stroke="#334155" strokeWidth="1" />
      <text 
        textAnchor="middle" 
        dominantBaseline="text-before-edge" 
        className="fill-finance-offwhite text-xs"
        y="-8"
      >
        S={value.toFixed(2)}
      </text>
      <text 
        textAnchor="middle" 
        dominantBaseline="text-after-edge" 
        className="fill-finance-accent text-xs"
        y="8"
      >
        C={optionValue.toFixed(2)}
      </text>
    </g>
  );
};

// Tree Edge Visualization
const TreeEdge = ({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) => {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" strokeWidth="1" />;
};

// Binomial Tree Visualization
const BinomialTreeVisualization = ({ 
  treeData,
  steps = 3
}: { 
  treeData: { assetPrices: number[][]; optionValues: number[][] };
  steps?: number;
}) => {
  const nodeRadius = 30;
  const horizontalSpacing = 120;
  const verticalSpacing = 70;
  const totalWidth = horizontalSpacing * steps;
  const totalHeight = verticalSpacing * steps;
  
  // Generate node positions
  const nodes = [];
  const edges = [];
  
  for (let i = 0; i <= steps; i++) {
    for (let j = 0; j <= i; j++) {
      const x = i * horizontalSpacing;
      const y = totalHeight / 2 - (i / 2 * verticalSpacing) + j * verticalSpacing;
      
      nodes.push({
        x,
        y,
        value: treeData.assetPrices[i][j],
        optionValue: treeData.optionValues[i][j],
      });
      
      // Add edges to previous nodes
      if (i > 0) {
        if (j < i) {
          // Down edge
          edges.push({
            x1: x,
            y1: y,
            x2: (i - 1) * horizontalSpacing,
            y2: totalHeight / 2 - ((i - 1) / 2 * verticalSpacing) + j * verticalSpacing
          });
        }
        
        if (j > 0) {
          // Up edge
          edges.push({
            x1: x,
            y1: y,
            x2: (i - 1) * horizontalSpacing,
            y2: totalHeight / 2 - ((i - 1) / 2 * verticalSpacing) + (j - 1) * verticalSpacing
          });
        }
      }
    }
  }
  
  return (
    <div className="w-full overflow-x-auto">
      <svg width={totalWidth + nodeRadius * 2} height={totalHeight + nodeRadius * 2}>
        <g transform={`translate(${nodeRadius}, ${nodeRadius})`}>
          {/* Render edges first so they're behind nodes */}
          {edges.map((edge, i) => (
            <TreeEdge key={`edge-${i}`} {...edge} />
          ))}
          
          {/* Render nodes */}
          {nodes.map((node, i) => (
            <TreeNode key={`node-${i}`} {...node} radius={nodeRadius} />
          ))}
        </g>
      </svg>
    </div>
  );
};

const BlackScholesCourse = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("content");
  const [activeSection, setActiveSection] = useState(0);
  
  // Case 1 - Simplified BS Calculator
  const [spot, setSpot] = useState(100);
  const [strike, setStrike] = useState(100);
  const [volatility, setVolatility] = useState(0.2);
  const [showResult, setShowResult] = useState(false);
  const simplifiedResult = simplifiedBlackScholes(spot, strike, volatility);
  
  // Case 2 - Sensitivity Analysis
  const [spotCase2, setSpotCase2] = useState(100);
  const [strikeCase2, setStrikeCase2] = useState(100);
  const [volCase2, setVolCase2] = useState(0.2);
  
  // Generate data points for the chart
  const spotPrices = Array.from({ length: 21 }, (_, i) => 70 + i * 3);
  const callPrices = spotPrices.map(s => 
    blackScholes(s, strikeCase2, 1, 0, 0, volCase2, 'call').price
  );
  
  // Case 3 - Binomial vs BS
  const binomialResult = binomialOptionPricing(spot, strike, volatility, 3);
  const bsResult = blackScholes(spot, strike, 1, 0, 0, volatility, 'call').price;
  const priceDifference = Math.abs(binomialResult.price - bsResult);
  const percentDiff = (priceDifference / bsResult) * 100;
  
  // Calculate course progress
  const progress = Math.max(10, Math.min(100, activeSection * 25));
  
  // Course content sections
  const sections = [
    {
      id: "intro",
      title: "Introduction au modèle de Black-Scholes",
      icon: BookOpen,
    },
    {
      id: "case1",
      title: "Cas 1 - Calcul manuel simplifié",
      icon: Calculator,
    },
    {
      id: "case2",
      title: "Cas 2 - Étude de sensibilité",
      icon: Sliders,
    },
    {
      id: "case3",
      title: "Cas 3 - Comparaison modèle binomial",
      icon: GitFork,
    },
    {
      id: "solution",
      title: "Corrigé et synthèse",
      icon: FileText,
    },
  ];
  
  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite">
      <Navbar />
      
      <main className="flex-1 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-finance-lightgray mb-8">
            <Link to="/" className="hover:text-finance-accent">
              {t('navbar.courses')}
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <Link to="/courses" className="hover:text-finance-accent">
              {t('courses.fundamentals')}
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-finance-offwhite">Black-Scholes</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="finance-card p-6 mb-6">
                <h2 className="text-xl font-medium mb-4">{t('coursesPage.fundamentals.blackScholes.title')}</h2>
                <p className="text-finance-lightgray text-sm mb-6">
                  {t('coursesPage.fundamentals.blackScholes.description')}
                </p>
                
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-finance-lightgray">Progression</span>
                    <span className="text-sm text-finance-accent">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2 bg-finance-steel/20" />
                </div>
                
                <div className="space-y-3">
                  {sections.map((section, index) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(index)}
                      className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                        activeSection === index 
                          ? 'bg-finance-burgundy/20 border border-finance-burgundy/30'
                          : 'hover:bg-finance-steel/10'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          {index < activeSection && (
                            <div className="w-5 h-5 rounded-full bg-finance-accent/20 flex items-center justify-center mr-3">
                              <Check className="h-3 w-3 text-finance-accent" />
                            </div>
                          )}
                          {index === activeSection && (
                            <div className="w-5 h-5 mr-3">
                              <section.icon className="h-5 w-5 text-finance-accent" />
                            </div>
                          )}
                          {index > activeSection && (
                            <div className="w-5 h-5 mr-3">
                              <section.icon className="h-5 w-5 text-finance-lightgray" />
                            </div>
                          )}
                          <span className={activeSection === index ? 'text-finance-accent' : 'text-finance-offwhite'}>
                            {section.title}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="mt-8 pt-6 border-t border-finance-steel/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <GraduationCap className="h-5 w-5 text-finance-accent mr-2" />
                      <span className="text-finance-offwhite font-medium">Niveau</span>
                    </div>
                    <Badge variant="achievement">{t('coursesPage.levels.beginner')}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-finance-accent mr-2" />
                      <span className="text-finance-offwhite font-medium">Durée estimée</span>
                    </div>
                    <span className="text-finance-lightgray">2-3 heures</span>
                  </div>
                </div>
              </div>
              
              <div className="finance-card p-6">
                <h3 className="text-lg font-medium mb-4">Ressources</h3>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-start p-3 rounded bg-finance-steel/10 hover:bg-finance-steel/20 transition-colors"
                  >
                    <Download className="h-5 w-5 text-finance-accent mr-3" />
                    <div className="text-left">
                      <span className="text-finance-offwhite block">Fiche synthèse</span>
                      <span className="text-xs text-finance-lightgray">PDF, 1.2 MB</span>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-start p-3 rounded bg-finance-steel/10 hover:bg-finance-steel/20 transition-colors"
                  >
                    <Code className="h-5 w-5 text-finance-accent mr-3" />
                    <div className="text-left">
                      <span className="text-finance-offwhite block">Code source</span>
                      <span className="text-xs text-finance-lightgray">Python / JavaScript</span>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-start p-3 rounded bg-finance-steel/10 hover:bg-finance-steel/20 transition-colors"
                  >
                    <Calculator className="h-5 w-5 text-finance-accent mr-3" />
                    <div className="text-left">
                      <span className="text-finance-offwhite block">Calculatrice BS complète</span>
                      <span className="text-xs text-finance-lightgray">Outil interactif</span>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Main content */}
            <div className="lg:col-span-2">
              <div className="finance-card overflow-hidden">
                <Tabs defaultValue="content" value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="border-b border-finance-steel/10">
                    <TabsList className="p-0 bg-transparent">
                      <TabsTrigger 
                        value="content" 
                        className="py-4 px-6 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-finance-accent rounded-none data-[state=active]:shadow-none"
                      >
                        Contenu
                      </TabsTrigger>
                      <TabsTrigger 
                        value="calculator" 
                        className="py-4 px-6 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-finance-accent rounded-none data-[state=active]:shadow-none"
                      >
                        Calculatrice
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="content" className="m-0">
                    <div className="p-6">
                      {/* Section 1: Introduction */}
                      {activeSection === 0 && (
                        <div>
                          <h2 className="text-xl font-medium mb-4">Introduction au modèle de Black-Scholes</h2>
                          
                          <div className="mb-6">
                            <p className="text-finance-lightgray mb-4">
                              Le modèle de Black-Scholes est l'un des piliers de la finance quantitative. Développé en 1973 
                              par Fischer Black et Myron Scholes, il permet d'évaluer le prix théorique d'une option européenne.
                            </p>
                            
                            <div className="p-4 bg-finance-charcoal/30 rounded-md font-mono text-sm my-6 overflow-x-auto">
                              <code className="text-finance-offwhite">
                                C(S,t) = SN(d₁) - Ke^(-rT)N(d₂)
                              </code>
                            </div>
                            
                            <p className="text-finance-lightgray mb-6">
                              où d₁ = [ln(S/K) + (r + σ²/2)T] / (σ√T) et d₂ = d₁ - σ√T
                            </p>
                          </div>
                          
                          <h3 className="text-lg font-medium mb-3">Paramètres du modèle</h3>
                          
                          <div className="overflow-x-auto mb-6">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-finance-charcoal/50">
                                  <th className="py-2 px-4 text-left border-b border-finance-steel/20">Paramètre</th>
                                  <th className="py-2 px-4 text-left border-b border-finance-steel/20">Symbole</th>
                                  <th className="py-2 px-4 text-left border-b border-finance-steel/20">Description</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="py-2 px-4 border-b border-finance-steel/10">Prix du sous-jacent</td>
                                  <td className="py-2 px-4 border-b border-finance-steel/10 font-mono">S</td>
                                  <td className="py-2 px-4 border-b border-finance-steel/10">Prix actuel de l'actif sous-jacent</td>
                                </tr>
                                <tr>
                                  <td className="py-2 px-4 border-b border-finance-steel/10">Prix d'exercice</td>
                                  <td className="py-2 px-4 border-b border-finance-steel/10 font-mono">K</td>
                                  <td className="py-2 px-4 border-b border-finance-steel/10">Prix auquel l'option peut être exercée</td>
                                </tr>
                                <tr>
                                  <td className="py-2 px-4 border-b border-finance-steel/10">Volatilité</td>
                                  <td className="py-2 px-4 border-b border-finance-steel/10 font-mono">σ</td>
                                  <td className="py-2 px-4 border-b border-finance-steel/10">Écart-type annualisé des rendements</td>
                                </tr>
                                <tr>
                                  <td className="py-2 px-4 border-b border-finance-steel/10">Taux sans risque</td>
                                  <td className="py-2 px-4 border-b border-finance-steel/10 font-mono">r</td>
                                  <td className="py-2 px-4 border-b border-finance-steel/10">Taux d'intérêt annualisé sans risque</td>
                                </tr>
                                <tr>
                                  <td className="py-2 px-4 border-b border-finance-steel/10">Maturité</td>
                                  <td className="py-2 px-4 border-b border-finance-steel/10 font-mono">T</td>
                                  <td className="py-2 px-4 border-b border-finance-steel/10">Temps restant jusqu'à l'expiration (en années)</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          
                          <h3 className="text-lg font-medium mb-3">Principales hypothèses</h3>
                          
                          <ul className="space-y-2 mb-6 text-finance-lightgray">
                            <li className="flex items-start">
                              <span className="h-1.5 w-1.5 rounded-full bg-finance-accent mt-2 mr-2"></span>
                              <span>Le cours du sous-jacent suit un mouvement brownien géométrique</span>
                            </li>
                            <li className="flex items-start">
                              <span className="h-1.5 w-1.5 rounded-full bg-finance-accent mt-2 mr-2"></span>
                              <span>Volatilité et taux d'intérêt constants</span>
                            </li>
                            <li className="flex items-start">
                              <span className="h-1.5 w-1.5 rounded-full bg-finance-accent mt-2 mr-2"></span>
                              <span>Pas de frais de transaction ni d'impôts</span>
                            </li>
                            <li className="flex items-start">
                              <span className="h-1.5 w-1.5 rounded-full bg-finance-accent mt-2 mr-2"></span>
                              <span>Marché liquide et continu</span>
                            </li>
                            <li className="flex items-start">
                              <span className="h-1.5 w-1.5 rounded-full bg-finance-accent mt-2 mr-2"></span>
                              <span>Pas de dividendes (dans le modèle original)</span>
                            </li>
                          </ul>
                          
                          <div className="finance-card p-4 mb-6 bg-finance-burgundy/10">
                            <h4 className="text-finance-offwhite font-medium mb-2">Point clé</h4>
                            <p className="text-sm text-finance-lightgray">
                              Le modèle de Black-Scholes est fondé sur le principe d'absence d'opportunité d'arbitrage. 
                              Il repose sur l'idée qu'un portefeuille sans risque doit générer le taux sans risque.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Section 2: Case 1 - Simplified BS */}
                      {activeSection === 1 && (
                        <div>
                          <h2 className="text-xl font-medium mb-4">Cas 1 - Calcul manuel simplifié d'un call</h2>
                          
                          <p className="text-finance-lightgray mb-6">
                            Dans ce cas simplifié, nous allons calculer le prix d'une option d'achat (call) avec les hypothèses
                            suivantes : taux sans risque r = 0, maturité T = 1 an, et pas de dividendes.
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="finance-card p-4">
                              <h3 className="text-lg font-medium mb-4">Paramètres</h3>
                              
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm text-finance-lightgray block mb-1">Prix du sous-jacent (S)</label>
                                  <Input
                                    type="number"
                                    value={spot}
                                    onChange={(e) => setSpot(parseFloat(e.target.value) || 0)}
                                    min="1"
                                    max="1000"
                                    className="w-full bg-finance-charcoal/50 border-finance-steel/30"
                                  />
                                </div>
                                
                                <div>
                                  <label className="text-sm text-finance-lightgray block mb-1">Prix d'exercice (K)</label>
                                  <Input
                                    type="number"
                                    value={strike}
                                    onChange={(e) => setStrike(parseFloat(e.target.value) || 0)}
                                    min="1"
                                    max="1000"
                                    className="w-full bg-finance-charcoal/50 border-finance-steel/30"
                                  />
                                </div>
                                
                                <div>
                                  <label className="text-sm text-finance-lightgray block mb-1">Volatilité (σ)</label>
                                  <Input
                                    type="number"
                                    value={volatility}
                                    onChange={(e) => setVolatility(parseFloat(e.target.value) || 0)}
                                    min="0.01"
                                    max="1"
                                    step="0.01"
                                    className="w-full bg-finance-charcoal/50 border-finance-steel/30"
                                  />
                                </div>
                                
                                <div className="pt-2">
                                  <Button 
                                    variant="finance"
                                    className="w-full"
                                    onClick={() => setShowResult(true)}
                                  >
                                    Calculer le prix
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            <div className="finance-card p-4">
                              <h3 className="text-lg font-medium mb-4">Résultat du calcul</h3>
                              
                              {showResult ? (
                                <div className="space-y-4">
                                  <div className="p-3 bg-finance-charcoal/50 rounded-md">
                                    <p className="text-sm text-finance-lightgray mb-1">Étape 1: Calcul de d₁</p>
                                    <div className="font-mono text-finance-offwhite">
                                      d₁ = {simplifiedResult.d1.toFixed(4)}
                                    </div>
                                  </div>
                                  
                                  <div className="p-3 bg-finance-charcoal/50 rounded-md">
                                    <p className="text-sm text-finance-lightgray mb-1">Étape 2: Calcul de d₂</p>
                                    <div className="font-mono text-finance-offwhite">
                                      d₂ = {simplifiedResult.d2.toFixed(4)}
                                    </div>
                                  </div>
                                  
                                  <div className="p-3 bg-finance-charcoal/50 rounded-md">
                                    <p className="text-sm text-finance-lightgray mb-1">Étape 3: Calcul de N(d₁) et N(d₂)</p>
                                    <div className="font-mono text-finance-offwhite">
                                      N(d₁) = {simplifiedResult.Nd1.toFixed(4)}
                                      <br />
                                      N(d₂) = {simplifiedResult.Nd2.toFixed(4)}
                                    </div>
                                  </div>
                                  
                                  <div className="p-3 bg-finance-accent/20 rounded-md">
                                    <p className="text-sm text-finance-lightgray mb-1">Prix du call</p>
                                    <div className="font-mono text-xl text-finance-accent">
                                      {simplifiedResult.callPrice.toFixed(4)}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center h-full text-finance-lightgray">
                                  <Calculator className="h-12 w-12 text-finance-steel/50 mb-3" />
                                  <p>Entrez les paramètres et cliquez sur "Calculer le prix"</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="finance-card p-4 mb-6 bg-finance-charcoal/30">
                            <h4 className="text-finance-offwhite font-medium mb-2">Formules simplifiées</h4>
                            <p className="text-sm text-finance-lightgray mb-3">
                              Pour r = 0 et T = 1, les formules de Black-Scholes deviennent:
                            </p>
                            <div className="p-3 bg-finance-dark rounded-md font-mono text-sm overflow-x-auto">
                              <code className="text-finance-offwhite">
                                d₁ = [ln(S/K) + (σ²/2)] / σ
                                <br />
                                d₂ = d₁ - σ
                                <br />
                                Call = S·N(d₁) - K·N(d₂)
                              </code>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Section 3: Case 2 - Sensitivity Study */}
                      {activeSection === 2 && (
                        <div>
                          <h2 className="text-xl font-medium mb-4">Cas 2 - Étude de sensibilité</h2>
                          
                          <p className="text-finance-lightgray mb-6">
                            Explorez comment le prix d'une option call évolue en fonction des différents paramètres du modèle.
                            Ajustez les valeurs ci-dessous pour voir l'impact sur le graphique.
                          </p>
                          
                          <div className="finance-card p-4 mb-6">
                            <h3 className="text-lg font-medium mb-4">Paramètres de l'analyse de sensibilité</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div>
                                <label className="text-sm text-finance-lightgray block mb-2">
                                  Prix du sous-jacent (S): {spotCase2}
                                </label>
                                <Slider
                                  value={[spotCase2]}
                                  min={50}
                                  max={150}
                                  step={1}
                                  onValueChange={(value) => setSpotCase2(value[0])}
                                  className="mb-6"
                                />
                              </div>
                              
                              <div>
                                <label className="text-sm text-finance-lightgray block mb-2">
                                  Prix d'exercice (K): {strikeCase2}
                                </label>
                                <Slider
                                  value={[strikeCase2]}
                                  min={50}
                                  max={150}
                                  step={1}
                                  onValueChange={(value) => setStrikeCase2(value[0])}
                                  className="mb-6"
                                />
                              </div>
                              
                              <div>
                                <label className="text-sm text-finance-lightgray block mb-2">
                                  Volatilité (σ): {volCase2.toFixed(2)}
                                </label>
                                <Slider
                                  value={[volCase2 * 100]}
                                  min={10}
                                  max={50}
                                  step={1}
                                  onValueChange={(value) => setVolCase2(value[0] / 100)}
                                  className="mb-6"
                                />
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              <p className="text-sm text-finance-lightgray mb-3">
                                Prix du call pour les paramètres actuels:
                              </p>
                              <div className="font-mono text-xl text-finance-accent">
                                {blackScholes(spotCase2, strikeCase2, 1, 0, 0, volCase2, 'call').price.toFixed(4)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="finance-card p-4 mb-6">
                            <h3 className="text-lg font-medium mb-3">Graphique de sensibilité</h3>
                            <p className="text-sm text-finance-lightgray mb-4">
                              Ce graphique montre l'évolution du prix de l'option call en fonction du prix du sous-jacent.
                            </p>
                            
                            <PriceChart spotPrices={spotPrices} callPrices={callPrices} />
                            
                            <div className="mt-4 grid grid-cols-2 gap-4">
                              <div className="finance-card p-3 bg-finance-steel/10">
                                <p className="text-sm text-finance-lightgray mb-1">
                                  Prix minimum:
                                </p>
                                <p className="font-mono text-finance-offwhite">
                                  {Math.min(...callPrices).toFixed(2)} à S = {spotPrices[callPrices.indexOf(Math.min(...callPrices))]}
                                </p>
                              </div>
                              
                              <div className="finance-card p-3 bg-finance-steel/10">
                                <p className="text-sm text-finance-lightgray mb-1">
                                  Prix maximum:
                                </p>
                                <p className="font-mono text-finance-offwhite">
                                  {Math.max(...callPrices).toFixed(2)} à S = {spotPrices[callPrices.indexOf(Math.max(...callPrices))]}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="finance-card p-4 mb-6 bg-finance-burgundy/10">
                            <h4 className="text-finance-offwhite font-medium mb-2">Observations clés</h4>
                            <ul className="space-y-2 text-sm text-finance-lightgray">
                              <li className="flex items-start">
                                <span className="h-1.5 w-1.5 rounded-full bg-finance-accent mt-2 mr-2"></span>
                                <span>Le prix du call augmente avec le prix du sous-jacent (S).</span>
                              </li>
                              <li className="flex items-start">
                                <span className="h-1.5 w-1.5 rounded-full bg-finance-accent mt-2 mr-2"></span>
                                <span>Le prix du call diminue lorsque le prix d'exercice (K) augmente.</span>
                              </li>
                              <li className="flex items-start">
                                <span className="h-1.5 w-1.5 rounded-full bg-finance-accent mt-2 mr-2"></span>
                                <span>Une volatilité (σ) plus élevée augmente le prix de l'option, reflétant une plus grande incertitude.</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      )}
                      
                      {/* Section 4: Case 3 - Binomial vs BS */}
                      {activeSection === 3 && (
                        <div>
                          <h2 className="text-xl font-medium mb-4">Cas 3 - Comparaison avec le modèle binomial</h2>
                          
                          <p className="text-finance-lightgray mb-6">
                            Comparons maintenant le prix obtenu par le modèle de Black-Scholes avec celui obtenu par un modèle
                            binomial à 3 pas. Le modèle binomial est une approche discrète qui converge vers Black-Scholes
                            lorsque le nombre de pas augmente.
                          </p>
                          
                          <div className="finance-card p-4 mb-6">
                            <h3 className="text-lg font-medium mb-3">Arbre binomial (3 pas)</h3>
                            <p className="text-sm text-finance-lightgray mb-4">
                              Cet arbre représente l'évolution possible du prix du sous-jacent et de l'option
                              selon un modèle binomial à 3 pas.
                            </p>
                            
                            <BinomialTreeVisualization treeData={binomialResult.treeData} steps={3} />
                            
                            <div className="mt-6 space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="finance-card p-3 bg-finance-steel/10">
                                  <p className="text-sm text-finance-lightgray mb-1">Facteur de hausse (u):</p>
                                  <p className="font-mono text-finance-offwhite">{binomialResult.u.toFixed(4)}</p>
                                </div>
                                
                                <div className="finance-card p-3 bg-finance-steel/10">
                                  <p className="text-sm text-finance-lightgray mb-1">Facteur de baisse (d):</p>
                                  <p className="font-mono text-finance-offwhite">{binomialResult.d.toFixed(4)}</p>
                                </div>
                              </div>
                              
                              <div className="finance-card p-3 bg-finance-steel/10">
                                <p className="text-sm text-finance-lightgray mb-1">Probabilité risque-neutre (p):</p>
                                <p className="font-mono text-finance-offwhite">{binomialResult.p.toFixed(4)}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="finance-card p-4 mb-6">
                            <h3 className="text-lg font-medium mb-3">Comparaison des prix</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                              <div className="finance-card p-4 bg-finance-steel/10">
                                <h4 className="text-finance-offwhite font-medium mb-2">Modèle binomial (3 pas)</h4>
                                <div className="font-mono text-xl text-finance-accent">
                                  {binomialResult.price.toFixed(4)}
                                </div>
                              </div>
                              
                              <div className="finance-card p-4 bg-finance-steel/10">
                                <h4 className="text-finance-offwhite font-medium mb-2">Modèle Black-Scholes</h4>
                                <div className="font-mono text-xl text-finance-accent">
                                  {bsResult.toFixed(4)}
                                </div>
                              </div>
                            </div>
                            
                            <div className="finance-card p-4 bg-finance-burgundy/10">
                              <h4 className="text-finance-offwhite font-medium mb-2">Différence entre les modèles</h4>
                              <div className="mb-2">
                                <span className="text-sm text-finance-lightgray">Différence absolue: </span>
                                <span className="font-mono text-finance-offwhite">{priceDifference.toFixed(4)}</span>
                              </div>
                              <div>
                                <span className="text-sm text-finance-lightgray">Différence relative: </span>
                                <span className="font-mono text-finance-offwhite">{percentDiff.toFixed(2)}%</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="finance-card p-4 mb-6 bg-finance-charcoal/30">
                            <h4 className="text-finance-offwhite font-medium mb-2">Interpretation</h4>
                            <p className="text-sm text-finance-lightgray mb-3">
                              La différence entre les deux modèles s'explique par la discrétisation du temps dans le modèle binomial.
                              Avec seulement 3 pas, nous observons une erreur d'approximation qui diminuerait si on augmentait le nombre de pas.
                            </p>
                            <p className="text-sm text-finance-lightgray">
                              En théorie, lorsque le nombre de pas tend vers l'infini, le prix du modèle binomial converge vers
                              celui du modèle de Black-Scholes, qui est un modèle à temps continu.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Section 5: Solutions and Summary */}
                      {activeSection === 4 && (
                        <div>
                          <h2 className="text-xl font-medium mb-4">Corrigé et synthèse</h2>
                          
                          <p className="text-finance-lightgray mb-6">
                            Cette section présente un résumé complet des concepts clés et des résultats obtenus
                            dans les différents cas étudiés.
                          </p>
                          
                          <Accordion type="single" collapsible className="mb-6">
                            <AccordionItem value="case1">
                              <AccordionTrigger className="text-finance-offwhite hover:text-finance-accent">
                                Cas 1 - Calcul manuel simplifié
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="p-4 bg-finance-charcoal/30 rounded-md">
                                  <h4 className="text-finance-offwhite font-medium mb-3">Paramètres standard</h4>
                                  <p className="text-sm text-finance-lightgray mb-2">
                                    Pour S = 100, K = 100, σ = 0.2, r = 0, T = 1:
                                  </p>
                                  <ul className="space-y-2 text-sm font-mono">
                                    <li><span className="text-finance-lightgray">d₁ = </span>0.1000</li>
                                    <li><span className="text-finance-lightgray">d₂ = </span>-0.1000</li>
                                    <li><span className="text-finance-lightgray">N(d₁) = </span>0.5398</li>
                                    <li><span className="text-finance-lightgray">N(d₂) = </span>0.4602</li>
                                    <li><span className="text-finance-lightgray">Prix call = </span>7.9651</li>
                                  </ul>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                            
                            <AccordionItem value="case2">
                              <AccordionTrigger className="text-finance-offwhite hover:text-finance-accent">
                                Cas 2 - Étude de sensibilité
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-4">
                                  <div className="p-4 bg-finance-charcoal/30 rounded-md">
                                    <h4 className="text-finance-offwhite font-medium mb-2">Effet du prix du sous-jacent (S)</h4>
                                    <p className="text-sm text-finance-lightgray">
                                      Une augmentation du prix du sous-jacent entraîne une augmentation du prix de l'option call.
                                      Cette sensibilité est mesurée par le Delta, qui représente la pente de la courbe du prix de
                                      l'option par rapport au prix du sous-jacent.
                                    </p>
                                  </div>
                                  
                                  <div className="p-4 bg-finance-charcoal/30 rounded-md">
                                    <h4 className="text-finance-offwhite font-medium mb-2">Effet de la volatilité (σ)</h4>
                                    <p className="text-sm text-finance-lightgray">
                                      Une augmentation de la volatilité entraîne toujours une augmentation du prix des options,
                                      qu'il s'agisse d'un call ou d'un put. Plus l'incertitude est grande, plus l'option a de
                                      valeur pour son détenteur.
                                    </p>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                            
                            <AccordionItem value="case3">
                              <AccordionTrigger className="text-finance-offwhite hover:text-finance-accent">
                                Cas 3 - Comparaison modèle binomial
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="p-4 bg-finance-charcoal/30 rounded-md">
                                  <h4 className="text-finance-offwhite font-medium mb-2">Convergence du modèle binomial</h4>
                                  <p className="text-sm text-finance-lightgray mb-4">
                                    Le modèle binomial avec 3 pas donne une approximation raisonnable du prix Black-Scholes.
                                    L'erreur typique pour 3 pas est inférieure à 1%.
                                  </p>
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="bg-finance-steel/10">
                                        <th className="py-2 px-3 text-left">Nombre de pas</th>
                                        <th className="py-2 px-3 text-left">Erreur typique</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        <td className="py-1 px-3 border-t border-finance-steel/5">1</td>
                                        <td className="py-1 px-3 border-t border-finance-steel/5">~5-10%</td>
                                      </tr>
                                      <tr>
                                        <td className="py-1 px-3 border-t border-finance-steel/5">3</td>
                                        <td className="py-1 px-3 border-t border-finance-steel/5">~1-2%</td>
                                      </tr>
                                      <tr>
                                        <td className="py-1 px-3 border-t border-finance-steel/5">10</td>
                                        <td className="py-1 px-3 border-t border-finance-steel/5">~0.5%</td>
                                      </tr>
                                      <tr>
                                        <td className="py-1 px-3 border-t border-finance-steel/5">50</td>
                                        <td className="py-1 px-3 border-t border-finance-steel/5">~0.1%</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                          
                          <h3 className="text-lg font-medium mb-3">Mémo final - Formules importantes</h3>
                          <div className="finance-card p-4 mb-6 font-mono text-sm overflow-x-auto">
                            <h4 className="text-finance-offwhite font-medium mb-2">Formule de Black-Scholes pour un call</h4>
                            <code className="text-finance-lightgray">
                              C(S,t) = SN(d₁) - Ke^(-rT)N(d₂)
                              <br /><br />
                              d₁ = [ln(S/K) + (r + σ²/2)T] / (σ√T)
                              <br />
                              d₂ = d₁ - σ√T
                            </code>
                            
                            <h4 className="text-finance-offwhite font-medium mt-4 mb-2">Greeks</h4>
                            <code className="text-finance-lightgray">
                              Delta = N(d₁)
                              <br />
                              Gamma = n(d₁) / (S·σ·√T)
                              <br />
                              Vega = S·√T·n(d₁)
                              <br />
                              Theta = -(S·σ·n(d₁)) / (2·√T) - r·K·e^(-rT)·N(d₂)
                              <br />
                              Rho = K·T·e^(-rT)·N(d₂)
                            </code>
                          </div>
                          
                          <div className="flex justify-between">
                            <Button 
                              variant="outline" 
                              className="flex items-center"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Télécharger la fiche synthèse
                            </Button>
                            
                            <Button
                              variant="finance"
                              onClick={() => setActiveTab("calculator")}
                              className="flex items-center"
                            >
                              <Calculator className="mr-2 h-4 w-4" />
                              Essayer la calculatrice
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center pt-6 mt-6 border-t border-finance-steel/10">
                        <Button 
                          variant="outline"
                          onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                          disabled={activeSection === 0}
                          className="flex items-center"
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Précédent
                        </Button>
                        <Button 
                          variant="finance"
                          onClick={() => setActiveSection(Math.min(sections.length - 1, activeSection + 1))}
                          disabled={activeSection === sections.length - 1}
                          className="flex items-center"
                        >
                          Suivant <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="calculator" className="m-0 p-6">
                    <div className="mb-6">
                      <h2 className="text-xl font-medium mb-2">Calculatrice Black-Scholes</h2>
                      <p className="text-finance-lightgray">
                        Utilisez cette calculatrice interactive pour évaluer les options européennes avec le modèle de Black-Scholes
                        et calculer les Greeks correspondants.
                      </p>
                    </div>
                    
                    <div className="finance-card p-0 overflow-hidden">
                      <div className="p-6 border-b border-finance-steel/10">
                        <h3 className="text-lg font-medium mb-4">Calculatrice complète</h3>
                      </div>
                      
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <Button 
                            variant="finance"
                            size="sm"
                            onClick={() => setActiveTab("content")}
                            className="flex items-center"
                          >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour au cours
                          </Button>
                        </div>
                        
                        <BlackScholesCalculator />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default BlackScholesCourse;
