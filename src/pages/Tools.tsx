
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
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { safeTranslate } from "../utils/translationUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Tool card component with improved design
const ToolCard = ({ 
  icon: Icon, 
  title, 
  description, 
  locked = false,
  path,
  onClick
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  locked?: boolean;
  path?: string;
  onClick?: () => void;
}) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (locked) return;
    
    if (onClick) {
      onClick();
    } else if (path) {
      navigate(path);
    }
  };
  
  return (
    <Card className={`bg-finance-charcoal border-finance-steel/30 ${locked ? 'opacity-60' : 'hover:border-finance-accent transition-colors duration-300'}`}>
      <CardContent className="p-6">
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
        
        <Button 
          onClick={handleClick}
          variant={locked ? "outline" : "finance"}
          className={`flex justify-between items-center w-full ${
            locked 
              ? 'bg-finance-steel/10 text-finance-lightgray cursor-not-allowed border-finance-steel/30' 
              : ''
          }`}
        >
          <span className="text-sm font-medium">
            {locked ? "Débloquer" : "Utiliser l'outil"}
          </span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

const Tools = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("all");
  const navigate = useNavigate();
  
  return (
    <>
      <Helmet>
        <title>{safeTranslate(t, 'tools.title', 'Outils')} | The Trading Lab</title>
      </Helmet>
      
      {/* Tools Header with improved spacing and design */}
      <header className="py-12 px-6 border-b border-finance-steel/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 terminal-text">{safeTranslate(t, 'tools.header', 'Outils de pricing')}</h1>
            <p className="text-finance-lightgray text-lg max-w-3xl mx-auto">
              {safeTranslate(t, 'tools.description', 'Une suite d\'outils conçus pour les professionnels des marchés financiers, permettant d\'évaluer et d\'analyser rapidement différents instruments.')}
            </p>
          </div>
        </div>
      </header>
      
      {/* Tools Tabs with improved styling */}
      <div className="border-b border-finance-steel/10">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto scrollbar-none">
              <TabsList className="bg-transparent h-14 w-full justify-start border-b border-finance-steel/10">
                <TabsTrigger 
                  value="calculators" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-finance-accent data-[state=active]:shadow-none h-14 rounded-none"
                >
                  {safeTranslate(t, 'tools.tabs.calculators', 'Calculatrices')}
                </TabsTrigger>
                <TabsTrigger 
                  value="visualizers" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-finance-accent data-[state=active]:shadow-none h-14 rounded-none"
                >
                  {safeTranslate(t, 'tools.tabs.visualizers', 'Visualiseurs')}
                </TabsTrigger>
                <TabsTrigger 
                  value="simulators" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-finance-accent data-[state=active]:shadow-none h-14 rounded-none"
                >
                  {safeTranslate(t, 'tools.tabs.simulators', 'Simulateurs')}
                </TabsTrigger>
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-finance-accent data-[state=active]:shadow-none h-14 rounded-none"
                >
                  {safeTranslate(t, 'tools.tabs.all', 'Tous les outils')}
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Tools Content with improved design */}
            <div className="py-8 px-6">
              <TabsContent value="all" className="mt-0">
                <div>
                  <h2 className="text-xl font-medium mb-6">{safeTranslate(t, 'tools.allTools', 'Tous les outils')}</h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ToolCard 
                      icon={Gauge} 
                      title={safeTranslate(t, 'tools.volatility.title', 'Calculatrice de Volatilité')}
                      description={safeTranslate(t, 'tools.volatility.description', 'Mesurez la volatilité historique et analysez ses variations dans le temps.')}
                      path="/tools/volatility-calculator"
                    />
                    <ToolCard 
                      icon={Calculator} 
                      title={safeTranslate(t, 'tools.blackScholes.title', 'Black-Scholes Calculator')}
                      description={safeTranslate(t, 'tools.blackScholes.description', 'Évaluez rapidement les options vanilles et obtenez les Greeks correspondants.')}
                      path="/tools/black-scholes"
                    />
                    <ToolCard 
                      icon={Dices} 
                      title={safeTranslate(t, 'tools.monteCarlo.title', 'Simulateur Monte Carlo')}
                      description={safeTranslate(t, 'tools.monteCarlo.description', "Simulez l'évolution des prix et calculez les métriques de risque comme la VaR.")}
                      path="/tools/monte-carlo"
                    />
                    <ToolCard 
                      icon={Database} 
                      title={safeTranslate(t, 'tools.modelCalibration.title', 'Calibration de Modèles')}
                      description={safeTranslate(t, 'tools.modelCalibration.description', 'Calibrez différents modèles de pricing sur des données de marché.')}
                      path="/tools/model-calibration"
                    />
                    <ToolCard 
                      icon={Calculator} 
                      title={safeTranslate(t, 'tools.binomial.title', 'Modèle binomial')}
                      description={safeTranslate(t, 'tools.binomial.description', 'Évaluez les options avec un modèle binomial personnalisable.')}
                      locked={true}
                    />
                    <ToolCard 
                      icon={LineChart} 
                      title={safeTranslate(t, 'tools.volSurface.title', 'Visualiseur de surface de vol')}
                      description={safeTranslate(t, 'tools.volSurface.description', 'Explorez les surfaces de volatilité implicite pour différents sous-jacents.')}
                      locked={true}
                    />
                    <ToolCard 
                      icon={Calculator} 
                      title={safeTranslate(t, 'tools.bonds.title', "Calculateur d'obligations")}
                      description={safeTranslate(t, 'tools.bonds.description', 'Évaluez les obligations et analysez leur sensibilité aux variations de taux.')}
                      locked={true}
                    />
                    <ToolCard 
                      icon={LineChart} 
                      title={safeTranslate(t, 'tools.yieldCurve.title', 'Visualiseur de courbe de taux')}
                      description={safeTranslate(t, 'tools.yieldCurve.description', 'Affichez et manipulez les courbes de taux zéro-coupon et forward.')}
                      locked={true}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="calculators" className="mt-0">
                <div>
                  <h2 className="text-xl font-medium mb-6">{safeTranslate(t, 'tools.calculatorsTitle', 'Calculatrices')}</h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ToolCard 
                      icon={Gauge} 
                      title={safeTranslate(t, 'tools.volatility.title', 'Calculatrice de Volatilité')}
                      description={safeTranslate(t, 'tools.volatility.description', 'Mesurez la volatilité historique et analysez ses variations dans le temps.')}
                      path="/tools/volatility-calculator"
                    />
                    <ToolCard 
                      icon={Calculator} 
                      title={safeTranslate(t, 'tools.blackScholes.title', 'Black-Scholes Calculator')}
                      description={safeTranslate(t, 'tools.blackScholes.description', 'Évaluez rapidement les options vanilles et obtenez les Greeks correspondants.')}
                      path="/tools/black-scholes"
                    />
                    <ToolCard 
                      icon={Calculator} 
                      title={safeTranslate(t, 'tools.binomial.title', 'Modèle binomial')}
                      description={safeTranslate(t, 'tools.binomial.description', 'Évaluez les options avec un modèle binomial personnalisable.')}
                      locked={true}
                    />
                    <ToolCard 
                      icon={Calculator} 
                      title={safeTranslate(t, 'tools.bonds.title', "Calculateur d'obligations")}
                      description={safeTranslate(t, 'tools.bonds.description', 'Évaluez les obligations et analysez leur sensibilité aux variations de taux.')}
                      locked={true}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="visualizers" className="mt-0">
                <div>
                  <h2 className="text-xl font-medium mb-6">{safeTranslate(t, 'tools.visualizersTitle', 'Visualiseurs')}</h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ToolCard 
                      icon={Database} 
                      title={safeTranslate(t, 'tools.modelCalibration.title', 'Calibration de Modèles')}
                      description={safeTranslate(t, 'tools.modelCalibration.description', 'Calibrez différents modèles de pricing sur des données de marché.')}
                      path="/tools/model-calibration"
                    />
                    <ToolCard 
                      icon={LineChart} 
                      title={safeTranslate(t, 'tools.volSurface.title', 'Visualiseur de surface de vol')}
                      description={safeTranslate(t, 'tools.volSurface.description', 'Explorez les surfaces de volatilité implicite pour différents sous-jacents.')}
                      locked={true}
                    />
                    <ToolCard 
                      icon={LineChart} 
                      title={safeTranslate(t, 'tools.yieldCurve.title', 'Visualiseur de courbe de taux')}
                      description={safeTranslate(t, 'tools.yieldCurve.description', 'Affichez et manipulez les courbes de taux zéro-coupon et forward.')}
                      locked={true}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="simulators" className="mt-0">
                <div>
                  <h2 className="text-xl font-medium mb-6">{safeTranslate(t, 'tools.simulatorsTitle', 'Simulateurs')}</h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ToolCard 
                      icon={Dices} 
                      title={safeTranslate(t, 'tools.monteCarlo.title', 'Simulateur Monte Carlo')}
                      description={safeTranslate(t, 'tools.monteCarlo.description', "Simulez l'évolution des prix et calculez les métriques de risque comme la VaR.")}
                      path="/tools/monte-carlo"
                    />
                    <ToolCard 
                      icon={Activity} 
                      title={safeTranslate(t, 'tools.stressTest.title', 'Simulateur de Stress Test')}
                      description={safeTranslate(t, 'tools.stressTest.description', 'Analyser la résistance de vos portefeuilles dans des scénarios extrêmes.')}
                      locked={true}
                    />
                    <ToolCard 
                      icon={CandlestickChart} 
                      title={safeTranslate(t, 'tools.exoticOptions.title', "Simulateur d'Options Exotiques")}
                      description={safeTranslate(t, 'tools.exoticOptions.description', 'Evaluez et comprenez les options à barrière, lookback, asiatiques et autres.')}
                      locked={true}
                    />
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
      
      {/* FAQ Section with improved styling */}
      <section className="py-12 px-6 bg-finance-charcoal/20 border-t border-finance-steel/10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center terminal-text">{safeTranslate(t, 'tools.faq.title', 'Questions fréquentes')}</h2>
          
          <div className="space-y-4">
            <Card className="bg-finance-charcoal border-finance-steel/30">
              <CardContent className="p-0">
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
              </CardContent>
            </Card>
            
            <Card className="bg-finance-charcoal border-finance-steel/30">
              <CardContent className="p-0">
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
              </CardContent>
            </Card>
            
            <Card className="bg-finance-charcoal border-finance-steel/30">
              <CardContent className="p-0">
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
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Subscription CTA with improved styling */}
      <section className="py-12 px-6 bg-finance-charcoal/50 border-t border-finance-steel/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4 terminal-text">{safeTranslate(t, 'tools.cta.title', 'Accès illimité à tous les outils')}</h2>
          <p className="text-finance-lightgray mb-8">
            {safeTranslate(t, 'tools.cta.description', 'Les abonnés premium bénéficient d\'un accès complet à tous nos outils de pricing et d\'analyse, y compris les exports de données et les fonctionnalités avancées.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="finance" size="lg">
              {safeTranslate(t, 'tools.cta.subscribe', 'S\'abonner pour 19€/mois')}
            </Button>
            <Button variant="outline" size="lg" className="border-finance-accent text-finance-accent hover:bg-finance-accent/10">
              {safeTranslate(t, 'tools.cta.discover', 'Découvrir la formation')}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Tools;
