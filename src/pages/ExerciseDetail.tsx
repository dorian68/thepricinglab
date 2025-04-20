
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { transformCodeBlocks } from '@/utils/codeBlockTransformer';
import PythonActivator from '@/utils/pythonActivator';
import { isPyodideLoaded } from '@/services/pyodideService';
import { safeTranslate, cleanCaptions } from '@/utils/translationUtils';

const ExerciseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Créer un titre sécurisé pour Helmet
  const safeExerciseId = cleanCaptions(id || 'Exercise');
  const pageTitle = `${safeExerciseId} | ${safeTranslate(t, 'common.exercises', 'Exercises')} | The Pricing Lab`;
  
  useEffect(() => {
    setIsLoaded(true);
    
    if (contentRef.current) {
      const timeoutId = setTimeout(() => {
        transformCodeBlocks(contentRef.current!);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [id]);
  
  // Fonction pour recharger le contenu si nécessaire
  const refreshContent = () => {
    if (contentRef.current) {
      transformCodeBlocks(contentRef.current);
    }
  };
  
  // Déterminer le contenu à afficher en fonction de l'ID
  const getExerciseContent = () => {
    // Pour cet exemple, nous utilisons un contenu codé en dur
    // Dans une application réelle, cela serait chargé à partir d'une API ou d'un CMS
    switch(id) {
      case 'monte-carlo-simulation':
        return (
          <>
            <h2>Monte Carlo Simulation Exercise</h2>
            <p>
              This exercise demonstrates how to use Monte Carlo simulation for option pricing.
            </p>
            <pre>
              <code className="language-python">
{`import numpy as np
import matplotlib.pyplot as plt

# Parameters
S0 = 100      # Initial stock price
K = 105       # Strike price
T = 1.0       # Time to maturity in years
r = 0.05      # Risk-free rate
sigma = 0.2   # Volatility
n_sims = 1000 # Number of simulations

# Generate random paths
np.random.seed(42)
z = np.random.standard_normal(n_sims)
S_T = S0 * np.exp((r - 0.5 * sigma**2) * T + sigma * np.sqrt(T) * z)

# Calculate payoff for a call option
payoffs = np.maximum(S_T - K, 0)

# Discount to present value
option_price = np.exp(-r * T) * np.mean(payoffs)

# Display results
print(f"Monte Carlo Call Option Price: {option_price:.4f}")

# Visualize the distribution of stock prices
plt.figure(figsize=(10, 6))
plt.hist(S_T, bins=50, alpha=0.7)
plt.axvline(K, color='red', linestyle='--', label=f'Strike Price (K={K})')
plt.title('Distribution of Stock Prices at Maturity')
plt.xlabel('Stock Price')
plt.ylabel('Frequency')
plt.legend()
plt.show()`}
              </code>
            </pre>
            <p>
              Try modifying the parameters and observe how they affect the option price.
            </p>
          </>
        );
      case 'barrier-options':
        return (
          <>
            <h2>Barrier Options Pricing Exercise</h2>
            <p>
              This exercise explores how to price barrier options using Monte Carlo simulation.
            </p>
            <pre>
              <code className="language-python">
{`import numpy as np
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap

# Parameters
S0 = 100      # Initial stock price
K = 100       # Strike price
H = 120       # Barrier level
T = 1.0       # Time to maturity in years
r = 0.05      # Risk-free rate
sigma = 0.2   # Volatility
dt = 0.01     # Time step
steps = int(T/dt)  # Number of time steps
n_paths = 1000  # Number of price paths

# Generating paths
np.random.seed(42)
Z = np.random.standard_normal((n_paths, steps))
S = np.zeros((n_paths, steps + 1))
S[:, 0] = S0

# Simulating price paths
for t in range(steps):
    S[:, t+1] = S[:, t] * np.exp((r - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * Z[:, t])

# Calculate payoffs for different barrier options
# Up-and-Out Call
uoc_hits_barrier = np.any(S >= H, axis=1)
uoc_payoffs = np.where(uoc_hits_barrier, 0, np.maximum(S[:, -1] - K, 0))
uoc_price = np.exp(-r * T) * np.mean(uoc_payoffs)

# Up-and-In Call
uic_hits_barrier = np.any(S >= H, axis=1)
uic_payoffs = np.where(uic_hits_barrier, np.maximum(S[:, -1] - K, 0), 0)
uic_price = np.exp(-r * T) * np.mean(uic_payoffs)

# Display results
print(f"Up-and-Out Call Option Price: {uoc_price:.4f}")
print(f"Up-and-In Call Option Price: {uic_price:.4f}")

# Visualize some random paths
plt.figure(figsize=(12, 6))

# Create custom colormap from green to red
colors = [(0, 0.8, 0), (0.8, 0, 0)]  # green to red
cmap = LinearSegmentedColormap.from_list("GreenToRed", colors, N=100)

# Sample paths to plot
sample_paths = min(20, n_paths)
indices = np.random.choice(n_paths, sample_paths, replace=False)

# Determine which paths hit the barrier
hits_barrier = uoc_hits_barrier[indices]

# Time points for x-axis
time_points = np.linspace(0, T, steps + 1)

# Plot the paths with color based on barrier hit
for i, idx in enumerate(indices):
    if hits_barrier[i]:
        plt.plot(time_points, S[idx], color="red", alpha=0.5, linewidth=1)
    else:
        plt.plot(time_points, S[idx], color="green", alpha=0.5, linewidth=1)

# Add barrier, strike, and initial price lines
plt.axhline(y=H, color='black', linestyle='--', alpha=0.7, label='Barrier (H)')
plt.axhline(y=K, color='blue', linestyle=':', alpha=0.7, label='Strike (K)')
plt.axhline(y=S0, color='purple', linestyle='-', alpha=0.5, label='Initial Price')

plt.title('Barrier Option - Sample Price Paths')
plt.xlabel('Time (years)')
plt.ylabel('Stock Price')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()`}
              </code>
            </pre>
            <p>
              Try modifying the barrier level and observe how it affects the option prices.
            </p>
          </>
        );
      case 'bsm-pricing':
        return (
          <>
            <h2>Black-Scholes-Merton Model Implementation</h2>
            <p>
              This exercise guides you through implementing the Black-Scholes-Merton model for European option pricing.
            </p>
            <pre>
              <code className="language-python">
{`import numpy as np
from scipy.stats import norm
import matplotlib.pyplot as plt

# Function to calculate d1 and d2
def calculate_d1_d2(S, K, T, r, sigma):
    """
    Calculate d1 and d2 parameters for Black-Scholes formula
    
    Parameters:
    S: Current stock price
    K: Strike price
    T: Time to maturity (in years)
    r: Risk-free interest rate
    sigma: Volatility of the underlying asset
    
    Returns:
    d1, d2: Parameters used in Black-Scholes formula
    """
    d1 = (np.log(S/K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    return d1, d2

# Black-Scholes formula for call option price
def bs_call_price(S, K, T, r, sigma):
    """
    Calculate the price of a European call option using Black-Scholes formula
    
    Parameters:
    S: Current stock price
    K: Strike price
    T: Time to maturity (in years)
    r: Risk-free interest rate
    sigma: Volatility of the underlying asset
    
    Returns:
    call_price: Theoretical price of the European call option
    """
    d1, d2 = calculate_d1_d2(S, K, T, r, sigma)
    call_price = S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
    return call_price

# Black-Scholes formula for put option price
def bs_put_price(S, K, T, r, sigma):
    """
    Calculate the price of a European put option using Black-Scholes formula
    
    Parameters:
    S: Current stock price
    K: Strike price
    T: Time to maturity (in years)
    r: Risk-free interest rate
    sigma: Volatility of the underlying asset
    
    Returns:
    put_price: Theoretical price of the European put option
    """
    d1, d2 = calculate_d1_d2(S, K, T, r, sigma)
    put_price = K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)
    return put_price

# Example usage
S = 100    # Current stock price
K = 100    # Strike price
T = 1.0    # Time to maturity (1 year)
r = 0.05   # Risk-free rate (5%)
sigma = 0.2  # Volatility (20%)

# Calculate option prices
call_price = bs_call_price(S, K, T, r, sigma)
put_price = bs_put_price(S, K, T, r, sigma)

print(f"European Call Option Price: {call_price:.4f}")
print(f"European Put Option Price: {put_price:.4f}")

# Verify put-call parity: C - P = S - K*exp(-rT)
parity_check = call_price - put_price
theoretical_parity = S - K * np.exp(-r * T)
print(f"Put-Call Parity Check: {parity_check:.4f} = {theoretical_parity:.4f}")

# Visualization: Option prices as a function of stock price
stock_prices = np.linspace(60, 140, 100)
call_prices = [bs_call_price(s, K, T, r, sigma) for s in stock_prices]
put_prices = [bs_put_price(s, K, T, r, sigma) for s in stock_prices]

plt.figure(figsize=(12, 6))
plt.plot(stock_prices, call_prices, 'b', label='Call Option')
plt.plot(stock_prices, put_prices, 'r', label='Put Option')
plt.axvline(x=K, color='green', linestyle='--', label='Strike Price')
plt.grid(True, alpha=0.3)
plt.xlabel('Stock Price')
plt.ylabel('Option Price')
plt.title('Black-Scholes Option Prices')
plt.legend()
plt.show()

# Visualization: Option prices as a function of time to maturity
times = np.linspace(0.1, 2, 100)
call_times = [bs_call_price(S, K, t, r, sigma) for t in times]
put_times = [bs_put_price(S, K, t, r, sigma) for t in times]

plt.figure(figsize=(12, 6))
plt.plot(times, call_times, 'b', label='Call Option')
plt.plot(times, put_times, 'r', label='Put Option')
plt.grid(True, alpha=0.3)
plt.xlabel('Time to Maturity (years)')
plt.ylabel('Option Price')
plt.title('Option Prices vs Time to Maturity')
plt.legend()
plt.show()

# Visualization: Option prices as a function of volatility
vols = np.linspace(0.1, 0.6, 100)
call_vols = [bs_call_price(S, K, T, r, v) for v in vols]
put_vols = [bs_put_price(S, K, T, r, v) for v in vols]

plt.figure(figsize=(12, 6))
plt.plot(vols, call_vols, 'b', label='Call Option')
plt.plot(vols, put_vols, 'r', label='Put Option')
plt.grid(True, alpha=0.3)
plt.xlabel('Volatility')
plt.ylabel('Option Price')
plt.title('Option Prices vs Volatility')
plt.legend()
plt.show()`}
              </code>
            </pre>
            <p>
              Explore how different parameters affect option prices in the Black-Scholes model.
            </p>
          </>
        );
      default:
        return (
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold mb-4">{safeTranslate(t, 'exercises.notFound', 'Exercise Not Found')}</h2>
            <p>{safeTranslate(t, 'exercises.notFoundDescription', 'The exercise you\'re looking for is either not available or still in development.')}</p>
          </div>
        );
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>
      
      <h1 className="text-3xl font-bold mb-6">{cleanCaptions(safeExerciseId)}</h1>
      
      {/* Activateur Python automatique pour les pages d'exercices */}
      <PythonActivator 
        autoLoad={true} 
        discreet={true} 
        scanOnLoad={true}
      />
      
      <div 
        ref={contentRef}
        className="prose prose-lg dark:prose-invert max-w-none mt-8"
        data-content="exercise"
        data-type="python-content"
      >
        {isLoaded && getExerciseContent()}
      </div>
      
      <div className="mt-6">
        <button 
          onClick={refreshContent}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          {safeTranslate(t, 'exercises.reloadCodeBlocks', 'Reload Code Blocks')}
        </button>
      </div>
    </div>
  );
};

export default ExerciseDetail;
