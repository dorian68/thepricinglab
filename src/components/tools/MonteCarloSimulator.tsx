
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart } from '@/components/ui/chart';
import { Play, RefreshCw, Download, PieChart } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { setSeed, seededRandom, resetSeed } from '@/utils/seedrandom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

interface SimulationParams {
  initialPrice: number;
  drift: number;
  volatility: number;
  timeSteps: number;
  duration: number;
  simulationCount: number;
}

const generateMonteCarloPaths = (params: SimulationParams) => {
  const { initialPrice, drift, volatility, timeSteps, duration, simulationCount } = params;
  const dt = duration / timeSteps;
  const sqrtDt = Math.sqrt(dt);
  const paths = [];
  const finalPrices = [];
  
  setSeed(42);
  resetSeed();
  
  for (let sim = 0; sim < simulationCount; sim++) {
    const path = [initialPrice];
    let currentPrice = initialPrice;
    
    for (let t = 1; t <= timeSteps; t++) {
      const randomShock = (seededRandom() - 0.5) * 2;
      const dS = drift * currentPrice * dt + volatility * currentPrice * randomShock * sqrtDt;
      currentPrice += dS;
      path.push(currentPrice);
    }
    
    paths.push(path);
    finalPrices.push(currentPrice);
  }
  
  finalPrices.sort((a, b) => a - b);
  const mean = finalPrices.reduce((sum, price) => sum + price, 0) / simulationCount;
  const median = finalPrices[Math.floor(simulationCount / 2)];
  const min = finalPrices[0];
  const max = finalPrices[finalPrices.length - 1];
  const var95 = finalPrices[Math.floor(simulationCount * 0.05)];
  const var99 = finalPrices[Math.floor(simulationCount * 0.01)];
  
  const formattedPaths = paths.map((path, simIndex) => {
    return path.map((price, timeIndex) => ({
      simulation: simIndex,
      time: timeIndex * dt,
      price
    }));
  });
  
  const samplePaths = [];
  const step = Math.max(1, Math.floor(simulationCount / 20));
  
  for (let i = 0; i < simulationCount; i += step) {
    samplePaths.push(formattedPaths[i]);
  }
  
  const chartData = [];
  for (let t = 0; t <= timeSteps; t++) {
    samplePaths.forEach((path, index) => {
      chartData.push({
        x: path[t].time,
        y: path[t].price,
        series: `sim-${index}`
      });
    });
  }
  
  const chartLines = [];
  for (let i = 0; i < samplePaths.length; i++) {
    const line = samplePaths[i].map(point => ({
      x: point.time,
      y: point.price
    }));
    chartLines.push({
      id: `sim-${i}`,
      data: line
    });
  }
  
  const simplifiedData = samplePaths.map((path, index) => {
    return {
      id: `sim-${index}`,
      data: path.map(p => ({ x: p.time, y: p.price }))
    };
  });
  
  return {
    chartData: chartLines,
    simplifiedData,
    stats: {
      mean,
      median,
      min,
      max,
      var95,
      var99
    }
  };
};

const MonteCarloSimulator: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useState<SimulationParams>({
    initialPrice: 100,
    drift: 0.05,
    volatility: 0.2,
    timeSteps: 252,
    duration: 1,
    simulationCount: 100
  });
  
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [results, setResults] = useState<any>(null);
  const [selectedMode, setSelectedMode] = useState<string>("price-simulation");
  
  const updateParam = (key: keyof SimulationParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };
  
  const runSimulation = () => {
    setIsSimulating(true);
    
    setTimeout(() => {
      const simulationResults = generateMonteCarloPaths(params);
      setResults(simulationResults);
      setIsSimulating(false);
    }, 1000);
  };
  
  const formatNumber = (num: number) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
  const prepareChartData = () => {
    if (!results || !results.simplifiedData || !results.simplifiedData[0]) return [];
    
    const samplePath = results.simplifiedData[0].data;
    return samplePath.map((point: any) => ({
      x: point.x,
      y: point.y
    }));
  };
  
  const prepareVaRChartData = () => {
    if (!results) return [];
    
    return [
      { x: 0, y: params.initialPrice },
      { x: params.duration, y: results.stats.mean },
      { x: params.duration, y: results.stats.var95 }
    ];
  };
  
  return (
    <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8 max-w-7xl">
      <Helmet>
        <title>Simulateur Monte Carlo | The Pricing Library</title>
        <meta name="description" content="Simulateur Monte Carlo pour les trajectoires de prix et métriques de risque. Analysez les simulations, VaR et d'autres indicateurs financiers." />
        <meta name="keywords" content="Monte Carlo, simulation financière, VaR, trajectoires de prix, finance quantitative, analyse risque" />
        <link rel="canonical" href="https://thepricinglab.com/tools/monte-carlo" />
      </Helmet>
      
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-finance-accent mb-2">Simulateur Monte Carlo</h1>
        <p className="text-finance-lightgray">Simulation de trajectoires de prix et métriques de risque</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-finance-charcoal border-finance-steel/30">
          <CardHeader>
            <CardTitle className="flex items-center text-finance-accent">
              <Play className="mr-2 h-5 w-5" />
              Paramètres de simulation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="initialPrice">
                  Prix initial: {formatNumber(params.initialPrice)}
                </Label>
                <Slider
                  id="initialPrice"
                  value={[params.initialPrice]}
                  min={10}
                  max={1000}
                  step={10}
                  onValueChange={(value) => updateParam('initialPrice', value[0])}
                  className="mt-2"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="drift">
                  Drift (rendement attendu): {(params.drift * 100).toFixed(1)}% par an
                </Label>
                <Slider
                  id="drift"
                  value={[params.drift]}
                  min={-0.2}
                  max={0.3}
                  step={0.01}
                  onValueChange={(value) => updateParam('drift', value[0])}
                  className="mt-2"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="volatility">
                  Volatilité: {(params.volatility * 100).toFixed(1)}% par an
                </Label>
                <Slider
                  id="volatility"
                  value={[params.volatility]}
                  min={0.05}
                  max={1}
                  step={0.05}
                  onValueChange={(value) => updateParam('volatility', value[0])}
                  className="mt-2"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">
                  Durée: {params.duration} {params.duration === 1 ? 'an' : 'ans'}
                </Label>
                <Slider
                  id="duration"
                  value={[params.duration]}
                  min={0.25}
                  max={5}
                  step={0.25}
                  onValueChange={(value) => updateParam('duration', value[0])}
                  className="mt-2"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timeSteps">
                  Pas de temps: {params.timeSteps}
                </Label>
                <Slider
                  id="timeSteps"
                  value={[params.timeSteps]}
                  min={52}
                  max={504}
                  step={52}
                  onValueChange={(value) => updateParam('timeSteps', value[0])}
                  className="mt-2"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="simulationCount">
                  Nombre de simulations: {params.simulationCount}
                </Label>
                <Slider
                  id="simulationCount"
                  value={[params.simulationCount]}
                  min={10}
                  max={1000}
                  step={10}
                  onValueChange={(value) => updateParam('simulationCount', value[0])}
                  className="mt-2"
                />
              </div>
              
              <Button 
                variant="finance" 
                className="w-full mt-4"
                onClick={runSimulation}
                disabled={isSimulating}
                aria-label="Lancer la simulation Monte Carlo"
              >
                {isSimulating ? (
                  <div className="flex items-center">
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Simulation en cours...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Play className="mr-2 h-4 w-4" />
                    Lancer la simulation
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {results ? (
          <>
            <Card className="bg-finance-charcoal border-finance-steel/30 col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-finance-accent">Résultats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="bg-finance-dark p-4 rounded-md">
                    <div className="text-sm text-finance-lightgray">Prix moyen final</div>
                    <div className="text-2xl font-bold text-finance-accent">{formatNumber(results.stats.mean)}</div>
                  </div>
                  <div className="bg-finance-dark p-4 rounded-md">
                    <div className="text-sm text-finance-lightgray">VaR 95%</div>
                    <div className="text-2xl font-bold text-finance-accent">{formatNumber(results.stats.var95)}</div>
                  </div>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Métrique</TableHead>
                      <TableHead>Valeur</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Prix initial</TableCell>
                      <TableCell>{formatNumber(params.initialPrice)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Prix médian final</TableCell>
                      <TableCell>{formatNumber(results.stats.median)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Prix minimum final</TableCell>
                      <TableCell>{formatNumber(results.stats.min)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Prix maximum final</TableCell>
                      <TableCell>{formatNumber(results.stats.max)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>VaR 99%</TableCell>
                      <TableCell>{formatNumber(results.stats.var99)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            <Card className="bg-finance-charcoal border-finance-steel/30 col-span-1 lg:col-span-3 h-80">
              <CardHeader className="p-4 pb-0">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-finance-accent flex items-center">
                    <LineChart className="mr-2 h-5 w-5" />
                    Simulations Monte Carlo
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Select value={selectedMode} onValueChange={setSelectedMode}>
                      <SelectTrigger className="h-8 text-xs w-40 bg-finance-dark">
                        <SelectValue placeholder="Mode d'affichage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="price-simulation">Évolution du prix</SelectItem>
                        <SelectItem value="var-analysis">Analyse VaR</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="h-8">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 px-4 h-64">
                {selectedMode === "price-simulation" ? (
                  <div className="w-full h-full">
                    <LineChart 
                      data={prepareChartData()}
                      color="#8884d8"
                      xLabel="Temps (années)"
                      yLabel="Prix"
                      animate={false}
                      className="w-full"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full">
                    <LineChart 
                      data={prepareVaRChartData()}
                      color="#ea384c"
                      xLabel="Temps (années)"
                      yLabel="Prix"
                      animate={false}
                      className="w-full"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="bg-finance-charcoal border-finance-steel/30 col-span-1 lg:col-span-2 flex items-center justify-center p-6">
            <div className="text-center">
              <PieChart className="h-16 w-16 text-finance-steel/50 mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">Aucun résultat</h3>
              <p className="text-finance-lightgray mb-4">
                Définissez les paramètres et lancez la simulation pour voir les résultats.
              </p>
            </div>
          </Card>
        )}
      </div>
      
      {/* Section SEO avec contenu descriptif pour les robots */}
      <div className="mt-12 prose prose-invert max-w-none">
        <h2 className="text-xl font-bold mb-4">Comprendre la simulation Monte Carlo en finance</h2>
        <p>
          La méthode de Monte Carlo est une technique puissante utilisée en finance quantitative pour modéliser 
          la probabilité de différents résultats dans des processus qui ne peuvent pas être facilement prédits 
          en raison de l'intervention de variables aléatoires. Cette technique est particulièrement utile pour 
          évaluer les instruments financiers complexes et les stratégies d'investissement.
        </p>
        
        <h3 className="text-lg font-bold mt-6 mb-2">Applications en gestion des risques</h3>
        <p>
          En finance, la simulation Monte Carlo permet de calculer la Value at Risk (VaR), 
          d'évaluer le risque de portefeuille, de prédire les rendements futurs et d'analyser divers 
          scénarios de marché. Notre simulateur vous permet d'ajuster les paramètres clés comme la volatilité, 
          le drift et le nombre de simulations pour obtenir des résultats précis adaptés à vos besoins d'analyse.
        </p>
        
        <h3 className="text-lg font-bold mt-6 mb-2">Paramètres du simulateur</h3>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><strong>Prix initial</strong> : Valeur de départ de l'actif financier</li>
          <li><strong>Drift (rendement attendu)</strong> : Tendance directionnelle moyenne du prix</li>
          <li><strong>Volatilité</strong> : Amplitude des variations de prix</li>
          <li><strong>Durée</strong> : Horizon temporel de la simulation en années</li>
          <li><strong>Pas de temps</strong> : Granularité de la simulation (plus élevé = plus précis)</li>
          <li><strong>Nombre de simulations</strong> : Quantité de chemins aléatoires générés</li>
        </ul>
      </div>
    </div>
  );
};

export default MonteCarloSimulator;
