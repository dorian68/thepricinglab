
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { safeTranslate } from '../../utils/translationUtils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Chart, ChartLine, LineChart, BarChart, Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { defaultStrategies } from '@/utils/options/strategyDefaults';
import { TrendingUp, BarChart3, PieChart, Calendar, Clock, FileDown, BarChart2, ArrowUpRight, ArrowDownRight, Trophy, Star, Filter, CheckCircle, XCircle } from 'lucide-react';

// Performance metrics sample data
const strategiesPerformance = [
  {
    id: 1,
    name: 'Bull Call Spread',
    asset: 'SPY',
    totalPnL: 2150.75,
    percentReturn: 12.8,
    backtests: 12,
    winRate: 75,
    sharpeRatio: 1.42,
    sortino: 1.88,
    maxDrawdown: -8.2,
    volatility: 15.3,
    lastUpdated: '2025-04-16T14:30:00',
    status: 'active',
    chart: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(2025, 3, i + 1).toISOString().split('T')[0],
      value: 10000 * (1 + 0.004 * i + (Math.random() * 0.02 - 0.01))
    }))
  },
  {
    id: 2,
    name: 'Iron Condor',
    asset: 'AAPL',
    totalPnL: 875.40,
    percentReturn: 5.4,
    backtests: 8,
    winRate: 62,
    sharpeRatio: 0.88,
    sortino: 1.12,
    maxDrawdown: -6.5,
    volatility: 10.2,
    lastUpdated: '2025-04-16T10:15:00',
    status: 'active',
    chart: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(2025, 3, i + 1).toISOString().split('T')[0],
      value: 10000 * (1 + 0.002 * i + (Math.random() * 0.015 - 0.0075))
    }))
  },
  {
    id: 3,
    name: 'Butterfly Spread',
    asset: 'TSLA',
    totalPnL: -450.20,
    percentReturn: -3.2,
    backtests: 5,
    winRate: 40,
    sharpeRatio: -0.32,
    sortino: -0.48,
    maxDrawdown: -12.8,
    volatility: 22.5,
    lastUpdated: '2025-04-15T16:45:00',
    status: 'inactive',
    chart: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(2025, 3, i + 1).toISOString().split('T')[0],
      value: 10000 * (1 - 0.001 * i + (Math.random() * 0.025 - 0.015))
    }))
  },
  {
    id: 4,
    name: 'Long Call',
    asset: 'BTC/USD',
    totalPnL: 3850.60,
    percentReturn: 28.5,
    backtests: 10,
    winRate: 70,
    sharpeRatio: 1.95,
    sortino: 2.30,
    maxDrawdown: -15.4,
    volatility: 28.2,
    lastUpdated: '2025-04-16T09:30:00',
    status: 'active',
    chart: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(2025, 3, i + 1).toISOString().split('T')[0],
      value: 10000 * (1 + 0.008 * i + (Math.random() * 0.04 - 0.01))
    }))
  },
  {
    id: 5,
    name: 'Bear Put Spread',
    asset: 'QQQ',
    totalPnL: -210.30,
    percentReturn: -1.8,
    backtests: 7,
    winRate: 43,
    sharpeRatio: -0.12,
    sortino: -0.22,
    maxDrawdown: -8.8,
    volatility: 14.5,
    lastUpdated: '2025-04-14T11:20:00',
    status: 'inactive',
    chart: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(2025, 3, i + 1).toISOString().split('T')[0],
      value: 10000 * (1 - 0.001 * i + (Math.random() * 0.02 - 0.015))
    }))
  }
];

// Backtest history sample data
const backtestHistory = [
  {
    id: 'BT-001',
    strategyId: 1,
    date: '2025-04-16T14:30:00',
    duration: '24h',
    asset: 'SPY',
    startPrice: 478.25,
    endPrice: 482.50,
    pnl: 240.50,
    percentReturn: 4.8,
    trades: 5,
    success: true
  },
  {
    id: 'BT-002',
    strategyId: 1,
    date: '2025-04-15T10:15:00',
    duration: '24h',
    asset: 'SPY',
    startPrice: 475.80,
    endPrice: 478.25,
    pnl: 125.30,
    percentReturn: 2.5,
    trades: 3,
    success: true
  },
  {
    id: 'BT-003',
    strategyId: 2,
    date: '2025-04-16T09:45:00',
    duration: '24h',
    asset: 'AAPL',
    startPrice: 182.35,
    endPrice: 184.20,
    pnl: 95.60,
    percentReturn: 1.9,
    trades: 2,
    success: true
  },
  {
    id: 'BT-004',
    strategyId: 3,
    date: '2025-04-15T16:30:00',
    duration: '24h',
    asset: 'TSLA',
    startPrice: 195.40,
    endPrice: 190.25,
    pnl: -210.80,
    percentReturn: -4.2,
    trades: 4,
    success: false
  },
  {
    id: 'BT-005',
    strategyId: 4,
    date: '2025-04-16T08:15:00',
    duration: '24h',
    asset: 'BTC/USD',
    startPrice: 62450.75,
    endPrice: 65280.25,
    pnl: 480.35,
    percentReturn: 4.5,
    trades: 2,
    success: true
  },
  {
    id: 'BT-006',
    strategyId: 4,
    date: '2025-04-15T09:30:00',
    duration: '24h',
    asset: 'BTC/USD',
    startPrice: 60120.50,
    endPrice: 62450.75,
    pnl: 520.40,
    percentReturn: 3.9,
    trades: 3,
    success: true
  },
  {
    id: 'BT-007',
    strategyId: 5,
    date: '2025-04-14T10:45:00',
    duration: '24h',
    asset: 'QQQ',
    startPrice: 430.25,
    endPrice: 432.60,
    pnl: -85.30,
    percentReturn: -1.7,
    trades: 2,
    success: false
  }
];

const Performance = () => {
  const { t } = useTranslation();
  const [selectedStrategy, setSelectedStrategy] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('1m');
  const [activeTab, setActiveTab] = useState('overview');
  
  const strategyDetail = selectedStrategy !== null 
    ? strategiesPerformance.find(s => s.id === selectedStrategy) 
    : null;
  
  const filteredBacktests = selectedStrategy !== null
    ? backtestHistory.filter(b => b.strategyId === selectedStrategy)
    : backtestHistory;
  
  return (
    <>
      <Helmet>
        <title>{safeTranslate(t, 'tradingLab.performance', 'Performances')} | The Trading Lab</title>
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-finance-accent mb-3">
          {safeTranslate(t, 'tradingLab.performance', 'Performances')}
        </h1>
        <p className="text-finance-offwhite mb-6">
          {safeTranslate(t, 'tradingLab.performanceDesc', 'Suivez et analysez vos résultats de trading pour améliorer vos stratégies')}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-finance-charcoal p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-finance-offwhite/70">Total P&L</p>
                <p className="text-2xl font-bold text-green-500">+$6,216.25</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-green-500">+8.5% <span className="text-finance-offwhite/50">vs précédent</span></p>
            </div>
          </Card>
          
          <Card className="bg-finance-charcoal p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-finance-offwhite/70">Win Rate</p>
                <p className="text-2xl font-bold text-finance-offwhite">68.4%</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Trophy className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-blue-500">+2.1% <span className="text-finance-offwhite/50">vs précédent</span></p>
            </div>
          </Card>
          
          <Card className="bg-finance-charcoal p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-finance-offwhite/70">Ratio de Sharpe</p>
                <p className="text-2xl font-bold text-finance-offwhite">1.35</p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-full">
                <Star className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-purple-500">+0.12 <span className="text-finance-offwhite/50">vs précédent</span></p>
            </div>
          </Card>
          
          <Card className="bg-finance-charcoal p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-finance-offwhite/70">Max Drawdown</p>
                <p className="text-2xl font-bold text-red-500">-15.4%</p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-full">
                <ArrowDownRight className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-green-500">+3.2% <span className="text-finance-offwhite/50">vs précédent</span></p>
            </div>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
          <Card className="bg-finance-charcoal p-6 rounded-lg shadow-md xl:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-finance-accent">
                Performance globale
              </h2>
              <div className="flex items-center space-x-2">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="h-8 bg-finance-dark w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1w">1 semaine</SelectItem>
                    <SelectItem value="1m">1 mois</SelectItem>
                    <SelectItem value="3m">3 mois</SelectItem>
                    <SelectItem value="1y">1 an</SelectItem>
                    <SelectItem value="all">Tout</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-8">
                  <FileDown className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            
            <div className="h-[300px]">
              <LineChart
                data={Array.from({ length: 30 }, (_, i) => ({
                  x: new Date(2025, 3, i + 1).toISOString().split('T')[0],
                  y: 10000 * (1 + 0.005 * i + (Math.random() * 0.03 - 0.005))
                }))}
                xLabel="Date"
                yLabel="Valeur ($)"
                color="#3b82f6"
              />
            </div>
          </Card>
          
          <Card className="bg-finance-charcoal p-6 rounded-lg shadow-md xl:col-span-4">
            <h2 className="text-xl font-semibold text-finance-accent mb-4">
              Top Stratégies
            </h2>
            
            <div className="space-y-4">
              {strategiesPerformance
                .sort((a, b) => b.percentReturn - a.percentReturn)
                .slice(0, 3)
                .map((strategy) => (
                  <div 
                    key={strategy.id}
                    className="bg-finance-dark p-3 rounded-lg cursor-pointer hover:bg-finance-dark/80 transition-colors"
                    onClick={() => setSelectedStrategy(strategy.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-finance-offwhite">{strategy.name}</p>
                        <p className="text-xs text-finance-offwhite/70">{strategy.asset}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${strategy.percentReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {strategy.percentReturn >= 0 ? '+' : ''}{strategy.percentReturn}%
                        </p>
                        <p className="text-xs text-finance-offwhite/70">
                          Win: {strategy.winRate}%
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 h-10">
                      <LineChart
                        data={strategy.chart.map(point => ({ x: point.date, y: point.value }))}
                        showAxes={false}
                        color={strategy.percentReturn >= 0 ? '#22c55e' : '#ef4444'}
                      />
                    </div>
                  </div>
                ))}
            </div>
            
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setSelectedStrategy(null)}
            >
              Voir toutes les stratégies
            </Button>
          </Card>
        </div>
        
        {selectedStrategy === null ? (
          <Card className="bg-finance-charcoal p-6 rounded-lg shadow-md mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-finance-accent">
                Toutes les stratégies
              </h2>
              <Button variant="outline" size="sm" className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Filtrer
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stratégie</TableHead>
                    <TableHead>Actif</TableHead>
                    <TableHead>P&L</TableHead>
                    <TableHead>Return</TableHead>
                    <TableHead>Win Rate</TableHead>
                    <TableHead>Sharpe</TableHead>
                    <TableHead>Volatilité</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {strategiesPerformance.map((strategy) => (
                    <TableRow 
                      key={strategy.id}
                      className="cursor-pointer hover:bg-finance-dark/30"
                      onClick={() => setSelectedStrategy(strategy.id)}
                    >
                      <TableCell className="font-medium">{strategy.name}</TableCell>
                      <TableCell>{strategy.asset}</TableCell>
                      <TableCell className={`${strategy.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {strategy.totalPnL >= 0 ? '+' : ''}${strategy.totalPnL.toFixed(2)}
                      </TableCell>
                      <TableCell className={`${strategy.percentReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {strategy.percentReturn >= 0 ? '+' : ''}{strategy.percentReturn}%
                      </TableCell>
                      <TableCell>{strategy.winRate}%</TableCell>
                      <TableCell>{strategy.sharpeRatio.toFixed(2)}</TableCell>
                      <TableCell>{strategy.volatility}%</TableCell>
                      <TableCell>
                        {strategy.status === 'active' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-500">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-500/20 text-slate-500">
                            Inactive
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="w-24 h-12">
                          <LineChart
                            data={strategy.chart.map(point => ({ x: point.date, y: point.value }))}
                            showAxes={false}
                            color={strategy.percentReturn >= 0 ? '#22c55e' : '#ef4444'}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        ) : (
          <Card className="bg-finance-charcoal p-6 rounded-lg shadow-md mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  className="mr-2"
                  onClick={() => setSelectedStrategy(null)}
                >
                  ←
                </Button>
                <div>
                  <h2 className="text-xl font-semibold text-finance-accent">
                    {strategyDetail?.name}
                  </h2>
                  <p className="text-sm text-finance-offwhite/70">
                    {strategyDetail?.asset} • Dernière mise à jour: {new Date(strategyDetail?.lastUpdated ?? '').toLocaleString()}
                  </p>
                </div>
              </div>
              <div>
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <FileDown className="h-4 w-4" />
                  <span>Exporter</span>
                </Button>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="backtest">Backtests</TabsTrigger>
                <TabsTrigger value="scenarios">Scénarios</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-finance-dark p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-finance-offwhite mb-4">
                      Performance
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-finance-offwhite/70">Total P&L</p>
                        <p className={`text-xl font-bold ${strategyDetail?.totalPnL! >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {strategyDetail?.totalPnL! >= 0 ? '+' : ''}${strategyDetail?.totalPnL.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-finance-offwhite/70">Rendement</p>
                        <p className={`text-xl font-bold ${strategyDetail?.percentReturn! >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {strategyDetail?.percentReturn! >= 0 ? '+' : ''}{strategyDetail?.percentReturn}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-finance-offwhite/70">Drawdown Max</p>
                        <p className="text-xl font-bold text-red-500">
                          {strategyDetail?.maxDrawdown}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-finance-offwhite/70">Volatilité</p>
                        <p className="text-xl font-bold text-finance-offwhite">
                          {strategyDetail?.volatility}%
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-finance-dark p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-finance-offwhite mb-4">
                      Métriques
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-finance-offwhite/70">Win Rate</p>
                        <p className="text-xl font-bold text-finance-offwhite">
                          {strategyDetail?.winRate}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-finance-offwhite/70">Ratio de Sharpe</p>
                        <p className={`text-xl font-bold ${strategyDetail?.sharpeRatio! >= 1 ? 'text-green-500' : strategyDetail?.sharpeRatio! >= 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                          {strategyDetail?.sharpeRatio.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-finance-offwhite/70">Ratio de Sortino</p>
                        <p className={`text-xl font-bold ${strategyDetail?.sortino! >= 1 ? 'text-green-500' : strategyDetail?.sortino! >= 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                          {strategyDetail?.sortino.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-finance-offwhite/70">Tests</p>
                        <p className="text-xl font-bold text-finance-offwhite">
                          {strategyDetail?.backtests}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-finance-dark p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold text-finance-offwhite mb-4">
                    Évolution de la performance
                  </h3>
                  <div className="h-[300px]">
                    <LineChart
                      data={strategyDetail?.chart.map(point => ({ x: point.date, y: point.value })) || []}
                      xLabel="Date"
                      yLabel="Valeur ($)"
                      color={strategyDetail?.percentReturn! >= 0 ? '#22c55e' : '#ef4444'}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="backtest">
                <div className="bg-finance-dark p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold text-finance-offwhite mb-4">
                    Historique des backtests
                  </h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Actif</TableHead>
                          <TableHead>Début</TableHead>
                          <TableHead>Fin</TableHead>
                          <TableHead>P&L</TableHead>
                          <TableHead>Return</TableHead>
                          <TableHead>Trades</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBacktests.map((backtest) => (
                          <TableRow key={backtest.id}>
                            <TableCell>{new Date(backtest.date).toLocaleString()}</TableCell>
                            <TableCell>{backtest.asset}</TableCell>
                            <TableCell>${backtest.startPrice}</TableCell>
                            <TableCell>${backtest.endPrice}</TableCell>
                            <TableCell className={`${backtest.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {backtest.pnl >= 0 ? '+' : ''}${backtest.pnl.toFixed(2)}
                            </TableCell>
                            <TableCell className={`${backtest.percentReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {backtest.percentReturn >= 0 ? '+' : ''}{backtest.percentReturn}%
                            </TableCell>
                            <TableCell>{backtest.trades}</TableCell>
                            <TableCell>
                              {backtest.success ? (
                                <span className="inline-flex items-center text-green-500">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Profitable
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-red-500">
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Perte
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="scenarios">
                <div className="bg-finance-dark p-4 rounded-lg mb-6">
                  <div className="flex items-center justify-center h-40">
                    <div className="text-center">
                      <FlaskConical className="h-12 w-12 mx-auto mb-4 text-finance-accent/30" />
                      <h3 className="text-lg font-semibold text-finance-offwhite mb-2">
                        Aucun scénario testé
                      </h3>
                      <p className="text-sm text-finance-offwhite/70">
                        Testez différents scénarios de marché dans la section Scénarios
                      </p>
                      <Button className="mt-4" variant="default">
                        Aller aux scénarios
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        )}
      </div>
    </>
  );
};

export default Performance;
