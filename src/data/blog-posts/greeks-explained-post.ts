
import { BlogPost } from "@/types/blog";

export const greeksExplainedPost: BlogPost = {
  id: 7,
  title: "The Greeks Explained: Mastering Option Sensitivities with Python",
  slug: "greeks-explained",
  excerpt: "A comprehensive guide to understanding and calculating option Greeks (Delta, Gamma, Vega, Theta, Rho) with Python implementations and practical trading strategies.",
  content: `
      <h2>Mastering the Option Greeks: A Comprehensive Guide</h2>
      <p>Option Greeks are essential tools for options traders and risk managers. These metrics help quantify the sensitivity of option prices to various factors. In this guide, we'll explain each Greek in detail and provide Python code to calculate and visualize them.</p>
      
      <h3>What Are Option Greeks?</h3>
      <p>Option Greeks are a set of risk measures named after Greek letters. Each Greek measures the sensitivity of an option's price to a specific factor:</p>
      <ul>
        <li>Delta (Δ): Sensitivity to changes in the underlying asset price</li>
        <li>Gamma (Γ): Rate of change of Delta (second derivative of price to underlying)</li>
        <li>Vega (V): Sensitivity to changes in volatility</li>
        <li>Theta (Θ): Sensitivity to time decay</li>
        <li>Rho (ρ): Sensitivity to changes in interest rates</li>
      </ul>
      
      <h3>Delta (Δ): The Hedge Ratio</h3>
      <p>Delta measures how much an option's price changes when the underlying asset price changes by $1. It ranges from 0 to 1 for calls and -1 to 0 for puts.</p>
      
      <h4>Key Characteristics of Delta:</h4>
      <ul>
        <li>Call options have positive delta (0 to 1)</li>
        <li>Put options have negative delta (-1 to 0)</li>
        <li>At-the-money options have delta around 0.5 (calls) or -0.5 (puts)</li>
        <li>Delta approaches 1 (calls) or -1 (puts) as options become deep in-the-money</li>
        <li>Delta approaches 0 as options become deep out-of-the-money</li>
        <li>Delta is often used as an approximation for the probability of finishing in-the-money</li>
      </ul>
      
      <h3>Gamma (Γ): The Change in Delta</h3>
      <p>Gamma measures the rate of change in Delta per $1 change in the underlying asset price. It's the second derivative of the option price with respect to the underlying price.</p>
      
      <h4>Key Characteristics of Gamma:</h4>
      <ul>
        <li>Highest for at-the-money options near expiration</li>
        <li>Both calls and puts have positive gamma</li>
        <li>Approaches zero for deep in-the-money and out-of-the-money options</li>
        <li>Buying options = long gamma (positive convexity)</li>
        <li>Selling options = short gamma (negative convexity)</li>
      </ul>
      
      <h3>Vega (V): Volatility Sensitivity</h3>
      <p>Vega measures the change in option price for a 1% change in implied volatility. It's not actually a Greek letter but is included in the "Greeks" family.</p>
      
      <h4>Key Characteristics of Vega:</h4>
      <ul>
        <li>Always positive for both calls and puts (higher volatility = higher option prices)</li>
        <li>Highest for at-the-money options with more time to expiration</li>
        <li>Decreases as expiration approaches</li>
        <li>Buying options = long vega (benefit from volatility increases)</li>
        <li>Selling options = short vega (benefit from volatility decreases)</li>
      </ul>
      
      <h3>Theta (Θ): Time Decay</h3>
      <p>Theta measures the change in option price with respect to the passage of time (time decay), assuming all else remains constant.</p>
      
      <h4>Key Characteristics of Theta:</h4>
      <ul>
        <li>Typically negative for both calls and puts (options lose value as time passes)</li>
        <li>Highest for at-the-money options near expiration</li>
        <li>Accelerates as expiration approaches</li>
        <li>Buying options = negative theta (time works against you)</li>
        <li>Selling options = positive theta (time works for you)</li>
      </ul>
      
      <h3>Rho (ρ): Interest Rate Sensitivity</h3>
      <p>Rho measures the change in option price with respect to changes in the risk-free interest rate.</p>
      
      <h4>Key Characteristics of Rho:</h4>
      <ul>
        <li>Call options have positive rho (higher rates = higher call prices)</li>
        <li>Put options have negative rho (higher rates = lower put prices)</li>
        <li>Higher for options with longer time to expiration</li>
        <li>Generally less significant than other Greeks in most market conditions</li>
      </ul>
      
      <h3>Python Implementation: Calculating the Greeks</h3>
      <p>Here's a Python implementation to calculate all the major Greeks using the Black-Scholes model:</p>
      
      <pre><code>import numpy as np
from scipy.stats import norm
import matplotlib.pyplot as plt

def black_scholes_greeks(S, K, T, r, sigma, option_type='call'):
    """
    Calculate option price and Greeks under Black-Scholes model
    
    Parameters:
    S: Current stock price
    K: Strike price
    T: Time to maturity in years
    r: Risk-free interest rate
    sigma: Volatility
    option_type: 'call' or 'put'
    
    Returns:
    Dictionary with price and Greeks
    """
    # Calculate d1 and d2
    d1 = (np.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    
    # Standard normal CDF and PDF
    N_d1 = norm.cdf(d1)
    N_d2 = norm.cdf(d2)
    N_neg_d1 = norm.cdf(-d1)
    N_neg_d2 = norm.cdf(-d2)
    n_d1 = norm.pdf(d1)
    
    # Calculate the option price
    if option_type == 'call':
        price = S * N_d1 - K * np.exp(-r * T) * N_d2
        delta = N_d1
        rho = K * T * np.exp(-r * T) * N_d2 / 100
    else:  # put option
        price = K * np.exp(-r * T) * N_neg_d2 - S * N_neg_d1
        delta = -N_neg_d1
        rho = -K * T * np.exp(-r * T) * N_neg_d2 / 100
    
    # Greeks that are the same formula for calls and puts
    gamma = n_d1 / (S * sigma * np.sqrt(T))
    vega = S * np.sqrt(T) * n_d1 / 100  # divide by 100 for 1% change
    theta = (-S * sigma * n_d1) / (2 * np.sqrt(T))
    
    if option_type == 'call':
        theta = theta - r * K * np.exp(-r * T) * N_d2
    else:
        theta = theta + r * K * np.exp(-r * T) * N_neg_d2
    
    # Convert theta to value per calendar day
    theta = theta / 365
    
    return {
        'price': price,
        'delta': delta,
        'gamma': gamma,
        'vega': vega,
        'theta': theta,
        'rho': rho
    }

# Example: Calculate and plot Delta across different strikes
S = 100  # Current stock price
K_range = np.arange(70, 131, 5)  # Range of strike prices
T = 0.5  # 6 months to expiration
r = 0.03  # 3% risk-free rate
sigma = 0.25  # 25% volatility

# Calculate delta for call and put at different strikes
call_delta = [black_scholes_greeks(S, K, T, r, sigma, 'call')['delta'] for K in K_range]
put_delta = [black_scholes_greeks(S, K, T, r, sigma, 'put')['delta'] for K in K_range]

# Plot delta curves
plt.figure(figsize=(10, 6))
plt.plot(K_range, call_delta, 'b-', label='Call Delta')
plt.plot(K_range, put_delta, 'r-', label='Put Delta')
plt.axvline(x=S, color='gray', linestyle='--', label='Current Price')
plt.axhline(y=0, color='black', linestyle='-', alpha=0.3)
plt.grid(True, linestyle='--', alpha=0.7)
plt.title('Option Delta vs. Strike Price')
plt.xlabel('Strike Price')
plt.ylabel('Delta')
plt.legend()
plt.tight_layout()
plt.show()

# Print all Greeks for ATM options
atm_call = black_scholes_greeks(S, S, T, r, sigma, 'call')
atm_put = black_scholes_greeks(S, S, T, r, sigma, 'put')

print(f"At-the-money Call Option (K={S}):")
for greek, value in atm_call.items():
    print(f"{greek.capitalize()}: {value:.6f}")

print(f"\\nAt-the-money Put Option (K={S}):")
for greek, value in atm_put.items():
    print(f"{greek.capitalize()}: {value:.6f}")</code></pre>

      <h3>Trading Strategies Based on Greeks</h3>
      <p>Understanding option Greeks allows traders to create specific strategies:</p>
      
      <h4>Delta-Based Strategies:</h4>
      <ul>
        <li><strong>Delta Hedging</strong>: Maintaining delta-neutral positions by offsetting option delta with the underlying</li>
        <li><strong>Directional Trades</strong>: Using high delta options for directional exposure with leverage</li>
      </ul>
      
      <h4>Gamma-Based Strategies:</h4>
      <ul>
        <li><strong>Long Gamma</strong>: Benefiting from large price movements regardless of direction</li>
        <li><strong>Gamma Scalping</strong>: Adjusting delta hedges as prices move to monetize gamma</li>
      </ul>
      
      <h4>Vega-Based Strategies:</h4>
      <ul>
        <li><strong>Volatility Trading</strong>: Long vega positions benefit from increasing volatility</li>
        <li><strong>Calendar Spreads</strong>: Exploiting different vega exposures across expirations</li>
      </ul>
      
      <h4>Theta-Based Strategies:</h4>
      <ul>
        <li><strong>Theta Harvesting</strong>: Selling options to collect premium through time decay</li>
        <li><strong>Iron Condors/Butterflies</strong>: Complex strategies designed to profit from time decay</li>
      </ul>
      
      <h3>Risk Management Using Greeks</h3>
      <p>Greeks are critical tools for risk management:</p>
      <ul>
        <li>Portfolio-level Greek exposures indicate sensitivity to market conditions</li>
        <li>Greek limits help prevent excessive exposure to specific risk factors</li>
        <li>Stress testing using Greeks helps understand portfolio behavior under different scenarios</li>
        <li>Higher-order Greeks (like Vanna and Charm) help manage complex option books</li>
      </ul>
      
      <h3>Conclusion</h3>
      <p>Option Greeks provide a powerful framework for understanding, trading, and managing risk in options. By mastering these metrics, traders and risk managers can create more sophisticated strategies and better navigate the complexities of options markets.</p>
      
      <p>Ready to apply these concepts in practice? Check out our advanced options course where we dive deeper into option Greeks, volatility surfaces, and dynamic hedging strategies.</p>
    `,
  author: {
    name: "Alex Rodriguez, PhD",
    bio: "Former head of equity derivatives trading at JP Morgan. PhD in Applied Mathematics from MIT. Author of 'Advanced Option Trading Strategies'.",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
    social: {
      twitter: "https://twitter.com",
      linkedin: "https://linkedin.com",
    }
  },
  coverImage: "https://images.unsplash.com/photo-1543286386-713bdd548da4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
  tags: ["Options", "Greeks", "Delta", "Gamma", "Vega", "Theta", "Python", "Trading Strategies"],
  date: "October 22, 2024",
  readingTime: 15,
  relatedCourse: "fundamentals/greeks"
};
