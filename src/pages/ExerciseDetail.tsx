
import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { transformCodeBlocks } from '@/utils/codeBlockTransformer';
import PythonActivator from '@/utils/pythonActivator';

const ExerciseDetail = () => {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const { t } = useTranslation();
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Créer un titre sécurisé pour Helmet
  const safeExerciseId = exerciseId || 'Exercise';
  const pageTitle = `${safeExerciseId} | Exercises | The Pricing Lab`;
  
  useEffect(() => {
    if (contentRef.current) {
      const timeoutId = setTimeout(() => {
        transformCodeBlocks(contentRef.current!);
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [exerciseId, contentRef.current]);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>
      
      <h1 className="text-3xl font-bold mb-6">{safeExerciseId}</h1>
      
      {/* Activateur Python automatique pour les pages d'exercices */}
      <PythonActivator autoLoad={true} discreet={true} />
      
      <div 
        ref={contentRef}
        className="prose prose-lg dark:prose-invert max-w-none mt-8"
        data-content="exercise"
        data-type="python-content"
      >
        {/* Le contenu de l'exercice sera injecté ici, potentiellement via CMS ou data importées */}
        {
          exerciseId === 'monte-carlo-simulation' && (
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
          )
        }
      </div>
    </div>
  );
};

export default ExerciseDetail;
