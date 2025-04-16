
import { BlogPost } from "@/types/blog";

export const blackScholesPost: BlogPost = {
  id: 1,
  title: "Understanding the Black-Scholes Model in 10 Minutes (with Python Code)",
  slug: "understanding-black-scholes-model",
  excerpt: "A simplified explanation of the revolutionary option pricing model that won the Nobel Prize, with practical Python implementation examples.",
  content: `
    <h2>The Revolutionary Black-Scholes Model Explained Simply</h2>
    <p>The Black-Scholes model revolutionized financial markets by providing a mathematical framework for option pricing. In this article, we'll break down the complex formula into understandable components and show you how to implement it in Python.</p>
    
    <h3>What Is the Black-Scholes Model?</h3>
    <p>Developed by Fischer Black, Myron Scholes, and Robert Merton in 1973, the Black-Scholes model provides a theoretical estimate of the price of European-style options. The model assumes that the price of heavily traded assets follows a geometric Brownian motion with constant drift and volatility.</p>
    
    <h3>The Key Assumptions</h3>
    <ul>
      <li>The stock price follows a lognormal distribution</li>
      <li>There is no arbitrage opportunity</li>
      <li>It's possible to borrow and lend at a constant risk-free interest rate</li>
      <li>No transaction costs or taxes</li>
      <li>All securities are perfectly divisible</li>
      <li>No dividends during the life of the option</li>
    </ul>
    
    <h3>The Formula Simplified</h3>
    <p>For a call option, the Black-Scholes formula is:</p>
    <pre><code>C = S₀ × N(d₁) - K × e^(-rT) × N(d₂)</code></pre>
    <p>Where:</p>
    <ul>
      <li>C = Call option price</li>
      <li>S₀ = Current stock price</li>
      <li>K = Strike price</li>
      <li>r = Risk-free interest rate</li>
      <li>T = Time to maturity (in years)</li>
      <li>N = Cumulative distribution function of the standard normal distribution</li>
      <li>d₁ and d₂ are calculated values incorporating volatility</li>
    </ul>
    
    <h3>Python Implementation</h3>
    <p>Here's a simple Python implementation of the Black-Scholes model:</p>
    
    <pre><code>import numpy as np
from scipy.stats import norm

def black_scholes(S, K, T, r, sigma, option_type='call'):
    """
    Calculate Black-Scholes option price for a call or put
    
    Parameters:
    S: Current stock price
    K: Strike price
    T: Time to maturity in years
    r: Risk-free interest rate
    sigma: Volatility
    option_type: 'call' or 'put'
    
    Returns:
    Option price
    """
    d1 = (np.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    
    if option_type == 'call':
        price = S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
    else:
        price = K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)
        
    return price

# Example usage
S = 100    # Current stock price
K = 100    # Strike price
T = 1      # One year until expiration
r = 0.05   # 5% risk-free rate
sigma = 0.2  # 20% volatility

call_price = black_scholes(S, K, T, r, sigma, 'call')
put_price = black_scholes(S, K, T, r, sigma, 'put')

print(f"Call option price: ${call_price:.2f}")
print(f"Put option price: ${put_price:.2f}")</code></pre>

    <h3>The Greeks: Sensitivities that Matter</h3>
    <p>The "Greeks" are the sensitivities of option prices to various factors:</p>
    <ul>
      <li><strong>Delta (Δ)</strong>: Sensitivity to changes in the underlying asset price</li>
      <li><strong>Gamma (Γ)</strong>: Rate of change of Delta</li>
      <li><strong>Theta (Θ)</strong>: Sensitivity to time decay</li>
      <li><strong>Vega (V)</strong>: Sensitivity to volatility</li>
      <li><strong>Rho (ρ)</strong>: Sensitivity to interest rates</li>
    </ul>
    
    <h3>Limitations of the Model</h3>
    <p>While revolutionary, the Black-Scholes model has limitations:</p>
    <ul>
      <li>Assumes constant volatility (doesn't account for volatility smile/skew)</li>
      <li>Works for European options only (no early exercise)</li>
      <li>Assumes no dividends and continuous trading</li>
      <li>Doesn't account for market frictions</li>
    </ul>
    
    <h3>Beyond Black-Scholes</h3>
    <p>Modern pricing models extend Black-Scholes to address its limitations:</p>
    <ul>
      <li>Heston model for stochastic volatility</li>
      <li>SABR model for volatility smile</li>
      <li>Local volatility models (Dupire equation)</li>
      <li>Jump-diffusion models for sudden price movements</li>
    </ul>
    
    <h3>Conclusion</h3>
    <p>The Black-Scholes model remains a cornerstone in financial mathematics despite its limitations. Understanding it is essential for anyone interested in options trading or quantitative finance. It provides a theoretical foundation and a starting point for more complex models that address real-world market dynamics.</p>
    
    <p>Ready to deepen your understanding? Check out our comprehensive Black-Scholes course where we explore implementations, extensions, and practical applications in depth.</p>
  `,
  author: {
    name: "Dr. Michael Laurent",
    bio: "Quantitative analyst with 15 years experience at Goldman Sachs. PhD in Financial Mathematics from Princeton University.",
    avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
    social: {
      twitter: "https://twitter.com",
      linkedin: "https://linkedin.com",
    }
  },
  coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
  tags: ["Black-Scholes", "Options", "Python", "Pricing Models", "Quantitative Finance"],
  date: "October 15, 2024",
  readingTime: 10,
  relatedCourse: "fundamentals/black-scholes"
};
