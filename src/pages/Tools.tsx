
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { 
  Calculator, 
  LineChart, 
  ArrowRight, 
  ChevronRight,
  ChevronDown,
  Info,
  CandlestickChart,
  Activity,
  Dices,
  Database,
  Gauge
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { safeTranslate } from "../utils/translationUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BlackScholesCalculator from "../components/tools/BlackScholesCalculator";
import BinomialCalculator from "../components/tools/BinomialCalculator";
import YieldCurveVisualizer from "../components/tools/YieldCurveVisualizer";
import GreeksSimulator from "../components/tools/GreeksSimulator";
import BondCalculator from "../components/tools/BondCalculator";
import VolatilityCalculator from "../components/tools/VolatilityCalculator";
import MonteCarloSimulator from "../components/tools/MonteCarloSimulator";
import ModelCalibration from "../components/tools/ModelCalibration";

// Tool card component
const ToolCard = ({ 
  icon: Icon, 
  title, 
  description, 
  locked = false,
  onClick
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  locked?: boolean;
  onClick?: () => void;
}) => (
  <div className={`finance-card p-6 ${locked ? 'opacity-60' : 'hover:border-finance-accent transition-colors duration-300'}`}>
    <div className="flex items-start justify-between mb-4">
      <div className="bg-finance-burgundy/20 rounded-full p-3">
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
      onClick={onClick}
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

const Tools = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("calculators");
  const [activeCalculator, setActiveCalculator] = useState("blackscholes");
  
  return (
    <>
      <Helmet>
        <title>{safeTranslate(t, 'tools.title', 'Outils')} | The Trading Lab</title>
      </Helmet>
      
      {/* Tools Header */}
      <header className="py-12 px-6 border-b border-finance-steel/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4 terminal-text">{safeTranslate(t, 'tools.header', 'Outils de pricing')}</h1>
            <p className="text-finance-lightgray text-lg max-w-2xl mx-auto">
              {safeTranslate(t, 'tools.description', 'Une suite d\'outils conçus pour les professionnels des marchés financiers, permettant d\'évaluer et d\'analyser rapidement différents instruments.')}
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
              {safeTranslate(t, 'tools.tabs.calculators', 'Calculatrices')}
            </button>
            <button 
              onClick={() => setActiveTab("visualizers")}
              className={`px-6 py-4 font-medium text-sm ${
                activeTab === "visualizers" 
                  ? "border-b-2 border-finance-accent text-finance-offwhite" 
                  : "border-b-2 border-transparent text-finance-lightgray hover:text-finance-offwhite"
              }`}
            >
              {safeTranslate(t, 'tools.tabs.visualizers', 'Visualiseurs')}
            </button>
            <button 
              onClick={() => setActiveTab("simulators")}
              className={`px-6 py-4 font-medium text-sm ${
                activeTab === "simulators" 
                  ? "border-b-2 border-finance-accent text-finance-offwhite" 
                  : "border-b-2 border-transparent text-finance-lightgray hover:text-finance-offwhite"
              }`}
            >
              {safeTranslate(t, 'tools.tabs.simulators', 'Simulateurs')}
            </button>
            <button 
              onClick={() => setActiveTab("all")}
              className={`px-6 py-4 font-medium text-sm ${
                activeTab === "all" 
                  ? "border-b-2 border-finance-accent text-finance-offwhite" 
                  : "border-b-2 border-transparent text-finance-lightgray hover:text-finance-offwhite"
              }`}
            >
              {safeTranslate(t, 'tools.tabs.all', 'Tous les outils')}
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
                <h2 className="text-xl font-medium mb-4">{safeTranslate(t, 'tools.calculatorsTitle', 'Calculatrices')}</h2>
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
                    onClick={() => setActiveCalculator("volatility")}
                    className={`px-4 py-2 text-sm rounded-md whitespace-nowrap ${
                      activeCalculator === "volatility" 
                        ? "bg-finance-burgundy text-finance-offwhite" 
                        : "bg-finance-charcoal text-finance-lightgray hover:text-finance-offwhite"
                    }`}
                  >
                    Volatilité
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
              {activeCalculator === "binomial" && <BinomialCalculator />}
              {activeCalculator === "bonds" && <BondCalculator />}
              {activeCalculator === "volatility" && <VolatilityCalculator />}
              {activeCalculator === "forwards" && (
                <div className="finance-card p-6 flex flex-col items-center justify-center min-h-[300px]">
                  <Calculator className="h-12 w-12 text-finance-steel mb-4" />
                  <h3 className="text-xl font-medium mb-2">{safeTranslate(t, 'tools.forwards.title', 'Calculatrice Forwards & Futures')}</h3>
                  <p className="text-finance-lightgray text-center mb-6">
                    {safeTranslate(t, 'tools.forwards.comingSoon', 'Cette calculatrice sera disponible prochainement.')}
                  </p>
                  <button className="finance-button-outline">
                    {safeTranslate(t, 'tools.notifyMe', 'Être notifié lors de la sortie')}
                  </button>
                </div>
              )}
              {activeCalculator === "swaps" && (
                <div className="finance-card p-6 flex flex-col items-center justify-center min-h-[300px]">
                  <Calculator className="h-12 w-12 text-finance-steel mb-4" />
                  <h3 className="text-xl font-medium mb-2">{safeTranslate(t, 'tools.swaps.title', 'Calculatrice de Swaps')}</h3>
                  <p className="text-finance-lightgray text-center mb-6">
                    {safeTranslate(t, 'tools.swaps.comingSoon', 'Cette calculatrice sera disponible prochainement.')}
                  </p>
                  <button className="finance-button-outline">
                    {safeTranslate(t, 'tools.notifyMe', 'Être notifié lors de la sortie')}
                  </button>
                </div>
              )}
            </div>
          )}
          
          {activeTab === "visualizers" && (
            <div>
              <div className="mb-8">
                <h2 className="text-xl font-medium mb-4">{safeTranslate(t, 'tools.visualizersTitle', 'Visualiseurs')}</h2>
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
                  <button 
                    onClick={() => setActiveCalculator("modelcalibration")}
                    className={`px-4 py-2 text-sm rounded-md whitespace-nowrap ${
                      activeCalculator === "modelcalibration" 
                        ? "bg-finance-burgundy text-finance-offwhite" 
                        : "bg-finance-charcoal text-finance-lightgray hover:text-finance-offwhite"
                    }`}
                  >
                    Calibration de Modèles
                  </button>
                </div>
              </div>
              
              {activeCalculator === "volsurface" && (
                <div className="finance-card p-6 flex flex-col items-center justify-center min-h-[300px]">
                  <LineChart className="h-12 w-12 text-finance-steel mb-4" />
                  <h3 className="text-xl font-medium mb-2">{safeTranslate(t, 'tools.volSurface.title', 'Visualiseur de Surface de Volatilité')}</h3>
                  <p className="text-finance-lightgray text-center mb-6">
                    {safeTranslate(t, 'tools.volSurface.comingSoon', 'Ce visualiseur sera disponible prochainement.')}
                  </p>
                  <button className="finance-button-outline">
                    {safeTranslate(t, 'tools.notifyMe', 'Être notifié lors de la sortie')}
                  </button>
                </div>
              )}
              {activeCalculator === "yieldcurve" && <YieldCurveVisualizer />}
              {activeCalculator === "greekssim" && <GreeksSimulator />}
              {activeCalculator === "modelcalibration" && <ModelCalibration />}
            </div>
          )}
          
          {activeTab === "simulators" && (
            <div>
              <div className="mb-8">
                <h2 className="text-xl font-medium mb-4">{safeTranslate(t, 'tools.simulatorsTitle', 'Simulateurs')}</h2>
                <div className="flex overflow-x-auto gap-2 p-1">
                  <button 
                    onClick={() => setActiveCalculator("montecarlo")}
                    className={`px-4 py-2 text-sm rounded-md whitespace-nowrap ${
                      activeCalculator === "montecarlo" 
                        ? "bg-finance-burgundy text-finance-offwhite" 
                        : "bg-finance-charcoal text-finance-lightgray hover:text-finance-offwhite"
                    }`}
                  >
                    Monte Carlo
                  </button>
                  <button 
                    onClick={() => setActiveCalculator("stresstest")}
                    className={`px-4 py-2 text-sm rounded-md whitespace-nowrap ${
                      activeCalculator === "stresstest" 
                        ? "bg-finance-burgundy text-finance-offwhite" 
                        : "bg-finance-charcoal text-finance-lightgray hover:text-finance-offwhite"
                    }`}
                  >
                    Stress Test
                  </button>
                  <button 
                    onClick={() => setActiveCalculator("options")}
                    className={`px-4 py-2 text-sm rounded-md whitespace-nowrap ${
                      activeCalculator === "options" 
                        ? "bg-finance-burgundy text-finance-offwhite" 
                        : "bg-finance-charcoal text-finance-lightgray hover:text-finance-offwhite"
                    }`}
                  >
                    Options Exotiques
                  </button>
                </div>
              </div>
              
              {activeCalculator === "montecarlo" && <MonteCarloSimulator />}
              {activeCalculator === "stresstest" && (
                <div className="finance-card p-6 flex flex-col items-center justify-center min-h-[300px]">
                  <Activity className="h-12 w-12 text-finance-steel mb-4" />
                  <h3 className="text-xl font-medium mb-2">{safeTranslate(t, 'tools.stressTest.title', 'Simulateur de Stress Test')}</h3>
                  <p className="text-finance-lightgray text-center mb-6">
                    {safeTranslate(t, 'tools.stressTest.comingSoon', 'Ce simulateur sera disponible prochainement.')}
                  </p>
                  <button className="finance-button-outline">
                    {safeTranslate(t, 'tools.notifyMe', 'Être notifié lors de la sortie')}
                  </button>
                </div>
              )}
              {activeCalculator === "options" && (
                <div className="finance-card p-6 flex flex-col items-center justify-center min-h-[300px]">
                  <CandlestickChart className="h-12 w-12 text-finance-steel mb-4" />
                  <h3 className="text-xl font-medium mb-2">{safeTranslate(t, 'tools.exoticOptions.title', 'Simulateur d\'Options Exotiques')}</h3>
                  <p className="text-finance-lightgray text-center mb-6">
                    {safeTranslate(t, 'tools.exoticOptions.comingSoon', 'Ce simulateur sera disponible prochainement.')}
                  </p>
                  <button className="finance-button-outline">
                    {safeTranslate(t, 'tools.notifyMe', 'Être notifié lors de la sortie')}
                  </button>
                </div>
              )}
            </div>
          )}
          
          {activeTab === "all" && (
            <div>
              <h2 className="text-xl font-medium mb-6">{safeTranslate(t, 'tools.allTools', 'Tous les outils')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ToolCard 
                  icon={Calculator} 
                  title={safeTranslate(t, 'tools.blackScholes.title', 'Calculatrice Black-Scholes')}
                  description={safeTranslate(t, 'tools.blackScholes.description', 'Évaluez rapidement les options vanilles et obtenez les Greeks correspondants.')}
                  onClick={() => {
                    setActiveTab("calculators");
                    setActiveCalculator("blackscholes");
                  }}
                />
                <ToolCard 
                  icon={Calculator} 
                  title={safeTranslate(t, 'tools.binomial.title', 'Modèle binomial')}
                  description={safeTranslate(t, 'tools.binomial.description', 'Évaluez les options avec un modèle binomial personnalisable.')}
                  onClick={() => {
                    setActiveTab("calculators");
                    setActiveCalculator("binomial");
                  }}
                />
                <ToolCard 
                  icon={LineChart} 
                  title={safeTranslate(t, 'tools.volSurface.title', 'Visualiseur de surface de vol')}
                  description={safeTranslate(t, 'tools.volSurface.description', 'Explorez les surfaces de volatilité implicite pour différents sous-jacents.')}
                  locked={true}
                />
                <ToolCard 
                  icon={Calculator} 
                  title={safeTranslate(t, 'tools.bonds.title', 'Calculateur d\'obligations')}
                  description={safeTranslate(t, 'tools.bonds.description', 'Évaluez les obligations et analysez leur sensibilité aux variations de taux.')}
                  onClick={() => {
                    setActiveTab("calculators");
                    setActiveCalculator("bonds");
                  }}
                />
                <ToolCard 
                  icon={LineChart} 
                  title={safeTranslate(t, 'tools.yieldCurve.title', 'Visualiseur de courbe de taux')}
                  description={safeTranslate(t, 'tools.yieldCurve.description', 'Affichez et manipulez les courbes de taux zéro-coupon et forward.')}
                  onClick={() => {
                    setActiveTab("visualizers");
                    setActiveCalculator("yieldcurve");
                  }}
                />
                <ToolCard 
                  icon={Calculator} 
                  title={safeTranslate(t, 'tools.greeks.title', 'Simulateur de Greeks')}
                  description={safeTranslate(t, 'tools.greeks.description', 'Simulez l\'évolution des Greeks en fonction des mouvements de marché.')}
                  onClick={() => {
                    setActiveTab("visualizers");
                    setActiveCalculator("greekssim");
                  }}
                />
                <ToolCard 
                  icon={Gauge} 
                  title={safeTranslate(t, 'tools.volatility.title', 'Calculateur de Volatilité')}
                  description={safeTranslate(t, 'tools.volatility.description', 'Mesurez la volatilité historique et analysez ses variations dans le temps.')}
                  onClick={() => {
                    setActiveTab("calculators");
                    setActiveCalculator("volatility");
                  }}
                />
                <ToolCard 
                  icon={Dices} 
                  title={safeTranslate(t, 'tools.monteCarlo.title', 'Simulateur Monte Carlo')}
                  description={safeTranslate(t, 'tools.monteCarlo.description', 'Simulez l\'évolution des prix et calculez les métriques de risque comme la VaR.')}
                  onClick={() => {
                    setActiveTab("simulators");
                    setActiveCalculator("montecarlo");
                  }}
                />
                <ToolCard 
                  icon={Database} 
                  title={safeTranslate(t, 'tools.modelCalibration.title', 'Calibration de Modèles')}
                  description={safeTranslate(t, 'tools.modelCalibration.description', 'Calibrez différents modèles de pricing sur des données de marché.')}
                  onClick={() => {
                    setActiveTab("visualizers");
                    setActiveCalculator("modelcalibration");
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* FAQ Section */}
      <section className="py-12 px-6 bg-finance-charcoal/20 border-t border-finance-steel/10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center terminal-text">{safeTranslate(t, 'tools.faq.title', 'Questions fréquentes')}</h2>
          
          <div className="space-y-4">
            <div className="finance-card overflow-hidden">
              <button 
                className="flex justify-between items-center w-full p-4 text-left"
                onClick={() => {}}
              >
                <span className="font-medium">{safeTranslate(t, 'tools.faq.blackScholes.question', 'Comment sont calculés les prix dans la calculatrice Black-Scholes?')}</span>
                <ChevronDown className="h-5 w-5 text-finance-accent" />
              </button>
              <div className="p-4 bg-finance-steel/5 border-t border-finance-steel/10">
                <p className="text-finance-lightgray text-sm">
                  {safeTranslate(t, 'tools.faq.blackScholes.answer', 'Notre calculatrice implémente la formule Black-Scholes standard pour le pricing d\'options européennes. Les Greeks sont calculés analytiquement à partir des dérivées partielles de la formule.')}
                </p>
              </div>
            </div>
            
            <div className="finance-card overflow-hidden">
              <button 
                className="flex justify-between items-center w-full p-4 text-left"
                onClick={() => {}}
              >
                <span className="font-medium">{safeTranslate(t, 'tools.faq.marketData.question', 'Les données de marchés utilisées sont-elles en temps réel?')}</span>
                <ChevronDown className="h-5 w-5 text-finance-accent" />
              </button>
              <div className="p-4 bg-finance-steel/5 border-t border-finance-steel/10">
                <p className="text-finance-lightgray text-sm">
                  {safeTranslate(t, 'tools.faq.marketData.answer', 'Non, les visualiseurs utilisent des données de marché en différé (15 minutes) ou des données historiques de clôture. Pour des données en temps réel, consultez notre offre premium.')}
                </p>
              </div>
            </div>
            
            <div className="finance-card overflow-hidden">
              <button 
                className="flex justify-between items-center w-full p-4 text-left"
                onClick={() => {}}
              >
                <span className="font-medium">{safeTranslate(t, 'tools.faq.export.question', 'Comment puis-je exporter les résultats?')}</span>
                <ChevronDown className="h-5 w-5 text-finance-accent" />
              </button>
              <div className="p-4 bg-finance-steel/5 border-t border-finance-steel/10">
                <p className="text-finance-lightgray text-sm">
                  {safeTranslate(t, 'tools.faq.export.answer', 'Tous nos outils proposent des fonctionnalités d\'export en CSV, Excel ou format image (PNG/SVG pour les graphiques). Ces fonctionnalités sont disponibles pour les utilisateurs premium.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Subscription CTA */}
      <section className="py-12 px-6 bg-finance-charcoal/50 border-t border-finance-steel/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4 terminal-text">{safeTranslate(t, 'tools.cta.title', 'Accès illimité à tous les outils')}</h2>
          <p className="text-finance-lightgray mb-8">
            {safeTranslate(t, 'tools.cta.description', 'Les abonnés premium bénéficient d\'un accès complet à tous nos outils de pricing et d\'analyse, y compris les exports de données et les fonctionnalités avancées.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="finance-button text-center">
              {safeTranslate(t, 'tools.cta.subscribe', 'S\'abonner pour 19€/mois')}
            </button>
            <button className="finance-button-outline text-center">
              {safeTranslate(t, 'tools.cta.discover', 'Découvrir la formation')}
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Tools;
