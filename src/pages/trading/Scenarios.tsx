
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { safeTranslate } from '../../utils/translationUtils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Chart, LineChart } from '@/components/ui/chart';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { defaultStrategies } from '@/utils/options/strategyDefaults';
import { FlaskConical, Lightbulb, ZapOff, TrendingUp, TrendingDown, Github, PieChart, ArrowRight, Save, Sliders } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ScenarioParams {
  marketMove: number;
  volatilityChange: number;
  rateChange: number;
  timeChange: number;
}

interface ScenarioResult {
  id: string;
  name: string;
  strategy: string;
  initialValue: number;
  newValue: number;
  percentChange: number;
  pnl: number;
  deltaExposure: number;
  gammaExposure: number;
  vegaExposure: number;
  thetaExposure: number;
  rhoExposure: number;
  valuesByPriceChange: {x: number, y: number}[];
}

// Preset scenarios
const presetScenarios = [
  { id: 'bullish', name: 'Marché haussier', marketMove: 10, volatilityChange: -5, rateChange: 0.5, timeChange: 0 },
  { id: 'bearish', name: 'Marché baissier', marketMove: -10, volatilityChange: 15, rateChange: -0.25, timeChange: 0 },
  { id: 'volatility_spike', name: 'Spike de volatilité', marketMove: -5, volatilityChange: 50, rateChange: 0, timeChange: 0 },
  { id: 'volatility_crush', name: 'Écrasement de volatilité', marketMove: 2, volatilityChange: -30, rateChange: 0, timeChange: 0 },
  { id: 'time_decay', name: 'Passage du temps', marketMove: 0, volatilityChange: 0, rateChange: 0, timeChange: 7 },
];

// Function to simulate scenario impact on a strategy
const simulateScenario = (strategy: string, params: ScenarioParams): ScenarioResult => {
  // Initial base value
  const initialValue = 10000 + Math.random() * 5000;
  
  // Impact based on parameters (simplified model)
  const marketImpact = params.marketMove * (0.8 + Math.random() * 0.4);
  const volImpact = params.volatilityChange * (0.3 + Math.random() * 0.2) * (strategy.includes('Call') ? 1 : -0.5);
  const rateImpact = params.rateChange * (0.5 + Math.random() * 0.3);
  const timeImpact = params.timeChange * (0.2 + Math.random() * 0.1) * (strategy.includes('Call') ? -1 : -0.5);
  
  // Total impact
  const totalImpactPercent = marketImpact + volImpact + rateImpact + timeImpact;
  const newValue = initialValue * (1 + totalImpactPercent/100);
  const pnl = newValue - initialValue;
  
  // Generate a sensitivity curve
  const valuesByPriceChange = Array.from({ length: 21 }, (_, i) => {
    const priceChange = -10 + i;
    const adjustedMarketImpact = priceChange * (0.8 + Math.random() * 0.4);
    const adjustedTotalImpact = adjustedMarketImpact + volImpact + rateImpact + timeImpact;
    const adjustedValue = initialValue * (1 + adjustedTotalImpact/100);
    
    return {
      x: priceChange,
      y: adjustedValue
    };
  });
  
  // Greeks (simplified for the demo)
  const deltaExposure = (strategy.includes('Call') ? 1 : -1) * (0.4 + Math.random() * 0.4);
  const gammaExposure = 0.05 + Math.random() * 0.1;
  const vegaExposure = 200 + Math.random() * 300;
  const thetaExposure = -(50 + Math.random() * 30);
  const rhoExposure = (strategy.includes('Call') ? 1 : -1) * (30 + Math.random() * 20);
  
  return {
    id: `scenario-${Date.now()}`,
    name: `Scénario: ${params.marketMove > 0 ? '+' : ''}${params.marketMove}%, Vol ${params.volatilityChange > 0 ? '+' : ''}${params.volatilityChange}%`,
    strategy,
    initialValue,
    newValue,
    percentChange: totalImpactPercent,
    pnl,
    deltaExposure,
    gammaExposure,
    vegaExposure,
    thetaExposure,
    rhoExposure,
    valuesByPriceChange
  };
};

const Scenarios = () => {
  const { t } = useTranslation();
  const [activeScenario, setActiveScenario] = useState<ScenarioParams>({
    marketMove: 0,
    volatilityChange: 0,
    rateChange: 0,
    timeChange: 0
  });
  const [selectedStrategy, setSelectedStrategy] = useState(defaultStrategies[0].name);
  const [scenarioResult, setScenarioResult] = useState<ScenarioResult | null>(null);
  const [scenarioHistory, setScenarioHistory] = useState<ScenarioResult[]>([]);
  const [activeTab, setActiveTab] = useState('custom');

  const handleApplyPreset = (preset: typeof presetScenarios[0]) => {
    setActiveScenario({
      marketMove: preset.marketMove,
      volatilityChange: preset.volatilityChange,
      rateChange: preset.rateChange,
      timeChange: preset.timeChange
    });
    setActiveTab('custom');
  };

  const handleRunScenario = () => {
    const result = simulateScenario(selectedStrategy, activeScenario);
    setScenarioResult(result);
    setScenarioHistory(prev => [...prev, result]);
  };

  return (
    <>
      <Helmet>
        <title>{safeTranslate(t, 'tradingLab.scenarios', 'Scénarios')} | The Trading Lab</title>
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-finance-accent mb-3">
          {safeTranslate(t, 'tradingLab.scenarios', 'Scénarios')}
        </h1>
        <p className="text-finance-offwhite mb-6">
          {safeTranslate(t, 'tradingLab.scenariosDesc', 'Testez des scénarios de marché et des hypothèses pour préparer différentes conditions')}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-1">
            <Card className="bg-finance-charcoal p-6 rounded-lg shadow-md h-full">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="presets">Préréglages</TabsTrigger>
                  <TabsTrigger value="custom">Personnalisé</TabsTrigger>
                </TabsList>
                
                <TabsContent value="presets" className="space-y-4">
                  <h3 className="text-lg font-semibold text-finance-accent mb-2 flex items-center">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Scénarios prédéfinis
                  </h3>
                  
                  <div className="space-y-2">
                    {presetScenarios.map((preset) => (
                      <Button 
                        key={preset.id}
                        variant="outline" 
                        className="w-full justify-start text-left" 
                        onClick={() => handleApplyPreset(preset)}
                      >
                        {preset.marketMove >= 0 ? <TrendingUp className="h-4 w-4 mr-2" /> : <TrendingDown className="h-4 w-4 mr-2" />}
                        <div>
                          <div>{preset.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Market: {preset.marketMove > 0 ? '+' : ''}{preset.marketMove}% | 
                            Vol: {preset.volatilityChange > 0 ? '+' : ''}{preset.volatilityChange}%
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="custom" className="space-y-4">
                  <h3 className="text-lg font-semibold text-finance-accent mb-4 flex items-center">
                    <Sliders className="h-4 w-4 mr-2" />
                    Paramètres personnalisés
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium text-finance-offwhite">
                          Mouvement de prix
                        </label>
                        <span className={`text-sm font-medium ${activeScenario.marketMove > 0 ? 'text-green-500' : activeScenario.marketMove < 0 ? 'text-red-500' : 'text-finance-offwhite'}`}>
                          {activeScenario.marketMove > 0 ? '+' : ''}{activeScenario.marketMove}%
                        </span>
                      </div>
                      <Slider 
                        value={[activeScenario.marketMove]} 
                        min={-50} 
                        max={50} 
                        step={1}
                        onValueChange={(value) => setActiveScenario({...activeScenario, marketMove: value[0]})}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium text-finance-offwhite">
                          Changement de volatilité
                        </label>
                        <span className={`text-sm font-medium ${activeScenario.volatilityChange > 0 ? 'text-orange-500' : activeScenario.volatilityChange < 0 ? 'text-blue-500' : 'text-finance-offwhite'}`}>
                          {activeScenario.volatilityChange > 0 ? '+' : ''}{activeScenario.volatilityChange}%
                        </span>
                      </div>
                      <Slider 
                        value={[activeScenario.volatilityChange]} 
                        min={-50} 
                        max={100} 
                        step={5}
                        onValueChange={(value) => setActiveScenario({...activeScenario, volatilityChange: value[0]})}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium text-finance-offwhite">
                          Changement de taux
                        </label>
                        <span className="text-sm font-medium text-finance-offwhite">
                          {activeScenario.rateChange > 0 ? '+' : ''}{activeScenario.rateChange} pts
                        </span>
                      </div>
                      <Slider 
                        value={[activeScenario.rateChange]} 
                        min={-2} 
                        max={2} 
                        step={0.25}
                        onValueChange={(value) => setActiveScenario({...activeScenario, rateChange: value[0]})}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium text-finance-offwhite">
                          Passage du temps (jours)
                        </label>
                        <span className="text-sm font-medium text-finance-offwhite">
                          {activeScenario.timeChange > 0 ? '+' : ''}{activeScenario.timeChange} jour(s)
                        </span>
                      </div>
                      <Slider 
                        value={[activeScenario.timeChange]} 
                        min={0} 
                        max={30} 
                        step={1}
                        onValueChange={(value) => setActiveScenario({...activeScenario, timeChange: value[0]})}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="mt-6 pt-6 border-t border-finance-steel/20">
                <h3 className="text-lg font-semibold text-finance-accent mb-4">
                  Appliquer à la stratégie
                </h3>
                
                <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                  <SelectTrigger className="w-full bg-finance-dark">
                    <SelectValue placeholder="Sélectionner une stratégie" />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultStrategies.map((strategy) => (
                      <SelectItem key={strategy.id} value={strategy.name}>
                        {strategy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  onClick={handleRunScenario}
                  className="w-full mt-4 bg-finance-accent hover:bg-finance-accent/80"
                >
                  <FlaskConical className="h-4 w-4 mr-2" />
                  Tester ce scénario
                </Button>
              </div>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            {scenarioResult ? (
              <Card className="bg-finance-charcoal p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-finance-accent mb-4 flex items-center">
                  <FlaskConical className="h-5 w-5 mr-2" />
                  Résultats du scénario
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-finance-dark p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-finance-offwhite/70 mb-2">Impact sur la stratégie</h3>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-lg font-bold text-finance-offwhite">{scenarioResult.strategy}</p>
                        <p className="text-sm text-finance-offwhite/70">Valeur initiale: ${scenarioResult.initialValue.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${scenarioResult.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          ${scenarioResult.newValue.toFixed(2)}
                        </p>
                        <p className={`text-sm ${scenarioResult.percentChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {scenarioResult.percentChange >= 0 ? '+' : ''}{scenarioResult.percentChange.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-finance-dark p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-finance-offwhite/70 mb-2">P&L Impact</h3>
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-bold text-finance-offwhite">Profit/Perte</p>
                      <p className={`text-lg font-bold ${scenarioResult.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {scenarioResult.pnl >= 0 ? '+' : ''}${scenarioResult.pnl.toFixed(2)}
                      </p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-finance-steel/10">
                      <div className="flex justify-between">
                        <span className="text-sm text-finance-offwhite/70">Risque-rendement</span>
                        <span className="text-sm text-finance-offwhite">
                          {(Math.abs(scenarioResult.pnl / scenarioResult.initialValue) * 100).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-finance-accent mb-4">
                    Sensibilité aux mouvements de prix
                  </h3>
                  <div className="h-[250px]">
                    <LineChart
                      data={scenarioResult.valuesByPriceChange}
                      xLabel="Changement de prix (%)"
                      yLabel="Valeur estimée ($)"
                      color="#4ade80"
                    />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-finance-accent mb-4">
                    Exposition aux Greeks
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <div className="bg-finance-dark p-3 rounded-lg text-center">
                      <p className="text-sm font-medium text-finance-offwhite/70">Delta</p>
                      <p className={`text-lg font-bold ${scenarioResult.deltaExposure >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {scenarioResult.deltaExposure.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-finance-dark p-3 rounded-lg text-center">
                      <p className="text-sm font-medium text-finance-offwhite/70">Gamma</p>
                      <p className="text-lg font-bold text-blue-500">
                        {scenarioResult.gammaExposure.toFixed(3)}
                      </p>
                    </div>
                    <div className="bg-finance-dark p-3 rounded-lg text-center">
                      <p className="text-sm font-medium text-finance-offwhite/70">Vega</p>
                      <p className="text-lg font-bold text-purple-500">
                        {scenarioResult.vegaExposure.toFixed(0)}
                      </p>
                    </div>
                    <div className="bg-finance-dark p-3 rounded-lg text-center">
                      <p className="text-sm font-medium text-finance-offwhite/70">Theta</p>
                      <p className="text-lg font-bold text-red-500">
                        {scenarioResult.thetaExposure.toFixed(0)}
                      </p>
                    </div>
                    <div className="bg-finance-dark p-3 rounded-lg text-center">
                      <p className="text-sm font-medium text-finance-offwhite/70">Rho</p>
                      <p className="text-lg font-bold text-amber-500">
                        {scenarioResult.rhoExposure.toFixed(0)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-between">
                  <Button variant="outline" size="sm" className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder ce scénario
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Voir performances
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="bg-finance-charcoal p-6 rounded-lg shadow-md h-full flex flex-col justify-center items-center">
                <FlaskConical className="h-16 w-16 text-finance-accent/30 mb-4" />
                <h2 className="text-xl font-semibold text-finance-accent mb-2">
                  Simulations de scénarios
                </h2>
                <p className="text-finance-offwhite text-center max-w-md mb-6">
                  Testez l'impact de différents scénarios de marché sur vos stratégies d'options.
                  Ajustez les paramètres à gauche et lancez une simulation.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  <div className="bg-finance-dark p-3 rounded-lg text-center">
                    <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
                    <p className="text-sm text-finance-offwhite">Prix</p>
                  </div>
                  <div className="bg-finance-dark p-3 rounded-lg text-center">
                    <ZapOff className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                    <p className="text-sm text-finance-offwhite">Volatilité</p>
                  </div>
                  <div className="bg-finance-dark p-3 rounded-lg text-center">
                    <PieChart className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-sm text-finance-offwhite">Taux</p>
                  </div>
                  <div className="bg-finance-dark p-3 rounded-lg text-center">
                    <Github className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                    <p className="text-sm text-finance-offwhite">Temps</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
        
        {scenarioHistory.length > 0 && (
          <Card className="bg-finance-charcoal p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-finance-accent mb-4">
              Historique des scénarios
            </h2>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scénario</TableHead>
                    <TableHead>Stratégie</TableHead>
                    <TableHead>Impact P&L</TableHead>
                    <TableHead>%</TableHead>
                    <TableHead>Delta</TableHead>
                    <TableHead>Vega</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scenarioHistory.map((scenario) => (
                    <TableRow key={scenario.id}>
                      <TableCell>{scenario.name}</TableCell>
                      <TableCell>{scenario.strategy}</TableCell>
                      <TableCell className={`font-medium ${scenario.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {scenario.pnl >= 0 ? '+' : ''}{scenario.pnl.toFixed(2)}
                      </TableCell>
                      <TableCell className={`${scenario.percentChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {scenario.percentChange >= 0 ? '+' : ''}{scenario.percentChange.toFixed(2)}%
                      </TableCell>
                      <TableCell>{scenario.deltaExposure.toFixed(2)}</TableCell>
                      <TableCell>{scenario.vegaExposure.toFixed(0)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <FlaskConical className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </>
  );
};

export default Scenarios;
