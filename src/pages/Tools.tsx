
import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { 
  Calculator, 
  LineChart, 
  ArrowRight, 
  ChevronRight,
  ChevronDown,
  Info
} from "lucide-react";

// Simplified Black-Scholes calculator component
const BlackScholesCalculator = () => {
  const [spot, setSpot] = useState<number>(100);
  const [strike, setStrike] = useState<number>(100);
  const [interestRate, setInterestRate] = useState<number>(0.05);
  const [volatility, setVolatility] = useState<number>(0.2);
  const [timeToMaturity, setTimeToMaturity] = useState<number>(1);
  const [callPrice, setCallPrice] = useState<number>(0);
  const [putPrice, setPutPrice] = useState<number>(0);
  const [delta, setDelta] = useState<number>(0);
  const [gamma, setGamma] = useState<number>(0);
  const [vega, setVega] = useState<number>(0);
  const [theta, setTheta] = useState<number>(0);
  
  const calculate = () => {
    // This is just a placeholder for the actual Black-Scholes calculation
    // In a real implementation, this would calculate the option prices and Greeks
    
    // Simple Black-Scholes formula approximation for demonstration
    const d1 = (Math.log(spot / strike) + (interestRate + volatility * volatility / 2) * timeToMaturity) / (volatility * Math.sqrt(timeToMaturity));
    const d2 = d1 - volatility * Math.sqrt(timeToMaturity);
    
    // Standard normal CDF approximation
    const normCDF = (x: number) => {
      const t = 1 / (1 + 0.2316419 * Math.abs(x));
      const d = 0.3989423 * Math.exp(-x * x / 2);
      const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
      return x > 0 ? 1 - p : p;
    };
    
    // Call price
    const calculatedCallPrice = spot * normCDF(d1) - strike * Math.exp(-interestRate * timeToMaturity) * normCDF(d2);
    setCallPrice(parseFloat(calculatedCallPrice.toFixed(2)));
    
    // Put price
    const calculatedPutPrice = strike * Math.exp(-interestRate * timeToMaturity) * normCDF(-d2) - spot * normCDF(-d1);
    setPutPrice(parseFloat(calculatedPutPrice.toFixed(2)));
    
    // Greeks
    setDelta(parseFloat(normCDF(d1).toFixed(4)));
    setGamma(parseFloat((Math.exp(-d1 * d1 / 2) / (spot * volatility * Math.sqrt(timeToMaturity) * Math.sqrt(2 * Math.PI))).toFixed(4)));
    setVega(parseFloat((spot * Math.sqrt(timeToMaturity) * Math.exp(-d1 * d1 / 2) / Math.sqrt(2 * Math.PI) / 100).toFixed(4)));
    const thetaValue = (-(spot * volatility * Math.exp(-d1 * d1 / 2)) / (2 * Math.sqrt(timeToMaturity) * Math.sqrt(2 * Math.PI)) - interestRate * strike * Math.exp(-interestRate * timeToMaturity) * normCDF(d2)) / 365;
    setTheta(parseFloat(thetaValue.toFixed(4)));
  };

  return (
    <div className="finance-card p-6">
      <h3 className="text-xl font-medium mb-6">Calculatrice Black-Scholes</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="space-y-4">
            <div>
              <label className="block text-finance-lightgray text-sm mb-1">Prix spot</label>
              <input
                type="number"
                value={spot}
                onChange={(e) => setSpot(parseFloat(e.target.value))}
                className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
              />
            </div>
            
            <div>
              <label className="block text-finance-lightgray text-sm mb-1">Prix d'exercice</label>
              <input
                type="number"
                value={strike}
                onChange={(e) => setStrike(parseFloat(e.target.value))}
                className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
              />
            </div>
            
            <div>
              <label className="block text-finance-lightgray text-sm mb-1">Taux d'intérêt (décimal)</label>
              <input
                type="number"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(parseFloat(e.target.value))}
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
              <label className="block text-finance-lightgray text-sm mb-1">Temps jusqu'à maturité (années)</label>
              <input
                type="number"
                step="0.01"
                value={timeToMaturity}
                onChange={(e) => setTimeToMaturity(parseFloat(e.target.value) || 0)}
                className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
              />
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
              <p className="text-finance-lightgray text-sm mb-1">Prix Call</p>
              <p className="text-2xl font-medium text-finance-offwhite">{callPrice}</p>
            </div>
            
            <div className="finance-card p-4">
              <p className="text-finance-lightgray text-sm mb-1">Prix Put</p>
              <p className="text-2xl font-medium text-finance-offwhite">{putPrice}</p>
            </div>
          </div>
          
          <h4 className="text-finance-offwhite font-medium mb-4">Greeks</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="finance-card p-3">
              <p className="text-finance-lightgray text-sm mb-1">Delta</p>
              <p className="text-lg font-medium text-finance-offwhite">{delta}</p>
            </div>
            
            <div className="finance-card p-3">
              <p className="text-finance-lightgray text-sm mb-1">Gamma</p>
              <p className="text-lg font-medium text-finance-offwhite">{gamma}</p>
            </div>
            
            <div className="finance-card p-3">
              <p className="text-finance-lightgray text-sm mb-1">Vega</p>
              <p className="text-lg font-medium text-finance-offwhite">{vega}</p>
            </div>
            
            <div className="finance-card p-3">
              <p className="text-finance-lightgray text-sm mb-1">Theta</p>
              <p className="text-lg font-medium text-finance-offwhite">{theta}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Tool card component
const ToolCard = ({ 
  icon: Icon, 
  title, 
  description, 
  locked = false 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  locked?: boolean;
}) => (
  <div className={`finance-card p-6 ${locked ? 'opacity-60' : 'hover:border-finance-accent transition-colors duration-300'}`}>
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 rounded-md bg-finance-burgundy/10">
        <Icon className="h-6 w-6 text-finance-accent" />
      </div>
      
      {locked && (
        <span className="terminal-text text-xs px-2 py-1 bg-finance-steel/30 rounded text-finance-lightgray">
          PRO
        </span>
      )}
    </div>
    
    <h3 className="text-lg font-medium text-finance-offwhite mb-2">{title}</h3>
    <p className="text-finance-lightgray text-sm mb-4">{description}</p>
    
    <button 
      className={`flex justify-between items-center w-full p-3 rounded ${
        locked 
          ? 'bg-finance-steel/10 text-finance-lightgray cursor-not-allowed' 
          : 'bg-finance-burgundy/10 text-finance-accent hover:bg-finance-burgundy/20 transition-colors duration-300'
      }`}
    >
      <span className="text-sm font-medium">
        {locked ? "Débloquer" : "Utiliser l'outil"}
      </span>
      <ArrowRight className="h-4 w-4" />
    </button>
  </div>
);

// Volatility Surface Viewer Placeholder
const VolatilitySurfaceViewer = () => (
  <div className="finance-card p-6">
    <h3 className="text-xl font-medium mb-6">Visualiseur de Surface de Volatilité</h3>
    
    <div className="aspect-[4/3] bg-finance-charcoal rounded-lg p-4 flex flex-col items-center justify-center border border-finance-steel/30 mb-6">
      <LineChart className="h-16 w-16 text-finance-accent opacity-30 mb-4" />
      <p className="text-finance-lightgray text-sm max-w-md text-center">
        Cet outil vous permet de visualiser et d'analyser les surfaces de volatilité implicites pour différents sous-jacents.
        Sélectionnez un sous-jacent et une date pour générer la surface.
      </p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div>
        <label className="block text-finance-lightgray text-sm mb-1">Sous-jacent</label>
        <select className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite">
          <option>EUROSTOXX 50</option>
          <option>S&P 500</option>
          <option>DAX</option>
          <option>CAC 40</option>
        </select>
      </div>
      
      <div>
        <label className="block text-finance-lightgray text-sm mb-1">Date</label>
        <input
          type="date"
          className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
        />
      </div>
      
      <div>
        <label className="block text-finance-lightgray text-sm mb-1">Type de visualisation</label>
        <select className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite">
          <option>Surface 3D</option>
          <option>Courbes par maturité</option>
          <option>Heatmap</option>
        </select>
      </div>
    </div>
    
    <button className="finance-button">
      Générer la surface
    </button>
  </div>
);

const Tools = () => {
  const [activeTab, setActiveTab] = useState("calculators");
  const [activeCalculator, setActiveCalculator] = useState("blackscholes");
  
  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite">
      <Navbar />
      
      {/* Tools Header */}
      <header className="py-12 px-6 border-b border-finance-steel/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4 terminal-text">Outils de pricing</h1>
            <p className="text-finance-lightgray text-lg max-w-2xl mx-auto">
              Une suite d'outils conçus pour les professionnels des marchés financiers, 
              permettant d'évaluer et d'analyser rapidement différents instruments.
            </p>
          </div>
        </div>
      </header>
      
      {/* Tools Tabs */}
      <div className="border-b border-finance-steel/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex overflow-x-auto">
            <button 
              onClick={() => setActiveTab("calculators")}
              className={`px-6 py-4 font-medium text-sm ${
                activeTab === "calculators" 
                  ? "border-b-2 border-finance-accent text-finance-offwhite" 
                  : "border-b-2 border-transparent text-finance-lightgray hover:text-finance-offwhite"
              }`}
            >
              Calculatrices
            </button>
            <button 
              onClick={() => setActiveTab("visualizers")}
              className={`px-6 py-4 font-medium text-sm ${
                activeTab === "visualizers" 
                  ? "border-b-2 border-finance-accent text-finance-offwhite" 
                  : "border-b-2 border-transparent text-finance-lightgray hover:text-finance-offwhite"
              }`}
            >
              Visualiseurs
            </button>
            <button 
              onClick={() => setActiveTab("all")}
              className={`px-6 py-4 font-medium text-sm ${
                activeTab === "all" 
                  ? "border-b-2 border-finance-accent text-finance-offwhite" 
                  : "border-b-2 border-transparent text-finance-lightgray hover:text-finance-offwhite"
              }`}
            >
              Tous les outils
            </button>
          </div>
        </div>
      </div>
      
      {/* Tools Content */}
      <main className="flex-1 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === "calculators" && (
            <div>
              <div className="mb-8">
                <h2 className="text-xl font-medium mb-4">Calculatrices</h2>
                <div className="flex overflow-x-auto gap-2 p-1">
                  <button 
                    onClick={() => setActiveCalculator("blackscholes")}
                    className={`px-4 py-2 text-sm rounded-md whitespace-nowrap ${
                      activeCalculator === "blackscholes" 
                        ? "bg-finance-burgundy text-finance-offwhite" 
                        : "bg-finance-charcoal text-finance-lightgray hover:text-finance-offwhite"
                    }`}
                  >
                    Black-Scholes
                  </button>
                  <button 
                    onClick={() => setActiveCalculator("binomial")}
                    className={`px-4 py-2 text-sm rounded-md whitespace-nowrap ${
                      activeCalculator === "binomial" 
                        ? "bg-finance-burgundy text-finance-offwhite" 
                        : "bg-finance-charcoal text-finance-lightgray hover:text-finance-offwhite"
                    }`}
                  >
                    Binomial
                  </button>
                  <button 
                    onClick={() => setActiveCalculator("bonds")}
                    className={`px-4 py-2 text-sm rounded-md whitespace-nowrap ${
                      activeCalculator === "bonds" 
                        ? "bg-finance-burgundy text-finance-offwhite" 
                        : "bg-finance-charcoal text-finance-lightgray hover:text-finance-offwhite"
                    }`}
                  >
                    Obligations
                  </button>
                  <button 
                    onClick={() => setActiveCalculator("forwards")}
                    className={`px-4 py-2 text-sm rounded-md whitespace-nowrap ${
                      activeCalculator === "forwards" 
                        ? "bg-finance-burgundy text-finance-offwhite" 
                        : "bg-finance-charcoal text-finance-lightgray hover:text-finance-offwhite"
                    }`}
                  >
                    Forwards & Futures
                  </button>
                  <button 
                    onClick={() => setActiveCalculator("swaps")}
                    className={`px-4 py-2 text-sm rounded-md whitespace-nowrap ${
                      activeCalculator === "swaps" 
                        ? "bg-finance-burgundy text-finance-offwhite" 
                        : "bg-finance-charcoal text-finance-lightgray hover:text-finance-offwhite"
                    }`}
                  >
                    Swaps
                  </button>
                </div>
              </div>
              
              {activeCalculator === "blackscholes" && <BlackScholesCalculator />}
              {activeCalculator === "binomial" && (
                <div className="finance-card p-6 flex flex-col items-center justify-center min-h-[300px]">
                  <Calculator className="h-12 w-12 text-finance-steel mb-4" />
                  <h3 className="text-xl font-medium mb-2">Calculatrice Binomiale</h3>
                  <p className="text-finance-lightgray text-center mb-6">
                    Cette calculatrice sera disponible prochainement.
                  </p>
                  <button className="finance-button-outline">
                    Être notifié lors de la sortie
                  </button>
                </div>
              )}
            </div>
          )}
          
          {activeTab === "visualizers" && (
            <div>
              <div className="mb-8">
                <h2 className="text-xl font-medium mb-4">Visualiseurs</h2>
                <div className="flex overflow-x-auto gap-2 p-1">
                  <button 
                    onClick={() => setActiveCalculator("volsurface")}
                    className={`px-4 py-2 text-sm rounded-md whitespace-nowrap ${
                      activeCalculator === "volsurface" 
                        ? "bg-finance-burgundy text-finance-offwhite" 
                        : "bg-finance-charcoal text-finance-lightgray hover:text-finance-offwhite"
                    }`}
                  >
                    Surface de Volatilité
                  </button>
                  <button 
                    onClick={() => setActiveCalculator("yieldcurve")}
                    className={`px-4 py-2 text-sm rounded-md whitespace-nowrap ${
                      activeCalculator === "yieldcurve" 
                        ? "bg-finance-burgundy text-finance-offwhite" 
                        : "bg-finance-charcoal text-finance-lightgray hover:text-finance-offwhite"
                    }`}
                  >
                    Courbe de Taux
                  </button>
                  <button 
                    onClick={() => setActiveCalculator("greekssim")}
                    className={`px-4 py-2 text-sm rounded-md whitespace-nowrap ${
                      activeCalculator === "greekssim" 
                        ? "bg-finance-burgundy text-finance-offwhite" 
                        : "bg-finance-charcoal text-finance-lightgray hover:text-finance-offwhite"
                    }`}
                  >
                    Simulateur de Greeks
                  </button>
                </div>
              </div>
              
              {activeCalculator === "volsurface" && <VolatilitySurfaceViewer />}
            </div>
          )}
          
          {activeTab === "all" && (
            <div>
              <h2 className="text-xl font-medium mb-6">Tous les outils</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ToolCard 
                  icon={Calculator} 
                  title="Calculatrice Black-Scholes" 
                  description="Évaluez rapidement les options vanilles et obtenez les Greeks correspondants."
                />
                <ToolCard 
                  icon={Calculator} 
                  title="Modèle binomial" 
                  description="Évaluez les options avec un modèle binomial personnalisable."
                  locked={true}
                />
                <ToolCard 
                  icon={LineChart} 
                  title="Visualiseur de surface de vol" 
                  description="Explorez les surfaces de volatilité implicite pour différents sous-jacents."
                />
                <ToolCard 
                  icon={Calculator} 
                  title="Calculateur d'obligations" 
                  description="Évaluez les obligations et analysez leur sensibilité aux variations de taux."
                  locked={true}
                />
                <ToolCard 
                  icon={LineChart} 
                  title="Visualiseur de courbe de taux" 
                  description="Affichez et manipulez les courbes de taux zéro-coupon et forward."
                  locked={true}
                />
                <ToolCard 
                  icon={Calculator} 
                  title="Simulateur de Greeks" 
                  description="Simulez l'évolution des Greeks en fonction des mouvements de marché."
                  locked={true}
                />
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* FAQ Section */}
      <section className="py-12 px-6 bg-finance-charcoal/20 border-t border-finance-steel/10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center terminal-text">Questions fréquentes</h2>
          
          <div className="space-y-4">
            <div className="finance-card overflow-hidden">
              <button 
                className="flex justify-between items-center w-full p-4 text-left"
                onClick={() => {}}
              >
                <span className="font-medium">Comment sont calculés les prix dans la calculatrice Black-Scholes?</span>
                <ChevronDown className="h-5 w-5 text-finance-accent" />
              </button>
              <div className="p-4 bg-finance-steel/5 border-t border-finance-steel/10">
                <p className="text-finance-lightgray text-sm">
                  Notre calculatrice implémente la formule Black-Scholes standard pour le pricing d'options européennes.
                  Les Greeks sont calculés analytiquement à partir des dérivées partielles de la formule.
                </p>
              </div>
            </div>
            
            <div className="finance-card overflow-hidden">
              <button 
                className="flex justify-between items-center w-full p-4 text-left"
                onClick={() => {}}
              >
                <span className="font-medium">Les données de marchés utilisées sont-elles en temps réel?</span>
                <ChevronDown className="h-5 w-5 text-finance-accent" />
              </button>
              <div className="p-4 bg-finance-steel/5 border-t border-finance-steel/10">
                <p className="text-finance-lightgray text-sm">
                  Non, les visualiseurs utilisent des données de marché en différé (15 minutes) ou des données historiques de clôture.
                  Pour des données en temps réel, consultez notre offre premium.
                </p>
              </div>
            </div>
            
            <div className="finance-card overflow-hidden">
              <button 
                className="flex justify-between items-center w-full p-4 text-left"
                onClick={() => {}}
              >
                <span className="font-medium">Comment puis-je exporter les résultats?</span>
                <ChevronDown className="h-5 w-5 text-finance-accent" />
              </button>
              <div className="p-4 bg-finance-steel/5 border-t border-finance-steel/10">
                <p className="text-finance-lightgray text-sm">
                  Tous nos outils proposent des fonctionnalités d'export en CSV, Excel ou format image (PNG/SVG pour les graphiques).
                  Ces fonctionnalités sont disponibles pour les utilisateurs premium.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Subscription CTA */}
      <section className="py-12 px-6 bg-finance-charcoal/50 border-t border-finance-steel/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4 terminal-text">Accès illimité à tous les outils</h2>
          <p className="text-finance-lightgray mb-8">
            Les abonnés premium bénéficient d'un accès complet à tous nos outils de pricing et d'analyse,
            y compris les exports de données et les fonctionnalités avancées.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="finance-button text-center">
              S'abonner pour 19€/mois
            </Link>
            <Link to="/courses" className="finance-button-outline text-center">
              Découvrir la formation
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Tools;
