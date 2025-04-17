
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4 bg-finance-charcoal">
          <h3 className="text-lg font-medium mb-4 text-finance-accent">Paramètres de simulation</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Prix initial: {formatNumber(params.initialPrice)}
              </label>
              <Slider
                value={[params.initialPrice]}
                min={10}
                max={1000}
                step={10}
                onValueChange={(value) => updateParam('initialPrice', value[0])}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Drift (rendement attendu): {(params.drift * 100).toFixed(1)}% par an
              </label>
              <Slider
                value={[params.drift]}
                min={-0.2}
                max={0.3}
                step={0.01}
                onValueChange={(value) => updateParam('drift', value[0])}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Volatilité: {(params.volatility * 100).toFixed(1)}% par an
              </label>
              <Slider
                value={[params.volatility]}
                min={0.05}
                max={1}
                step={0.05}
                onValueChange={(value) => updateParam('volatility', value[0])}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Durée: {params.duration} {params.duration === 1 ? 'an' : 'ans'}
              </label>
              <Slider
                value={[params.duration]}
                min={0.25}
                max={5}
                step={0.25}
                onValueChange={(value) => updateParam('duration', value[0])}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Pas de temps: {params.timeSteps}
              </label>
              <Slider
                value={[params.timeSteps]}
                min={52}
                max={504}
                step={52}
                onValueChange={(value) => updateParam('timeSteps', value[0])}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Nombre de simulations: {params.simulationCount}
              </label>
              <Slider
                value={[params.simulationCount]}
                min={10}
                max={1000}
                step={10}
                onValueChange={(value) => updateParam('simulationCount', value[0])}
              />
            </div>
            
            <Button 
              variant="finance" 
              className="w-full mt-2"
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
        </Card>
        
        {results && (
          <>
            <Card className="p-4 bg-finance-charcoal col-span-1 md:col-span-2">
              <h3 className="text-lg font-medium mb-4 text-finance-accent">Résultats</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-finance-steel/10 rounded">
                  <div className="text-sm text-finance-lightgray">Prix moyen final</div>
                  <div className="text-2xl font-bold text-finance-accent">{formatNumber(results.stats.mean)}</div>
                </div>
                <div className="p-3 bg-finance-steel/10 rounded">
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
            </Card>
            
            <Card className="p-4 bg-finance-charcoal col-span-1 md:col-span-3 h-80">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium text-finance-accent">Simulations Monte Carlo</h3>
                <div className="flex space-x-2">
                  <Select value={selectedMode} onValueChange={setSelectedMode}>
                    <SelectTrigger className="h-8 text-xs w-40">
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
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default MonteCarloSimulator;
