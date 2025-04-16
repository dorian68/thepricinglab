
import { BlogPost } from "@/types/blog";

export const quantInterviewQuestionsPost: BlogPost = {
  id: 3,
  title: "5 Classic Quant Interview Questions and How to Ace Them",
  slug: "quant-interview-questions",
  excerpt: "Master the most common technical interview questions for quantitative analyst positions at top investment banks and hedge funds.",
  content: `
      <h2>Mastering Quant Interview Questions</h2>
      <p>Quantitative finance interviews are notoriously challenging, often combining mathematical brainteasers, programming challenges, and financial theory. Here are five classic questions that frequently appear in quant interviews, along with strategies to tackle them effectively.</p>
      
      <h3>Question 1: Option Pricing Under Simplified Conditions</h3>
      <p><strong>The Question:</strong> "Consider a stock with current price $100. It can either go up 10% or down 10% in one period. The risk-free rate is 5%. What's the price of a European call option with strike price $100 and one period to expiration?"</p>
      
      <p><strong>The Approach:</strong> This is a classic one-step binomial tree problem testing your understanding of risk-neutral pricing.</p>
      
      <p><strong>Solution:</strong></p>
      <ol>
        <li>Calculate possible stock prices: Up state = $110, Down state = $90</li>
        <li>Calculate option payoffs: Up state = max(110-100, 0) = $10, Down state = max(90-100, 0) = $0</li>
        <li>Find the risk-neutral probability (p): (1.05-0.9)/(1.1-0.9) = 0.75</li>
        <li>Calculate expected option value: (0.75 × $10 + 0.25 × $0)/1.05 = $7.14</li>
      </ol>
      
      <p><strong>Key Insight:</strong> Under risk-neutral pricing, we adjust probabilities so that the expected return equals the risk-free rate, then discount at the risk-free rate.</p>
      
      <h3>Question 2: Estimating Volatility</h3>
      <p><strong>The Question:</strong> "You have daily closing prices for a stock over the past year. How would you estimate its volatility? How would your approach change if the data had gaps or if you needed to estimate future volatility?"</p>
      
      <p><strong>The Approach:</strong> This tests your understanding of statistical methods and time series properties.</p>
      
      <p><strong>Solution:</strong></p>
      <ol>
        <li>Calculate daily log returns: r_t = ln(P_t / P_{t-1})</li>
        <li>Calculate the sample standard deviation of these returns: σ_daily = sqrt(Σ(r_t - r̄)² / (n-1))</li>
        <li>Annualize: σ_annual = σ_daily × sqrt(252) (assuming 252 trading days)</li>
        <li>For gaps: Consider using an interpolation method or treating each observable period separately</li>
        <li>For forecasting: Mention GARCH models, implied volatility from options, or exponentially weighted moving average (EWMA)</li>
      </ol>
      
      <p><strong>Code Example:</strong></p>
      <pre><code>import numpy as np
import pandas as pd

def calculate_historical_volatility(prices, window=252):
    """Calculate annualized historical volatility"""
    # Calculate returns
    log_returns = np.log(prices / prices.shift(1)).dropna()
    
    # Calculate rolling volatility
    rolling_vol = log_returns.rolling(window=window).std() * np.sqrt(window)
    
    return rolling_vol

# For EWMA volatility
def calculate_ewma_volatility(prices, lambda_param=0.94):
    """Calculate EWMA volatility forecast"""
    log_returns = np.log(prices / prices.shift(1)).dropna()
    
    # Initialize
    n = len(log_returns)
    variance = np.zeros(n)
    variance[0] = log_returns[0]**2
    
    # Calculate EWMA variance
    for t in range(1, n):
        variance[t] = lambda_param * variance[t-1] + (1 - lambda_param) * log_returns[t-1]**2
    
    # Convert to volatility
    volatility = np.sqrt(variance) * np.sqrt(252)
    
    return pd.Series(volatility, index=log_returns.index)
</code></pre>
      
      <p><strong>Key Insight:</strong> Show awareness that volatility clusters (periods of high volatility tend to be followed by high volatility) and that more recent data may be more relevant for forecasting.</p>
      
      <h3>Question 3: The Monty Hall Problem</h3>
      <p><strong>The Question:</strong> "In a game show, there are three doors. Behind one door is a car; behind the others are goats. You pick a door. The host, who knows what's behind each door, opens one of the other doors to reveal a goat. Should you switch to the remaining door or stick with your original choice?"</p>
      
      <p><strong>The Approach:</strong> This classic probability puzzle tests your ability to reason through conditional probabilities.</p>
      
      <p><strong>Solution:</strong></p>
      <ul>
        <li>You should switch doors.</li>
        <li>Initially, your probability of picking the car is 1/3, and the probability it's behind the other doors is 2/3.</li>
        <li>After the host reveals a goat, the 2/3 probability is now concentrated in the one remaining door.</li>
        <li>By switching, your chance of winning increases from 1/3 to 2/3.</li>
      </ul>
      
      <p><strong>Simulation Code:</strong></p>
      <pre><code>import numpy as np

def monty_hall_simulation(num_trials=10000):
    switch_wins = 0
    stay_wins = 0
    
    for _ in range(num_trials):
        # Car is behind door 0, 1, or 2
        car_door = np.random.randint(0, 3)
        
        # Player initially chooses a door
        player_choice = np.random.randint(0, 3)
        
        # Host opens a door that's neither the car nor the player's choice
        available_doors = [i for i in range(3) if i != car_door and i != player_choice]
        # If player chose the car, host can open either remaining door
        if available_doors:
            host_door = np.random.choice(available_doors)
        else:
            # Player chose the car, so host opens one of the other doors with a goat
            host_door = np.random.choice([i for i in range(3) if i != player_choice])
        
        # The remaining door that's neither the player's choice nor the host's reveal
        remaining_door = [i for i in range(3) if i != player_choice and i != host_door][0]
        
        # Check outcomes
        if player_choice == car_door:
            stay_wins += 1
        if remaining_door == car_door:
            switch_wins += 1
    
    print(f"Staying wins: {stay_wins/num_trials:.4f}")
    print(f"Switching wins: {switch_wins/num_trials:.4f}")

monty_hall_simulation()
</code></pre>
      
      <p><strong>Key Insight:</strong> This seemingly counterintuitive result demonstrates the importance of conditional probability and Bayes' theorem in decision-making.</p>
      
      <h3>Question 4: Implementing Delta Hedging</h3>
      <p><strong>The Question:</strong> "You've sold a one-year European call option on a non-dividend-paying stock. Explain how you would delta hedge this position. What factors affect your hedging costs?"</p>
      
      <p><strong>The Approach:</strong> This tests your understanding of risk management practices and options Greeks.</p>
      
      <p><strong>Solution:</strong></p>
      <ol>
        <li>Calculate the option's delta using the Black-Scholes formula</li>
        <li>Buy delta × 100 shares of the underlying stock (e.g., if delta = 0.6, buy 60 shares)</li>
        <li>Periodically recalculate delta as the stock price, time to expiration, and implied volatility change</li>
        <li>Adjust your stock position accordingly (dynamic hedging)</li>
        <li>Factors affecting hedging costs:
          <ul>
            <li>Transaction costs for rebalancing</li>
            <li>Frequency of rebalancing (trading off costs vs. hedging precision)</li>
            <li>Volatility of the underlying (higher volatility = more frequent rebalancing)</li>
            <li>Gamma of the option (rate of change of delta)</li>
            <li>Liquidity of the underlying</li>
          </ul>
        </li>
      </ol>
      
      <p><strong>Delta Hedging Pseudocode:</strong></p>
      <pre><code># Delta hedging simulation
import numpy as np
from scipy.stats import norm

def black_scholes_delta(S, K, T, r, sigma):
    """Calculate Black-Scholes delta for a call option"""
    d1 = (np.log(S/K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    return norm.cdf(d1)

def simulate_delta_hedging(S0, K, T, r, sigma, n_steps, n_paths):
    """Simulate delta hedging P&L"""
    dt = T / n_steps
    pnl = np.zeros(n_paths)
    
    for path in range(n_paths):
        # Generate stock price path
        S = S0
        delta = black_scholes_delta(S, K, T, r, sigma)
        hedge_position = delta
        cash = -delta * S  # Initial cash outflow to buy hedge
        
        for step in range(1, n_steps + 1):
            # Generate stock price movement
            t = step * dt
            dS = S * (r * dt + sigma * np.sqrt(dt) * np.random.normal())
            S += dS
            
            # P&L from existing hedge position
            hedge_pnl = hedge_position * dS
            cash_pnl = cash * r * dt  # Interest on cash position
            
            # Update delta and rebalance
            new_delta = black_scholes_delta(S, K, T - t, r, sigma)
            delta_change = new_delta - hedge_position
            
            # Cash flow from rebalancing (negative if buying more shares)
            cash -= delta_change * S
            hedge_position = new_delta
        
        # Final payoff
        option_payoff = max(0, S - K)
        pnl[path] = cash + hedge_position * S - option_payoff
    
    return pnl
</code></pre>
      
      <p><strong>Key Insight:</strong> Delta hedging neutralizes the first-order price risk, but second-order risks (gamma, vega) remain. The profit/loss from a delta-hedged option position is primarily driven by the difference between realized and implied volatility.</p>
      
      <h3>Question 5: The Random Walk Problem</h3>
      <p><strong>The Question:</strong> "A drunk person stands at point 0 on a number line. Each minute, they take one step either left or right with equal probability. What's the probability they'll return to the origin after 2n steps? What's the expected number of visits to the origin in 2n steps?"</p>
      
      <p><strong>The Approach:</strong> This is a classic random walk problem testing combinatorial probability.</p>
      
      <p><strong>Solution:</strong></p>
      <ol>
        <li>To return to the origin after 2n steps, the walker must take exactly n steps right and n steps left.</li>
        <li>The probability is: (2n choose n) × (1/2)^(2n) = (2n)! / (n! × n! × 2^(2n))</li>
        <li>As n increases, this probability decreases according to 1/√(πn).</li>
        <li>For the expected number of visits, we sum the probability of being at the origin at each step: 
            <ul>
                <li>For odd steps, the probability is 0</li>
                <li>For even steps 2k, the probability is (2k choose k) × (1/2)^(2k)</li>
            </ul>
        </li>
        <li>The expected number of visits is approximately sqrt(8n/π)</li>
      </ol>
      
      <p><strong>Simulation Code:</strong></p>
      <pre><code>import numpy as np
from scipy.special import comb

def analytical_return_probability(n):
    """Probability of returning to origin after 2n steps"""
    return comb(2*n, n) * (0.5)**(2*n)

def expected_visits(n):
    """Expected number of visits to origin in 2n steps"""
    visits = 0
    for k in range(n+1):
        if k % 2 == 0:  # Can only return on even steps
            visits += analytical_return_probability(k//2)
    return visits

def simulate_random_walk(steps, num_trials=100000):
    """Simulate random walks and count returns to origin"""
    returns = 0
    total_visits = 0
    
    for _ in range(num_trials):
        position = 0
        visits = 0
        
        for step in range(1, steps + 1):
            position += np.random.choice([-1, 1])
            if position == 0:
                visits += 1
        
        if position == 0:
            returns += 1
        total_visits += visits
    
    return returns / num_trials, total_visits / num_trials

# Compare analytical and simulation results
n = 5
analytical_prob = analytical_return_probability(n)
simulated_prob, simulated_visits = simulate_random_walk(2*n)
expected_visit_count = expected_visits(2*n)

print(f"Analytical probability of return after {2*n} steps: {analytical_prob:.6f}")
print(f"Simulated probability of return after {2*n} steps: {simulated_prob:.6f}")
print(f"Expected visits to origin in {2*n} steps: {expected_visit_count:.6f}")
print(f"Simulated average visits to origin in {2*n} steps: {simulated_visits:.6f}")
</code></pre>
      
      <p><strong>Key Insight:</strong> Random walk problems connect to Brownian motion, which underlies many financial models, including Black-Scholes. Understanding their properties is essential in quantitative finance.</p>
      
      <h3>Preparing for Your Quant Interview</h3>
      <p>Beyond these specific problems, here are some general tips for quant interviews:</p>
      
      <ol>
        <li><strong>Think out loud</strong>: Interviewers often care more about your problem-solving approach than the final answer</li>
        <li><strong>Start with a simple case</strong>: Break complex problems down into manageable pieces</li>
        <li><strong>Check your answers</strong>: Use approximations, boundary conditions, or dimensional analysis to verify reasonableness</li>
        <li><strong>Be honest</strong>: If you don't know something, admit it and show how you'd approach finding the answer</li>
        <li><strong>Practice coding</strong>: Be prepared to implement solutions in Python, R, or other languages commonly used in finance</li>
      </ol>
      
      <h3>Conclusion</h3>
      <p>Success in quant interviews comes from a solid foundation in probability, statistics, calculus, linear algebra, and financial theory, combined with strong programming skills and practical intuition. Regular practice with problems like these will help you develop the mental agility and technical skills needed to excel in these challenging interviews.</p>
    `,
  author: {
    name: "Alex Wei, PhD",
    bio: "Former quant interviewer at Citadel and Two Sigma. Author of 'Ace the Quant Interview'. Stanford PhD in Financial Engineering.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
    social: {
      twitter: "https://twitter.com",
      linkedin: "https://linkedin.com",
    }
  },
  coverImage: "https://images.unsplash.com/photo-1484589065579-248aad0d8b13?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1759&q=80",
  tags: ["Quant Interview", "Probability", "Options", "Delta Hedging", "Career"],
  date: "October 8, 2024",
  readingTime: 15,
  relatedCourse: "intermediate/greeks"
};
