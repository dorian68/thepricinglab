
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { safeTranslate } from '../../utils/translationUtils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Chart, ChartLine, ChartBar, LineChart, BarChart, Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/chart';
import { defaultStrategies } from '@/utils/options/strategyDefaults';
import { Play, Calendar, FileDown, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import PythonActivator from '@/utils/pythonActivator';

// Données de simulation pour le POC
const mockHistoricalData = {
  dates: Array.from({ length: 24 }, (_, i) => {
    const date = new Date();
    date.setHours(i);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }),
  prices: [
    42300, 42450, 42800, 42600, 42900, 43200, 43500, 43300, 
    43100, 42700, 42500, 42300, 42100, 41800, 41500, 41200, 
    41000, 41300, 41600, 42000, 42400, 42800, 43100, 43400
  ],
  volumes: [
    120, 150, 200, 180, 250, 300, 280, 220, 
    170, 150, 130, 100, 90, 80, 110, 130, 
    140, 180, 220, 250, 270, 290, 300, 310
  ]
};

interface BacktestResult {
  strategy: string;
  asset: string;
  profitLoss: number;
  sharpeRatio: number;
  winRate: number;
  trades: {
    time: string;
    type: 'buy' | 'sell';
    price: number;
    quantity: number;
    pnl: number;
  }[];
  returns: number[];
  cumulativeReturns: number[];
}

// Simuler un backtest avec les données mockées
const runBacktest = (strategy: string, asset: string): BacktestResult => {
  // Simulation de trades
  const trades = [];
  const returns = [];
  const cumulativeReturns = [];
  let cumulativePnL = 0;
  let position = 0;
  let wins = 0;
  let losses = 0;

  for (let i = 1; i < mockHistoricalData.prices.length; i++) {
    const price = mockHistoricalData.prices[i];
    const prevPrice = mockHistoricalData.prices[i-1];
    const time = mockHistoricalData.dates[i];
    
    // Stratégie simplifiée (peut être améliorée avec des algorithmes plus sophistiqués)
    if (price > prevPrice * 1.01 && position <= 0) {
      // Signal d'achat
      const quantity = 0.1;
      position += quantity;
      trades.push({
        time,
        type: 'buy',
        price,
        quantity,
        pnl: 0
      });
    } else if (price < prevPrice * 0.99 && position > 0) {
      // Signal de vente
      const quantity = position;
      const entryPrice = trades.find(t => t.type === 'buy')?.price || 0;
      const pnl = (price - entryPrice) * quantity;
      
      if (pnl > 0) wins++;
      else losses++;
      
      cumulativePnL += pnl;
      position = 0;
      
      trades.push({
        time,
        type: 'sell',
        price,
        quantity,
        pnl
      });
    }
    
    // Calculer les rendements
    const dailyReturn = ((price / prevPrice) - 1) * 100;
    returns.push(dailyReturn);
    
    // Calculer les rendements cumulatifs
    if (cumulativeReturns.length === 0) {
      cumulativeReturns.push(dailyReturn);
    } else {
      cumulativeReturns.push(cumulativeReturns[cumulativeReturns.length - 1] + dailyReturn);
    }
  }
  
  // Calculer des métriques
  const totalTrades = wins + losses;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  
  // Simuler un ratio de Sharpe simplifié
  const averageReturn = returns.reduce((sum, val) => sum + val, 0) / returns.length;
  const stdDeviation = Math.sqrt(
    returns.reduce((sum, val) => sum + Math.pow(val - averageReturn, 2), 0) / returns.length
  );
  const sharpeRatio = stdDeviation > 0 ? averageReturn / stdDeviation : 0;
  
  return {
    strategy,
    asset,
    profitLoss: cumulativePnL,
    sharpeRatio,
    winRate,
    trades,
    returns,
    cumulativeReturns
  };
};

const Backtest = () => {
  const { t } = useTranslation();
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC/USD');
  const [selectedStrategy, setSelectedStrategy] = useState<string>(defaultStrategies[0].name);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const handleRunBacktest = () => {
    setIsRunning(true);
    // Simuler un temps de calcul
    setTimeout(() => {
      const result = runBacktest(selectedStrategy, selectedAsset);
      setBacktestResult(result);
      setIsRunning(false);
    }, 1500);
  };

  return (
    <>
      <Helmet>
        <title>{safeTranslate(t, 'tradingLab.backtest', 'Backtest')} | The Trading Lab</title>
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-finance-accent mb-3">
          {safeTranslate(t, 'tradingLab.backtest', 'Backtest')}
        </h1>
        <p className="text-finance-offwhite mb-6">
          {safeTranslate(t, 'tradingLab.backtestDesc', 'Évaluez vos stratégies sur des données historiques pour valider vos approches')}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-finance-charcoal p-6 rounded-lg shadow-md col-span-1">
            <h2 className="text-xl font-semibold text-finance-accent mb-4">
              {safeTranslate(t, 'backtest.parameters', 'Paramètres')}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-finance-offwhite mb-1">
                  {safeTranslate(t, 'backtest.asset', 'Actif')}
                </label>
                <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                  <SelectTrigger className="w-full bg-finance-dark">
                    <SelectValue placeholder="Sélectionner un actif" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BTC/USD">BTC/USD</SelectItem>
                    <SelectItem value="ETH/USD">ETH/USD</SelectItem>
                    <SelectItem value="SPY">S&P 500 (SPY)</SelectItem>
                    <SelectItem value="AAPL">Apple (AAPL)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-finance-offwhite mb-1">
                  {safeTranslate(t, 'backtest.strategy', 'Stratégie')}
                </label>
                <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                  <SelectTrigger className="w-full bg-finance-dark">
                    <SelectValue placeholder="Sélectionner une stratégie" />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultStrategies.map(strategy => (
                      <SelectItem key={strategy.id} value={strategy.name}>
                        {strategy.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom_momentum">Momentum Trading</SelectItem>
                    <SelectItem value="custom_meanreversion">Mean Reversion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-finance-offwhite mb-1">
                  {safeTranslate(t, 'backtest.timeframe', 'Période')}
                </label>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="flex-1 flex items-center justify-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    24h
                  </Button>
                </div>
                <p className="text-xs text-finance-offwhite/70 mt-1">
                  {safeTranslate(t, 'backtest.demoData', 'Données de démonstration (24h)')}
                </p>
              </div>
              
              <Button 
                onClick={handleRunBacktest}
                disabled={isRunning}
                className="w-full mt-4 bg-finance-accent hover:bg-finance-accent/80"
              >
                {isRunning ? (
                  <>
                    <Play className="h-4 w-4 mr-2 animate-pulse" />
                    {safeTranslate(t, 'backtest.running', 'Exécution...')}
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    {safeTranslate(t, 'backtest.run', 'Lancer le backtest')}
                  </>
                )}
              </Button>
            </div>
          </Card>
          
          <Card className="bg-finance-charcoal p-6 rounded-lg shadow-md col-span-2">
            <h2 className="text-xl font-semibold text-finance-accent mb-4">
              {safeTranslate(t, 'backtest.priceChart', 'Évolution des prix')}
            </h2>
            
            <div className="h-[300px]">
              <LineChart
                data={mockHistoricalData.prices.map((price, index) => ({
                  x: mockHistoricalData.dates[index],
                  y: price
                }))}
                xLabel={safeTranslate(t, 'backtest.time', 'Heure')}
                yLabel={safeTranslate(t, 'backtest.price', 'Prix ($)')}
                color="#4ade80"
              />
            </div>
          </Card>
        </div>
        
        {backtestResult && (
          <>
            <h2 className="text-2xl font-bold text-finance-accent mb-4 mt-8">
              {safeTranslate(t, 'backtest.results', 'Résultats du backtest')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card className="bg-finance-charcoal p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-finance-accent mb-4">
                  {safeTranslate(t, 'backtest.performance', 'Performance')}
                </h3>
                
                <div className="h-[300px]">
                  <LineChart
                    data={backtestResult.cumulativeReturns.map((value, index) => ({
                      x: mockHistoricalData.dates[index + 1],
                      y: value
                    }))}
                    xLabel={safeTranslate(t, 'backtest.time', 'Heure')}
                    yLabel={safeTranslate(t, 'backtest.cumulativeReturn', 'Rendement cumulé (%)')}
                    color="#3b82f6"
                  />
                </div>
              </Card>
              
              <Card className="bg-finance-charcoal p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-finance-accent mb-4">
                  {safeTranslate(t, 'backtest.metrics', 'Métriques')}
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-finance-dark p-4 rounded-lg">
                    <p className="text-sm text-finance-offwhite/70 mb-1">
                      {safeTranslate(t, 'backtest.pnl', 'Profit/Perte')}
                    </p>
                    <p className={`text-xl font-bold ${backtestResult.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      ${backtestResult.profitLoss.toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="bg-finance-dark p-4 rounded-lg">
                    <p className="text-sm text-finance-offwhite/70 mb-1">
                      {safeTranslate(t, 'backtest.winRate', 'Taux de réussite')}
                    </p>
                    <p className="text-xl font-bold text-finance-offwhite">
                      {backtestResult.winRate.toFixed(1)}%
                    </p>
                  </div>
                  
                  <div className="bg-finance-dark p-4 rounded-lg">
                    <p className="text-sm text-finance-offwhite/70 mb-1">
                      {safeTranslate(t, 'backtest.sharpeRatio', 'Ratio de Sharpe')}
                    </p>
                    <p className="text-xl font-bold text-finance-offwhite">
                      {backtestResult.sharpeRatio.toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="bg-finance-dark p-4 rounded-lg">
                    <p className="text-sm text-finance-offwhite/70 mb-1">
                      {safeTranslate(t, 'backtest.trades', 'Nombre de trades')}
                    </p>
                    <p className="text-xl font-bold text-finance-offwhite">
                      {backtestResult.trades.length}
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-between">
                  <Button variant="outline" size="sm" className="flex items-center">
                    <FileDown className="h-4 w-4 mr-2" />
                    {safeTranslate(t, 'backtest.exportResults', 'Exporter')}
                  </Button>
                  
                  <Button variant="outline" size="sm" className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    {safeTranslate(t, 'backtest.viewPerformance', 'Voir performances')}
                  </Button>
                </div>
              </Card>
            </div>
            
            <Card className="bg-finance-charcoal p-6 rounded-lg shadow-md mb-6">
              <h3 className="text-lg font-semibold text-finance-accent mb-4">
                {safeTranslate(t, 'backtest.tradingHistory', 'Historique des trades')}
              </h3>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{safeTranslate(t, 'backtest.time', 'Heure')}</TableHead>
                      <TableHead>{safeTranslate(t, 'backtest.type', 'Type')}</TableHead>
                      <TableHead>{safeTranslate(t, 'backtest.price', 'Prix')}</TableHead>
                      <TableHead>{safeTranslate(t, 'backtest.quantity', 'Quantité')}</TableHead>
                      <TableHead>{safeTranslate(t, 'backtest.pnl', 'P&L')}</TableHead>
                      <TableHead>{safeTranslate(t, 'backtest.status', 'Statut')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backtestResult.trades.map((trade, index) => (
                      <TableRow key={index}>
                        <TableCell>{trade.time}</TableCell>
                        <TableCell>
                          <span className={trade.type === 'buy' ? 'text-green-500' : 'text-red-500'}>
                            {trade.type === 'buy' ? 'Achat' : 'Vente'}
                          </span>
                        </TableCell>
                        <TableCell>${trade.price.toFixed(2)}</TableCell>
                        <TableCell>{trade.quantity.toFixed(3)}</TableCell>
                        <TableCell className={trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {trade.pnl !== 0 ? `$${trade.pnl.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell>
                          {trade.type === 'buy' ? (
                            <span className="flex items-center text-blue-500">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Exécuté
                            </span>
                          ) : (
                            <span className="flex items-center text-green-500">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Profitable
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </>
        )}
        
        {!backtestResult && !isRunning && (
          <Card className="bg-finance-charcoal p-6 rounded-lg shadow-md text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-finance-accent/50" />
            <h3 className="text-lg font-semibold text-finance-accent mb-2">
              {safeTranslate(t, 'backtest.noResults', 'Aucun résultat disponible')}
            </h3>
            <p className="text-finance-offwhite">
              {safeTranslate(t, 'backtest.runPrompt', 'Définissez vos paramètres et lancez un backtest pour voir les résultats')}
            </p>
          </Card>
        )}
        
        <PythonActivator discreet={true} scanOnLoad={false} />
      </div>
    </>
  );
};

export default Backtest;
