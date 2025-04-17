
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { LineChart } from '@/components/ui/chart';
import { Calculator, Upload, RefreshCw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const assets = [
  { id: 'btc', name: 'Bitcoin (BTC/USD)' },
  { id: 'eth', name: 'Ethereum (ETH/USD)' },
  { id: 'spy', name: 'S&P 500 ETF (SPY)' },
  { id: 'aapl', name: 'Apple Inc. (AAPL)' },
  { id: 'tsla', name: 'Tesla Inc. (TSLA)' },
  { id: 'eurusd', name: 'EUR/USD' },
];

// Générer des données de prix synthétiques (log-normal)
const generatePriceSeries = (days: number, initialPrice: number, volatility: number, drift: number) => {
  const prices = [initialPrice];
  const dailyReturns = [];
  const rollingVol = [];

  for (let i = 1; i < days; i++) {
    // Générer un retour journalier log-normal
    const randomReturn = (Math.random() - 0.5) * 2 * volatility / Math.sqrt(252);
    const dailyReturn = drift / 252 + randomReturn;
    dailyReturns.push(dailyReturn * 100); // en pourcentage
    
    // Calculer le nouveau prix
    const newPrice = prices[i - 1] * (1 + dailyReturn);
    prices.push(newPrice);
    
    // Calculer la volatilité glissante si on a assez de données
    if (i >= 20) {
      const window = dailyReturns.slice(i - 20, i);
      const mean = window.reduce((sum, val) => sum + val, 0) / window.length;
      const variance = window.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / window.length;
      const stdDev = Math.sqrt(variance);
      const annualizedVol = stdDev * Math.sqrt(252);
      rollingVol.push({ day: i, vol: annualizedVol });
    } else {
      rollingVol.push({ day: i, vol: volatility * 100 }); // Utiliser la vol initiale pour les premiers jours
    }
  }

  return {
    prices,
    dailyReturns,
    rollingVol
  };
};

const VolatilityCalculator: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState(assets[0].id);
  const [period, setPeriod] = useState<string>('1y');
  const [windowSize, setWindowSize] = useState<number>(20);
  const [fileUploaded, setFileUploaded] = useState<boolean>(false);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [results, setResults] = useState<any>(null);

  // Fonction de calcul de la volatilité historique
  const calculateHistoricalVolatility = () => {
    setIsCalculating(true);
    
    // Simuler un délai de calcul
    setTimeout(() => {
      // Générer des données synthétiques pour la démo
      const data = generatePriceSeries(
        252, // Un an de trading
        selectedAsset === 'btc' ? 30000 : 
        selectedAsset === 'eth' ? 2000 : 
        selectedAsset === 'spy' ? 450 :
        selectedAsset === 'aapl' ? 170 :
        selectedAsset === 'tsla' ? 200 : 1.1, // EUR/USD
        selectedAsset === 'btc' ? 0.65 : // 65% pour BTC
        selectedAsset === 'eth' ? 0.75 : // 75% pour ETH
        selectedAsset === 'tsla' ? 0.55 : // 55% pour TSLA
        0.20, // 20% pour les autres
        0.1 // drift de 10%
      );
      
      // Calculer les statistiques
      const returns = data.dailyReturns;
      const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
      const variance = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / returns.length;
      const stdDev = Math.sqrt(variance);
      const annualizedVol = stdDev * Math.sqrt(252);
      
      // Préparer les données pour le graphe
      const priceChartData = data.prices.map((price, index) => ({
        x: index,
        y: price
      }));
      
      const returnsChartData = data.dailyReturns.map((ret, index) => ({
        x: index + 1,
        y: ret
      }));
      
      const volChartData = data.rollingVol.map(item => ({
        x: item.day,
        y: item.vol
      }));
      
      setResults({
        meanReturn: mean.toFixed(2),
        dailyVol: stdDev.toFixed(2),
        annualizedVol: annualizedVol.toFixed(2),
        min: Math.min(...returns).toFixed(2),
        max: Math.max(...returns).toFixed(2),
        priceChartData,
        returnsChartData,
        volChartData
      });
      
      setIsCalculating(false);
    }, 1000);
  };

  const handleAssetChange = (value: string) => {
    setSelectedAsset(value);
    setResults(null);
  };

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    setResults(null);
  };
  
  const handleFileUpload = () => {
    // Simuler un upload de fichier
    setFileUploaded(true);
    setResults(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4 bg-finance-charcoal">
          <h3 className="text-lg font-medium mb-4 text-finance-accent">Paramètres d'entrée</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Actif</label>
              <Select value={selectedAsset} onValueChange={handleAssetChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un actif" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map(asset => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs flex items-center gap-1"
                onClick={handleFileUpload}
              >
                <Upload size={12} />
                <span>Upload CSV</span>
              </Button>
              {fileUploaded && (
                <span className="text-xs text-green-500">Fichier prêt</span>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Période</label>
              <Select value={period} onValueChange={handlePeriodChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 mois</SelectItem>
                  <SelectItem value="3m">3 mois</SelectItem>
                  <SelectItem value="6m">6 mois</SelectItem>
                  <SelectItem value="1y">1 an</SelectItem>
                  <SelectItem value="2y">2 ans</SelectItem>
                  <SelectItem value="5y">5 ans</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Fenêtre glissante (jours): {windowSize}
              </label>
              <Slider
                value={[windowSize]}
                min={5}
                max={60}
                step={1}
                onValueChange={(value) => setWindowSize(value[0])}
              />
            </div>
            
            <Button 
              variant="finance" 
              className="w-full mt-2"
              onClick={calculateHistoricalVolatility}
              disabled={isCalculating}
            >
              {isCalculating ? (
                <div className="flex items-center">
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Calcul en cours...
                </div>
              ) : (
                <div className="flex items-center">
                  <Calculator className="mr-2 h-4 w-4" />
                  Calculer la volatilité
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
                  <div className="text-sm text-finance-lightgray">Volatilité annualisée</div>
                  <div className="text-2xl font-bold text-finance-accent">{results.annualizedVol}%</div>
                </div>
                <div className="p-3 bg-finance-steel/10 rounded">
                  <div className="text-sm text-finance-lightgray">Volatilité quotidienne</div>
                  <div className="text-2xl font-bold text-finance-accent">{results.dailyVol}%</div>
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
                    <TableCell>Rendement moyen quotidien</TableCell>
                    <TableCell>{results.meanReturn}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Rendement min quotidien</TableCell>
                    <TableCell>{results.min}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Rendement max quotidien</TableCell>
                    <TableCell>{results.max}%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
            
            <Card className="p-4 bg-finance-charcoal col-span-1 md:col-span-3 h-80">
              <h3 className="text-lg font-medium mb-2 text-finance-accent">Évolution de la volatilité glissante</h3>
              <LineChart 
                data={results.volChartData}
                color="#ea384c"
                xLabel="Jours"
                yLabel="Volatilité (%)"
              />
            </Card>
            
            <Card className="p-4 bg-finance-charcoal col-span-1 md:col-span-3 h-80">
              <h3 className="text-lg font-medium mb-2 text-finance-accent">Évolution du prix</h3>
              <LineChart 
                data={results.priceChartData}
                color="#8884d8"
                xLabel="Jours"
                yLabel="Prix"
              />
            </Card>
            
            <Card className="p-4 bg-finance-charcoal col-span-1 md:col-span-3 h-80">
              <h3 className="text-lg font-medium mb-2 text-finance-accent">Rendements quotidiens</h3>
              <LineChart 
                data={results.returnsChartData}
                color="#82ca9d"
                xLabel="Jours"
                yLabel="Rendement (%)"
              />
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default VolatilityCalculator;
