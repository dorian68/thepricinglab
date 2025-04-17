
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

// Définir les types pour les paramètres
interface SimulationParams {
  initialPrice: number;
  drift: number;
  volatility: number;
  timeSteps: number;
  duration: number;
  simulationCount: number;
}

// Fonction pour générer les trajectoires Monte Carlo
const generateMonteCarloPaths = (params: SimulationParams) => {
  const { initialPrice, drift, volatility, timeSteps, duration, simulationCount } = params;
  const dt = duration / timeSteps;
  const sqrtDt = Math.sqrt(dt);
  const paths = [];
  const finalPrices = [];
  
  // Seed pour reproduire les mêmes résultats
  setSeed(42);
  resetSeed();
  
  // Pour chaque simulation
  for (let sim = 0; sim < simulationCount; sim++) {
    const path = [initialPrice];
    let currentPrice = initialPrice;
    
    // Pour chaque pas de temps
    for (let t = 1; t <= timeSteps; t++) {
      const randomShock = (seededRandom() - 0.5) * 2; // Normaliser entre -1 et 1
      const dS = drift * currentPrice * dt + volatility * currentPrice * randomShock * sqrtDt;
      currentPrice += dS;
      path.push(currentPrice);
    }
    
    paths.push(path);
    finalPrices.push(currentPrice);
  }
  
  // Calculer les statistiques
  finalPrices.sort((a, b) => a - b);
  const mean = finalPrices.reduce((sum, price) => sum + price, 0) / simulationCount;
  const median = finalPrices[Math.floor(simulationCount / 2)];
  const min = finalPrices[0];
  const max = finalPrices[finalPrices.length - 1];
  const var95 = finalPrices[Math.floor(simulationCount * 0.05)];
  const var99 = finalPrices[Math.floor(simulationCount * 0.01)];
  
  // Transformer les chemins pour le graphique
  const formattedPaths = paths.map((path, simIndex) => {
    return path.map((price, timeIndex) => ({
      simulation: simIndex,
      time: timeIndex * dt,
      price
    }));
  });
  
  // Obtenir un échantillon de chemins pour l'affichage (pour éviter de surcharger le graphique)
  const samplePaths = [];
  const step = Math.max(1, Math.floor(simulationCount / 20)); // Max 20 chemins affichés
  
  for (let i = 0; i < simulationCount; i += step) {
    samplePaths.push(formattedPaths[i]);
  }
  
  // Organiser les données pour le graphique
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
  
  // Créer des données pour le graphique ligne par ligne
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
  
  // Créer des données simplifiées pour afficher dans un composant LineChart
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
  // États pour les paramètres
  const [params, setParams] = useState<SimulationParams>({
    initialPrice: 100,
    drift: 0.05, // 5% par an
    volatility: 0.2, // 20% par an
    timeSteps: 252,
    duration: 1, // 1 an
    simulationCount: 100
  });
  
  // États pour l'interface
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [results, setResults] = useState<any>(null);
  const [selectedMode, setSelectedMode] = useState<string>("price-simulation");
  
  // Mise à jour des paramètres
  const updateParam = (key: keyof SimulationParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };
  
  // Lancer la simulation
  const runSimulation = () => {
    setIsSimulating(true);
    
    // Simuler un délai de calcul
    setTimeout(() => {
      const simulationResults = generateMonteCarloPaths(params);
      setResults(simulationResults);
      setIsSimulating(false);
    }, 1000);
  };
  
  // Formatter un nombre pour l'affichage
  const formatNumber = (num: number) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
  // Préparer les données simplifiées pour LineChart
  const prepareChartData = () => {
    if (!results || !results.simplifiedData || !results.simplifiedData[0]) return [];
    
    // Prendre le premier chemin comme exemple pour le graphique simple
    const samplePath = results.simplifiedData[0].data;
    return samplePath.map((point: any) => ({
      x: point.x,
      y: point.y
    }));
  };
  
  // Créer des données pour le graphique VaR, simplifié pour s'adapter au composant LineChart
  const prepareVaRChartData = () => {
    if (!results) return [];
    
    // Exemple simplifié pour VaR
    return [
      { x: 0, y: params.initialPrice },
      { x: params.duration, y: results.stats.mean },
      { x: params.duration, y: results.stats.var95 }
    ];
  };
  
  return (
    <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8 max-w-7xl">
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
                  // Afficher quelques trajectoires à titre d'exemple
                  <LineChart 
                    data={prepareChartData()}
                    color="#8884d8"
                    xLabel="Temps (années)"
                    yLabel="Prix"
                    animate={false}
                  />
                ) : (
                  // Afficher l'analyse VaR
                  <LineChart 
                    data={prepareVaRChartData()}
                    color="#ea384c"
                    xLabel="Temps (années)"
                    yLabel="Prix"
                    animate={false}
                  />
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
    </div>
  );
};

export default MonteCarloSimulator;
