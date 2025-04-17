
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { safeTranslate } from '../../utils/translationUtils';
import PythonExercise from '@/components/python/PythonExercise';

const TradingExercises = () => {
  const { t } = useTranslation();

  // Exemple d'exercice Python pour les options
  const blackScholesProblem = `
    <p>Implémentez le modèle de Black-Scholes pour calculer le prix d'une option européenne.</p>
    <p>Utilisez les formules suivantes:</p>
    <ul>
      <li>Prix Call = S * N(d1) - K * exp(-rT) * N(d2)</li>
      <li>Prix Put = K * exp(-rT) * N(-d2) - S * N(-d1)</li>
      <li>d1 = (ln(S/K) + (r + σ²/2)T) / (σ√T)</li>
      <li>d2 = d1 - σ√T</li>
    </ul>
    <p>Où:</p>
    <ul>
      <li>S: prix du sous-jacent</li>
      <li>K: prix d'exercice</li>
      <li>r: taux sans risque</li>
      <li>T: temps jusqu'à maturité (en années)</li>
      <li>σ: volatilité</li>
      <li>N(): fonction de répartition de la loi normale</li>
    </ul>
  `;

  const blackScholesInitialCode = `import numpy as np
from scipy.stats import norm

def black_scholes(S, K, T, r, sigma, option_type="call"):
    """
    Calcule le prix d'une option européenne avec le modèle de Black-Scholes
    
    Args:
        S: Prix du sous-jacent
        K: Prix d'exercice
        T: Temps jusqu'à maturité (en années)
        r: Taux sans risque
        sigma: Volatilité
        option_type: Type d'option ("call" ou "put")
        
    Returns:
        Prix de l'option
    """
    # Implémentez le calcul de d1 et d2
    
    # Implémentez le calcul du prix selon le type d'option
    
    return 0  # Remplacez cette valeur par votre calcul

# Exemple d'utilisation
S = 100    # Prix du sous-jacent
K = 100    # Prix d'exercice
T = 1      # Maturité (1 an)
r = 0.05   # Taux sans risque de 5%
sigma = 0.2  # Volatilité de 20%

call_price = black_scholes(S, K, T, r, sigma, "call")
put_price = black_scholes(S, K, T, r, sigma, "put")

print(f"Prix du Call: {call_price:.4f}")
print(f"Prix du Put: {put_price:.4f}")
`;

  const blackScholesSolution = `import numpy as np
from scipy.stats import norm

def black_scholes(S, K, T, r, sigma, option_type="call"):
    """
    Calcule le prix d'une option européenne avec le modèle de Black-Scholes
    
    Args:
        S: Prix du sous-jacent
        K: Prix d'exercice
        T: Temps jusqu'à maturité (en années)
        r: Taux sans risque
        sigma: Volatilité
        option_type: Type d'option ("call" ou "put")
        
    Returns:
        Prix de l'option
    """
    # Calcul de d1 et d2
    d1 = (np.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    
    # Calcul du prix selon le type d'option
    if option_type.lower() == "call":
        price = S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
    else:  # put
        price = K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)
    
    return price

# Exemple d'utilisation
S = 100    # Prix du sous-jacent
K = 100    # Prix d'exercice
T = 1      # Maturité (1 an)
r = 0.05   # Taux sans risque de 5%
sigma = 0.2  # Volatilité de 20%

call_price = black_scholes(S, K, T, r, sigma, "call")
put_price = black_scholes(S, K, T, r, sigma, "put")

print(f"Prix du Call: {call_price:.4f}")
print(f"Prix du Put: {put_price:.4f}")

# Visualisation de la sensibilité au prix du sous-jacent
import matplotlib.pyplot as plt

# Créer une gamme de prix du sous-jacent
S_range = np.linspace(70, 130, 100)
call_prices = [black_scholes(s, K, T, r, sigma, "call") for s in S_range]
put_prices = [black_scholes(s, K, T, r, sigma, "put") for s in S_range]

plt.figure(figsize=(10, 6))
plt.plot(S_range, call_prices, 'b', label='Call')
plt.plot(S_range, put_prices, 'r', label='Put')
plt.axvline(x=K, color='g', linestyle='--', label='Prix d\'exercice')
plt.grid(True)
plt.xlabel('Prix du sous-jacent')
plt.ylabel('Prix de l\'option')
plt.title('Prix d\'options selon le modèle de Black-Scholes')
plt.legend()
plt.show()
`;

  const blackScholesHints = [
    "Pour calculer d1, utilisez la formule: d1 = (ln(S/K) + (r + σ²/2)T) / (σ√T)",
    "Pour calculer d2, utilisez la formule: d2 = d1 - σ√T",
    "Utilisez norm.cdf() de scipy.stats pour la fonction de répartition de la loi normale",
    "Pour un call: S * N(d1) - K * exp(-rT) * N(d2), pour un put: K * exp(-rT) * N(-d2) - S * N(-d1)"
  ];

  return (
    <>
      <Helmet>
        <title>{safeTranslate(t, 'tradingLab.exercises', 'Exercices')} | The Trading Lab</title>
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-finance-accent mb-6">
          {safeTranslate(t, 'tradingLab.exercises', 'Exercices')}
        </h1>
        <p className="text-finance-offwhite mb-8">
          {safeTranslate(t, 'tradingLab.exercisesDesc', 'Practice with interactive exercises to improve your trading skills')}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-finance-charcoal p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-finance-accent mb-4">Black-Scholes</h2>
            <p className="text-finance-offwhite mb-4">
              Implémentez le modèle de Black-Scholes pour calculer le prix d'une option européenne.
            </p>
            <PythonExercise
              title="Modèle de Black-Scholes"
              problem={blackScholesProblem}
              initialCode={blackScholesInitialCode}
              solution={blackScholesSolution}
              hints={blackScholesHints}
            />
          </div>
          
          <div className="bg-finance-charcoal p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-finance-accent mb-4">Monte Carlo</h2>
            <p className="text-finance-offwhite mb-4">
              D'autres exercices interactifs seront bientôt disponibles...
            </p>
          </div>
        </div>
        
        <div className="bg-finance-charcoal p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-finance-accent mb-4">Évaluation d'options exotiques</h2>
          <p className="text-finance-offwhite mb-4">
            Plus d'exercices en cours de développement...
          </p>
        </div>
      </div>
    </>
  );
};

export default TradingExercises;
