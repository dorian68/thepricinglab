
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { Loader, Play, RefreshCw, Download } from 'lucide-react';
import { usePythonExecution } from '@/hooks/usePythonExecution';
import PythonActivator from '@/utils/pythonActivator';
import { isPyodideLoaded } from '@/services/pyodideService';

const MonteCarloSimulator = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('gbm');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPyodideAvailable, setIsPyodideAvailable] = useState(false);
  const [simulation, setSimulation] = useState<any>(null);
  const { code, setCode, result, execute, reset, isPyodideAvailable: pythonAvailable } = usePythonExecution('');
  const chartRef = useRef<HTMLDivElement>(null);

  // GBM Parameters
  const [gbmParams, setGbmParams] = useState({
    initialPrice: 100,
    drift: 0.05,
    volatility: 0.2,
    timeHorizon: 1,
    timeSteps: 252,
    numPaths: 100,
    showConfidenceIntervals: true,
    confidenceLevel: 0.95
  });

  // Jump Diffusion Parameters
  const [jumpParams, setJumpParams] = useState({
    initialPrice: 100,
    drift: 0.05,
    volatility: 0.15,
    jumpIntensity: 5,
    jumpMean: -0.05,
    jumpStdDev: 0.1,
    timeHorizon: 1,
    timeSteps: 252,
    numPaths: 100
  });

  // VaR Parameters
  const [varParams, setVarParams] = useState({
    initialValue: 1000000,
    numAssets: 3,
    timeHorizon: 10,
    confidenceLevel: 0.99,
    numSimulations: 10000,
    correlationMatrix: [
      [1.0, 0.3, 0.2],
      [0.3, 1.0, 0.4],
      [0.2, 0.4, 1.0]
    ],
    assetParams: [
      { weight: 0.4, expectedReturn: 0.08, volatility: 0.2 },
      { weight: 0.3, expectedReturn: 0.05, volatility: 0.1 },
      { weight: 0.3, expectedReturn: 0.12, volatility: 0.3 }
    ]
  });

  useEffect(() => {
    // Vérifier si Pyodide est déjà chargé
    setIsPyodideAvailable(isPyodideLoaded());
    
    // Observer pour détecter si Pyodide est chargé après le montage
    const intervalId = setInterval(() => {
      if (isPyodideLoaded()) {
        setIsPyodideAvailable(true);
        clearInterval(intervalId);
      }
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const generateGBMCode = () => {
    const { initialPrice, drift, volatility, timeHorizon, timeSteps, numPaths, showConfidenceIntervals, confidenceLevel } = gbmParams;
    
    return `
import numpy as np
import matplotlib.pyplot as plt
from scipy.stats import norm

# Parameters
S0 = ${initialPrice}        # Initial price
mu = ${drift}               # Drift (expected return)
sigma = ${volatility}       # Volatility
T = ${timeHorizon}          # Time horizon in years
dt = T / ${timeSteps}       # Time step
n_steps = ${timeSteps}      # Number of time steps
n_paths = ${numPaths}       # Number of simulation paths
confidence_level = ${confidenceLevel}  # Confidence level for intervals

# Initialize arrays
time_points = np.linspace(0, T, n_steps + 1)
S = np.zeros((n_paths, n_steps + 1))
S[:, 0] = S0

# Generate random paths
np.random.seed(42)  # For reproducibility
for t in range(1, n_steps + 1):
    Z = np.random.standard_normal(n_paths)
    S[:, t] = S[:, t-1] * np.exp((mu - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * Z)

# Calculate statistics
mean_path = np.mean(S, axis=0)
median_path = np.median(S, axis=0)
std_path = np.std(S, axis=0)

# Calculate confidence intervals
z_score = norm.ppf((1 + confidence_level) / 2)
upper_ci = mean_path + z_score * std_path / np.sqrt(n_paths)
lower_ci = mean_path - z_score * std_path / np.sqrt(n_paths)

# Final price statistics
final_prices = S[:, -1]
mean_final = np.mean(final_prices)
median_final = np.median(final_prices)
min_final = np.min(final_prices)
max_final = np.max(final_prices)
std_final = np.std(final_prices)

# Calculate percentiles for the final distribution
percentiles = [1, 5, 10, 25, 50, 75, 90, 95, 99]
percentile_values = np.percentile(final_prices, percentiles)

# Print statistics
print(f"Monte Carlo Simulation Results (GBM):")
print(f"Number of paths: {n_paths}")
print(f"Time horizon: {T} years")
print(f"Initial price: ${S0}")
print(f"Expected return: {mu:.2%}")
print(f"Volatility: {sigma:.2%}")
print(f"\\nFinal Price Statistics:")
print(f"Mean: ${mean_final:.2f}")
print(f"Median: ${median_final:.2f}")
print(f"Min: ${min_final:.2f}")
print(f"Max: ${max_final:.2f}")
print(f"Std Dev: ${std_final:.2f}")
print(f"\\nPercentiles:")
for p, v in zip(percentiles, percentile_values):
    print(f"{p}th percentile: ${v:.2f}")

# Prepare data for visualization
result = {
    "type": "gbm",
    "time_points": time_points.tolist(),
    "paths": S.tolist(),
    "mean_path": mean_path.tolist(),
    "median_path": median_path.tolist(),
    "upper_ci": upper_ci.tolist(),
    "lower_ci": lower_ci.tolist(),
    "final_prices": final_prices.tolist(),
    "percentiles": percentiles,
    "percentile_values": percentile_values.tolist(),
    "statistics": {
        "mean": mean_final,
        "median": median_final,
        "min": min_final,
        "max": max_final,
        "std": std_final
    }
}

# Convert to JSON for passing back to JavaScript
import json
print("\\n\\nDATA_START")
print(json.dumps(result))
print("DATA_END")
`;
  };

  const generateJumpDiffusionCode = () => {
    const { initialPrice, drift, volatility, jumpIntensity, jumpMean, jumpStdDev, timeHorizon, timeSteps, numPaths } = jumpParams;
    
    return `
import numpy as np
import matplotlib.pyplot as plt

# Parameters
S0 = ${initialPrice}        # Initial price
mu = ${drift}               # Drift (expected return)
sigma = ${volatility}       # Volatility
lambda_j = ${jumpIntensity} # Jump intensity (average number of jumps per year)
mu_j = ${jumpMean}          # Jump mean
sigma_j = ${jumpStdDev}     # Jump standard deviation
T = ${timeHorizon}          # Time horizon in years
dt = T / ${timeSteps}       # Time step
n_steps = ${timeSteps}      # Number of time steps
n_paths = ${numPaths}       # Number of simulation paths

# Initialize arrays
time_points = np.linspace(0, T, n_steps + 1)
S = np.zeros((n_paths, n_steps + 1))
S[:, 0] = S0

# Generate random paths with jumps
np.random.seed(42)  # For reproducibility
for t in range(1, n_steps + 1):
    # Diffusion component
    Z = np.random.standard_normal(n_paths)
    diffusion = (mu - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * Z
    
    # Jump component
    jump_counts = np.random.poisson(lambda_j * dt, n_paths)
    jumps = np.zeros(n_paths)
    
    for i in range(n_paths):
        if jump_counts[i] > 0:
            jump_sizes = np.random.normal(mu_j, sigma_j, jump_counts[i])
            jumps[i] = np.sum(jump_sizes)
    
    # Combine diffusion and jumps
    S[:, t] = S[:, t-1] * np.exp(diffusion + jumps)

# Calculate statistics
mean_path = np.mean(S, axis=0)
median_path = np.median(S, axis=0)
std_path = np.std(S, axis=0)

# Final price statistics
final_prices = S[:, -1]
mean_final = np.mean(final_prices)
median_final = np.median(final_prices)
min_final = np.min(final_prices)
max_final = np.max(final_prices)
std_final = np.std(final_prices)

# Calculate percentiles for the final distribution
percentiles = [1, 5, 10, 25, 50, 75, 90, 95, 99]
percentile_values = np.percentile(final_prices, percentiles)

# Print statistics
print(f"Monte Carlo Simulation Results (Jump Diffusion):")
print(f"Number of paths: {n_paths}")
print(f"Time horizon: {T} years")
print(f"Initial price: ${S0}")
print(f"Expected return: {mu:.2%}")
print(f"Volatility: {sigma:.2%}")
print(f"Jump intensity: {lambda_j} per year")
print(f"Jump mean: {mu_j:.2%}")
print(f"Jump std dev: {sigma_j:.2%}")
print(f"\\nFinal Price Statistics:")
print(f"Mean: ${mean_final:.2f}")
print(f"Median: ${median_final:.2f}")
print(f"Min: ${min_final:.2f}")
print(f"Max: ${max_final:.2f}")
print(f"Std Dev: ${std_final:.2f}")
print(f"\\nPercentiles:")
for p, v in zip(percentiles, percentile_values):
    print(f"{p}th percentile: ${v:.2f}")

# Prepare data for visualization
result = {
    "type": "jump",
    "time_points": time_points.tolist(),
    "paths": S.tolist(),
    "mean_path": mean_path.tolist(),
    "median_path": median_path.tolist(),
    "final_prices": final_prices.tolist(),
    "percentiles": percentiles,
    "percentile_values": percentile_values.tolist(),
    "statistics": {
        "mean": mean_final,
        "median": median_final,
        "min": min_final,
        "max": max_final,
        "std": std_final
    }
}

# Convert to JSON for passing back to JavaScript
import json
print("\\n\\nDATA_START")
print(json.dumps(result))
print("DATA_END")
`;
  };

  const generateVaRCode = () => {
    const { initialValue, numAssets, timeHorizon, confidenceLevel, numSimulations, correlationMatrix, assetParams } = varParams;
    
    // Convert asset parameters to string representation
    const assetWeights = assetParams.map(p => p.weight).join(', ');
    const assetReturns = assetParams.map(p => p.expectedReturn).join(', ');
    const assetVols = assetParams.map(p => p.volatility).join(', ');
    
    // Convert correlation matrix to string representation
    const corrMatrixStr = correlationMatrix.map(row => `[${row.join(', ')}]`).join(',\n        ');
    
    return `
import numpy as np
import matplotlib.pyplot as plt
from scipy.stats import norm

# Portfolio parameters
initial_value = ${initialValue}  # Initial portfolio value
n_assets = ${numAssets}          # Number of assets
time_horizon = ${timeHorizon}    # Time horizon in days
confidence_level = ${confidenceLevel}  # VaR confidence level
n_simulations = ${numSimulations}  # Number of Monte Carlo simulations

# Asset parameters
weights = np.array([${assetWeights}])  # Portfolio weights
expected_returns = np.array([${assetReturns}])  # Annual expected returns
volatilities = np.array([${assetVols}])  # Annual volatilities

# Correlation matrix
correlation_matrix = np.array([
        ${corrMatrixStr}
    ])

# Convert annual parameters to daily
daily_returns = expected_returns / 252
daily_volatilities = volatilities / np.sqrt(252)

# Calculate covariance matrix
covariance_matrix = np.zeros((n_assets, n_assets))
for i in range(n_assets):
    for j in range(n_assets):
        covariance_matrix[i, j] = correlation_matrix[i, j] * daily_volatilities[i] * daily_volatilities[j]

# Generate correlated random returns
np.random.seed(42)
L = np.linalg.cholesky(covariance_matrix)
uncorrelated_returns = np.random.normal(0, 1, (n_simulations, n_assets))
correlated_returns = uncorrelated_returns @ L.T

# Calculate portfolio returns
portfolio_returns = np.zeros(n_simulations)
for i in range(n_simulations):
    asset_returns = daily_returns * time_horizon + correlated_returns[i] * np.sqrt(time_horizon)
    portfolio_returns[i] = np.sum(weights * asset_returns)

# Calculate portfolio values
portfolio_values = initial_value * (1 + portfolio_returns)
portfolio_changes = portfolio_values - initial_value

# Calculate VaR
var_percentile = 100 * (1 - confidence_level)
var = -np.percentile(portfolio_changes, var_percentile)
cvar = -np.mean(portfolio_changes[portfolio_changes <= -var])

# Calculate other statistics
mean_change = np.mean(portfolio_changes)
median_change = np.median(portfolio_changes)
min_change = np.min(portfolio_changes)
max_change = np.max(portfolio_changes)
std_change = np.std(portfolio_changes)

# Print results
print(f"Value at Risk (VaR) Analysis:")
print(f"Initial portfolio value: ${initial_value:,.2f}")
print(f"Time horizon: {time_horizon} days")
print(f"Confidence level: {confidence_level:.1%}")
print(f"Number of simulations: {n_simulations:,}")
print(f"\\nResults:")
print(f"VaR ({confidence_level:.1%}): ${var:,.2f}")
print(f"CVaR/Expected Shortfall: ${cvar:,.2f}")
print(f"\\nPortfolio Change Statistics:")
print(f"Mean: ${mean_change:,.2f}")
print(f"Median: ${median_change:,.2f}")
print(f"Min: ${min_change:,.2f}")
print(f"Max: ${max_change:,.2f}")
print(f"Std Dev: ${std_change:,.2f}")

# Prepare data for visualization
result = {
    "type": "var",
    "portfolio_changes": portfolio_changes.tolist(),
    "var": float(var),
    "cvar": float(cvar),
    "confidence_level": confidence_level,
    "statistics": {
        "mean": float(mean_change),
        "median": float(median_change),
        "min": float(min_change),
        "max": float(max_change),
        "std": float(std_change)
    }
}

# Convert to JSON for passing back to JavaScript
import json
print("\\n\\nDATA_START")
print(json.dumps(result))
print("DATA_END")
`;
  };

  const runSimulation = async () => {
    if (!isPyodideAvailable) {
      return;
    }
    
    setIsSimulating(true);
    
    try {
      let simulationCode = '';
      
      switch (activeTab) {
        case 'gbm':
          simulationCode = generateGBMCode();
          break;
        case 'jump':
          simulationCode = generateJumpDiffusionCode();
          break;
        case 'var':
          simulationCode = generateVaRCode();
          break;
        default:
          simulationCode = generateGBMCode();
      }
      
      setCode(simulationCode);
      await execute();
      
      // Extract JSON data from result
      if (result.result) {
        const dataStartIndex = result.result.indexOf('DATA_START') + 10;
        const dataEndIndex = result.result.indexOf('DATA_END');
        
        if (dataStartIndex > 10 && dataEndIndex > dataStartIndex) {
          const jsonData = result.result.substring(dataStartIndex, dataEndIndex).trim();
          const simulationData = JSON.parse(jsonData);
          setSimulation(simulationData);
        }
      }
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleGBMParamChange = (param: string, value: number) => {
    setGbmParams(prev => ({ ...prev, [param]: value }));
  };

  const handleJumpParamChange = (param: string, value: number) => {
    setJumpParams(prev => ({ ...prev, [param]: value }));
  };

  const handleVaRParamChange = (param: string, value: number) => {
    setVarParams(prev => ({ ...prev, [param]: value }));
  };

  const handleAssetParamChange = (index: number, param: string, value: number) => {
    setVarParams(prev => {
      const newAssetParams = [...prev.assetParams];
      newAssetParams[index] = { ...newAssetParams[index], [param]: value };
      return { ...prev, assetParams: newAssetParams };
    });
  };

  const prepareChartData = () => {
    if (!simulation) return { labels: [], datasets: [] };
    
    const { time_points, mean_path, median_path, upper_ci, lower_ci } = simulation;
    
    const datasets = [
      {
        label: 'Mean Path',
        data: mean_path.map((value: number, index: number) => ({ x: time_points[index], y: value })),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Median Path',
        data: median_path.map((value: number, index: number) => ({ x: time_points[index], y: value })),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        tension: 0.3,
        borderDash: [5, 5],
      }
    ];
    
    // Add confidence intervals if available
    if (upper_ci && lower_ci && gbmParams.showConfidenceIntervals) {
      datasets.push({
        label: `${gbmParams.confidenceLevel * 100}% Confidence Interval`,
        data: upper_ci.map((value: number, index: number) => ({ x: time_points[index], y: value })),
        borderColor: 'rgba(156, 163, 175, 0.5)',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        tension: 0.3,
        borderDash: [3, 3],
        fill: '+1',
      });
      
      datasets.push({
        label: 'Lower CI',
        data: lower_ci.map((value: number, index: number) => ({ x: time_points[index], y: value })),
        borderColor: 'rgba(156, 163, 175, 0.5)',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        tension: 0.3,
        borderDash: [3, 3],
        fill: false,
      });
    }
    
    return {
      datasets
    };
  };

  const prepareVaRChartData = () => {
    if (!simulation || simulation.type !== 'var') return { labels: [], datasets: [] };
    
    const { portfolio_changes, var: varValue, confidence_level } = simulation;
    
    // Create histogram data
    const min = Math.min(...portfolio_changes);
    const max = Math.max(...portfolio_changes);
    const binWidth = (max - min) / 30;
    const bins: { [key: number]: number } = {};
    
    portfolio_changes.forEach((change: number) => {
      const binIndex = Math.floor(change / binWidth) * binWidth;
      bins[binIndex] = (bins[binIndex] || 0) + 1;
    });
    
    const sortedBins = Object.entries(bins).sort(([a], [b]) => parseFloat(a) - parseFloat(b));
    
    // Find the VaR bin
    const varBin = sortedBins.findIndex(([bin]) => parseFloat(bin) >= -varValue);
    
    // Create datasets
    const labels = sortedBins.map(([bin]) => parseFloat(bin).toFixed(0));
    const data = sortedBins.map(([_, count]) => count);
    
    // Create colors array with VaR highlighted
    const backgroundColor = data.map((_, index) => {
      if (index < varBin) {
        return 'rgba(239, 68, 68, 0.7)'; // Red for losses beyond VaR
      }
      return 'rgba(59, 130, 246, 0.7)'; // Blue for other values
    });
    
    return {
      labels,
      datasets: [
        {
          label: 'Portfolio Change Distribution',
          data,
          backgroundColor
        }
      ]
    };
  };

  const downloadSimulationData = () => {
    if (!simulation) return;
    
    const dataStr = JSON.stringify(simulation, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `monte-carlo-${simulation.type}-simulation.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Monte Carlo Simulator | The Pricing Lab</title>
      </Helmet>
      
      <h1 className="text-3xl font-bold mb-6">Monte Carlo Simulator</h1>
      
      <PythonActivator autoLoad={true} discreet={true} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gbm">Geometric Brownian Motion</TabsTrigger>
          <TabsTrigger value="jump">Jump Diffusion</TabsTrigger>
          <TabsTrigger value="var">Value at Risk (VaR)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="gbm" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geometric Brownian Motion</CardTitle>
              <CardDescription>
                Simulate asset price paths using the standard GBM model, commonly used for stock price modeling.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="initialPrice">Initial Price ($)</Label>
                    <Input
                      id="initialPrice"
                      type="number"
                      value={gbmParams.initialPrice}
                      onChange={(e) => handleGBMParamChange('initialPrice', parseFloat(e.target.value))}
                      min={1}
                      max={10000}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="drift">Expected Return (μ)</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="drift"
                        type="number"
                        value={gbmParams.drift}
                        onChange={(e) => handleGBMParamChange('drift', parseFloat(e.target.value))}
                        min={-0.5}
                        max={0.5}
                        step={0.01}
                      />
                      <span className="text-sm text-gray-500">{(gbmParams.drift * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="volatility">Volatility (σ)</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="volatility"
                        type="number"
                        value={gbmParams.volatility}
                        onChange={(e) => handleGBMParamChange('volatility', parseFloat(e.target.value))}
                        min={0.01}
                        max={1}
                        step={0.01}
                      />
                      <span className="text-sm text-gray-500">{(gbmParams.volatility * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="timeHorizon">Time Horizon (years)</Label>
                    <Input
                      id="timeHorizon"
                      type="number"
                      value={gbmParams.timeHorizon}
                      onChange={(e) => handleGBMParamChange('timeHorizon', parseFloat(e.target.value))}
                      min={0.1}
                      max={10}
                      step={0.1}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="timeSteps">Time Steps</Label>
                    <Select
                      value={gbmParams.timeSteps.toString()}
                      onValueChange={(value) => handleGBMParamChange('timeSteps', parseInt(value))}
                    >
                      <SelectTrigger id="timeSteps">
                        <SelectValue placeholder="Select time steps" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="52">Weekly (52)</SelectItem>
                        <SelectItem value="252">Daily (252)</SelectItem>
                        <SelectItem value="1000">Intraday (1000)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="numPaths">Number of Paths</Label>
                    <Select
                      value={gbmParams.numPaths.toString()}
                      onValueChange={(value) => handleGBMParamChange('numPaths', parseInt(value))}
                    >
                      <SelectTrigger id="numPaths">
                        <SelectValue placeholder="Select number of paths" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 paths</SelectItem>
                        <SelectItem value="50">50 paths</SelectItem>
                        <SelectItem value="100">100 paths</SelectItem>
                        <SelectItem value="500">500 paths</SelectItem>
                        <SelectItem value="1000">1000 paths</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="showCI"
                      checked={gbmParams.showConfidenceIntervals}
                      onCheckedChange={(checked) => handleGBMParamChange('showConfidenceIntervals', checked ? true : false)}
                    />
                    <Label htmlFor="showCI">Show Confidence Intervals</Label>
                  </div>
                  
                  {gbmParams.showConfidenceIntervals && (
                    <div>
                      <Label htmlFor="confidenceLevel">Confidence Level</Label>
                      <div className="flex items-center space-x-2">
                        <Slider
                          id="confidenceLevel"
                          min={0.8}
                          max={0.99}
                          step={0.01}
                          value={[gbmParams.confidenceLevel]}
                          onValueChange={([value]) => handleGBMParamChange('confidenceLevel', value)}
                        />
                        <span className="text-sm text-gray-500">{(gbmParams.confidenceLevel * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={runSimulation}
                  disabled={isSimulating || !isPyodideAvailable}
                  className="w-full md:w-auto"
                >
                  {isSimulating ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Running Simulation...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Run Simulation
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="jump" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Jump Diffusion Model</CardTitle>
              <CardDescription>
                Simulate asset price paths with jumps, suitable for modeling markets with sudden price changes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="jump-initialPrice">Initial Price ($)</Label>
                    <Input
                      id="jump-initialPrice"
                      type="number"
                      value={jumpParams.initialPrice}
                      onChange={(e) => handleJumpParamChange('initialPrice', parseFloat(e.target.value))}
                      min={1}
                      max={10000}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="jump-drift">Expected Return (μ)</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="jump-drift"
                        type="number"
                        value={jumpParams.drift}
                        onChange={(e) => handleJumpParamChange('drift', parseFloat(e.target.value))}
                        min={-0.5}
                        max={0.5}
                        step={0.01}
                      />
                      <span className="text-sm text-gray-500">{(jumpParams.drift * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="jump-volatility">Volatility (σ)</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="jump-volatility"
                        type="number"
                        value={jumpParams.volatility}
                        onChange={(e) => handleJumpParamChange('volatility', parseFloat(e.target.value))}
                        min={0.01}
                        max={1}
                        step={0.01}
                      />
                      <span className="text-sm text-gray-500">{(jumpParams.volatility * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="jumpIntensity">Jump Intensity (λ)</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="jumpIntensity"
                        type="number"
                        value={jumpParams.jumpIntensity}
                        onChange={(e) => handleJumpParamChange('jumpIntensity', parseFloat(e.target.value))}
                        min={0}
                        max={20}
                        step={1}
                      />
                      <span className="text-sm text-gray-500">jumps/year</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="jumpMean">Jump Mean (μᴊ)</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="jumpMean"
                        type="number"
                        value={jumpParams.jumpMean}
                        onChange={(e) => handleJumpParamChange('jumpMean', parseFloat(e.target.value))}
                        min={-0.5}
                        max={0.5}
                        step={0.01}
                      />
                      <span className="text-sm text-gray-500">{(jumpParams.jumpMean * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="jumpStdDev">Jump Std Dev (σᴊ)</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="jumpStdDev"
                        type="number"
                        value={jumpParams.jumpStdDev}
                        onChange={(e) => handleJumpParamChange('jumpStdDev', parseFloat(e.target.value))}
                        min={0.01}
                        max={0.5}
                        step={0.01}
                      />
                      <span className="text-sm text-gray-500">{(jumpParams.jumpStdDev * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="jump-timeHorizon">Time Horizon (years)</Label>
                    <Input
                      id="jump-timeHorizon"
                      type="number"
                      value={jumpParams.timeHorizon}
                      onChange={(e) => handleJumpParamChange('timeHorizon', parseFloat(e.target.value))}
                      min={0.1}
                      max={10}
                      step={0.1}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="jump-numPaths">Number of Paths</Label>
                    <Select
                      value={jumpParams.numPaths.toString()}
                      onValueChange={(value) => handleJumpParamChange('numPaths', parseInt(value))}
                    >
                      <SelectTrigger id="jump-numPaths">
                        <SelectValue placeholder="Select number of paths" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 paths</SelectItem>
                        <SelectItem value="50">50 paths</SelectItem>
                        <SelectItem value="100">100 paths</SelectItem>
                        <SelectItem value="500">500 paths</SelectItem>
                        <SelectItem value="1000">1000 paths</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={runSimulation}
                  disabled={isSimulating || !isPyodideAvailable}
                  className="w-full md:w-auto"
                >
                  {isSimulating ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Running Simulation...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Run Simulation
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="var" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Value at Risk (VaR)</CardTitle>
              <CardDescription>
                Calculate portfolio risk metrics using Monte Carlo simulation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="initialValue">Initial Portfolio Value ($)</Label>
                    <Input
                      id="initialValue"
                      type="number"
                      value={varParams.initialValue}
                      onChange={(e) => handleVaRParamChange('initialValue', parseFloat(e.target.value))}
                      min={1000}
                      max={100000000}
                      step={1000}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="timeHorizon-var">Time Horizon (days)</Label>
                    <Input
                      id="timeHorizon-var"
                      type="number"
                      value={varParams.timeHorizon}
                      onChange={(e) => handleVaRParamChange('timeHorizon', parseFloat(e.target.value))}
                      min={1}
                      max={252}
                      step={1}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="confidenceLevel-var">Confidence Level</Label>
                    <div className="flex items-center space-x-2">
                      <Slider
                        id="confidenceLevel-var"
                        min={0.9}
                        max={0.99}
                        step={0.01}
                        value={[varParams.confidenceLevel]}
                        onValueChange={([value]) => handleVaRParamChange('confidenceLevel', value)}
                      />
                      <span className="text-sm text-gray-500">{(varParams.confidenceLevel * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="numSimulations">Number of Simulations</Label>
                    <Select
                      value={varParams.numSimulations.toString()}
                      onValueChange={(value) => handleVaRParamChange('numSimulations', parseInt(value))}
                    >
                      <SelectTrigger id="numSimulations">
                        <SelectValue placeholder="Select simulation count" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1000">1,000 simulations</SelectItem>
                        <SelectItem value="5000">5,000 simulations</SelectItem>
                        <SelectItem value="10000">10,000 simulations</SelectItem>
                        <SelectItem value="50000">50,000 simulations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Asset Parameters</h3>
                  
                  {varParams.assetParams.map((asset, index) => (
                    <div key={index} className="mb-4 p-3 border rounded-md border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-medium mb-2">Asset {index + 1}</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor={`weight-${index}`}>Weight</Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              id={`weight-${index}`}
                              type="number"
                              value={asset.weight}
                              onChange={(e) => handleAssetParamChange(index, 'weight', parseFloat(e.target.value))}
                              min={0}
                              max={1}
                              step={0.01}
                            />
                            <span className="text-sm text-gray-500">{(asset.weight * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor={`return-${index}`}>Expected Return</Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              id={`return-${index}`}
                              type="number"
                              value={asset.expectedReturn}
                              onChange={(e) => handleAssetParamChange(index, 'expectedReturn', parseFloat(e.target.value))}
                              min={-0.5}
                              max={0.5}
                              step={0.01}
                            />
                            <span className="text-sm text-gray-500">{(asset.expectedReturn * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor={`volatility-${index}`}>Volatility</Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              id={`volatility-${index}`}
                              type="number"
                              value={asset.volatility}
                              onChange={(e) => handleAssetParamChange(index, 'volatility', parseFloat(e.target.value))}
                              min={0.01}
                              max={1}
                              step={0.01}
                            />
                            <span className="text-sm text-gray-500">{(asset.volatility * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={runSimulation}
                  disabled={isSimulating || !isPyodideAvailable}
                  className="w-full md:w-auto"
                >
                  {isSimulating ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Running VaR Analysis...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Run VaR Analysis
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {simulation && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Simulation Results</CardTitle>
              <CardDescription>
                {activeTab === 'gbm' && `Geometric Brownian Motion simulation with ${gbmParams.numPaths} paths over ${gbmParams.timeHorizon} years.`}
                {activeTab === 'jump' && `Jump Diffusion simulation with ${jumpParams.numPaths} paths over ${jumpParams.timeHorizon} years.`}
                {activeTab === 'var' && `Value at Risk analysis with ${varParams.numSimulations} simulations over ${varParams.timeHorizon} days.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="h-64 w-full" ref={chartRef}>
                  {activeTab === 'var' ? (
                    <BarChart data={prepareVaRChartData()} className="h-64 w-full" />
                  ) : (
                    <LineChart data={prepareChartData()} className="h-64 w-full" />
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Final Price Statistics</h3>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Mean:</span>
                        <span className="font-medium">${simulation.statistics.mean.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Median:</span>
                        <span className="font-medium">${simulation.statistics.median.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Min:</span>
                        <span className="font-medium">${simulation.statistics.min.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max:</span>
                        <span className="font-medium">${simulation.statistics.max.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Std Dev:</span>
                        <span className="font-medium">${simulation.statistics.std.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Percentiles</h3>
                    <div className="space-y-1">
                      {simulation.percentiles && simulation.percentiles.map((percentile: number, index: number) => (
                        <div key={percentile} className="flex justify-between">
                          <span>{percentile}th percentile:</span>
                          <span className="font-medium">${simulation.percentile_values[index].toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={downloadSimulationData}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Data
                  </Button>
                  <Button variant="outline" onClick={runSimulation}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Re-run Simulation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MonteCarloSimulator;
