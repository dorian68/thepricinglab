
import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { 
  Code, 
  ChevronRight, 
  Play, 
  Save, 
  Download, 
  Upload, 
  Copy, 
  CheckCircle, 
  Share2,
  PanelLeft
} from "lucide-react";
import { useTranslation } from "react-i18next";

// Sample notebook data
const notebookCategories = [
  {
    id: "fundamentals",
    title: "Fondamentaux",
    notebooks: [
      {
        id: "black-scholes",
        title: "Modèle de Black-Scholes",
        description: "Implémentation et étude du modèle fondamental de pricing d'options",
        level: "Débutant",
        tags: ["Pricing", "Options", "Mathématiques"],
        popularity: 98,
        lastUpdated: "2025-04-10"
      },
      {
        id: "monte-carlo",
        title: "Simulations Monte Carlo",
        description: "Techniques de simulation pour le pricing d'options",
        level: "Intermédiaire",
        tags: ["Simulation", "Options", "Stochastique"],
        popularity: 85,
        lastUpdated: "2025-04-05"
      },
      {
        id: "binomial-trees",
        title: "Arbres Binomiaux",
        description: "Méthodes discrètes pour le pricing d'options",
        level: "Débutant",
        tags: ["Pricing", "Options", "Arbres"],
        popularity: 92,
        lastUpdated: "2025-03-28"
      }
    ]
  },
  {
    id: "advanced",
    title: "Avancé",
    notebooks: [
      {
        id: "heston-model",
        title: "Modèle de Heston",
        description: "Implémentation du modèle de volatilité stochastique de Heston",
        level: "Avancé",
        tags: ["Volatilité", "Stochastique", "Options"],
        popularity: 76,
        lastUpdated: "2025-04-12"
      },
      {
        id: "local-volatility",
        title: "Volatilité Locale",
        description: "Calibration et implémentation des modèles à volatilité locale",
        level: "Avancé",
        tags: ["Volatilité", "Calibration", "Options"],
        popularity: 68,
        lastUpdated: "2025-04-01"
      }
    ]
  }
];

// Notebook card component
const NotebookCard = ({ notebook }: { notebook: any }) => {
  const { t } = useTranslation();
  
  return (
    <div className="finance-card p-4 hover:border-finance-accent transition-colors duration-300">
      <div className="flex justify-between mb-2">
        <h3 className="text-lg font-medium text-finance-offwhite">{notebook.title}</h3>
        <Badge variant="level">{notebook.level}</Badge>
      </div>
      
      <p className="text-finance-lightgray text-sm mb-3">{notebook.description}</p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {notebook.tags.map((tag: string) => (
          <Badge key={tag} variant="outline" className="text-finance-lightgray text-xs">{tag}</Badge>
        ))}
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center text-finance-lightgray text-xs">
          <span className="mr-4">{t('notebooks.popularity')}: {notebook.popularity}%</span>
          <span>{t('notebooks.updated')}: {notebook.lastUpdated}</span>
        </div>
        
        <Link to={`/notebooks/${notebook.id}`} className="text-finance-accent flex items-center text-sm font-medium hover:underline">
          {t('notebooks.open')} <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

// Sample code for the interactive notebook
const sampleCode = `import numpy as np
from scipy.stats import norm
import matplotlib.pyplot as plt

def black_scholes(S, K, T, r, sigma, option_type="call"):
    """
    Black-Scholes option pricing formula
    
    Parameters:
    S: Current stock price
    K: Strike price
    T: Time to maturity (in years)
    r: Risk-free interest rate
    sigma: Volatility of the stock
    option_type: 'call' or 'put'
    
    Returns:
    Option price
    """
    d1 = (np.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    
    if option_type == "call":
        return S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
    else:  # put option
        return K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)

# Example usage
S = 100  # Current stock price
K = 100  # Strike price
T = 1.0  # Time to maturity in years
r = 0.05  # Risk-free interest rate
sigma = 0.2  # Volatility

call_price = black_scholes(S, K, T, r, sigma, "call")
put_price = black_scholes(S, K, T, r, sigma, "put")

print(f"Call Option Price: {call_price:.4f}")
print(f"Put Option Price: {put_price:.4f}")

# Plot option prices for different strike prices
strikes = np.arange(80, 121, 1)
call_prices = [black_scholes(S, k, T, r, sigma, "call") for k in strikes]
put_prices = [black_scholes(S, k, T, r, sigma, "put") for k in strikes]

plt.figure(figsize=(10, 6))
plt.plot(strikes, call_prices, 'b-', label='Call Option')
plt.plot(strikes, put_prices, 'r-', label='Put Option')
plt.grid(True)
plt.xlabel('Strike Price')
plt.ylabel('Option Price')
plt.title('Option Prices vs Strike (Black-Scholes Model)')
plt.legend()
plt.show()`;

// Sample output for the notebook
const sampleOutput = {
  text: `Call Option Price: 10.4506
Put Option Price: 5.5724`,
  chart: "https://images.unsplash.com/photo-1642104704074-907c0698cbd9"
};

const Notebooks = () => {
  const { t } = useTranslation();
  const [activeNotebook, setActiveNotebook] = useState<any>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  
  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite">
      <Navbar />
      
      {!activeNotebook ? (
        // Notebook library view
        <main className="flex-1 py-8 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold terminal-text mb-2">{t('notebooks.title')}</h1>
                <p className="text-finance-lightgray">
                  {t('notebooks.subtitle')}
                </p>
              </div>
              
              <div className="mt-4 md:mt-0 flex gap-3">
                <button className="finance-button-outline flex items-center">
                  <Upload className="mr-2 h-4 w-4" />
                  {t('notebooks.upload')}
                </button>
                <button className="finance-button flex items-center">
                  <Code className="mr-2 h-4 w-4" />
                  {t('notebooks.create')}
                </button>
              </div>
            </div>
            
            {notebookCategories.map((category) => (
              <div key={category.id} className="mb-12">
                <h2 className="text-xl font-medium mb-4">{category.title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.notebooks.map((notebook) => (
                    <NotebookCard 
                      key={notebook.id} 
                      notebook={notebook} 
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      ) : (
        // Interactive notebook view
        <main className="flex-1 flex">
          {showSidebar && (
            <div className="w-64 border-r border-finance-steel/10 bg-finance-charcoal/30 p-4">
              <h3 className="text-sm font-medium text-finance-offwhite mb-4">{t('notebooks.sections')}</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-finance-accent flex items-center text-sm">
                    <span className="w-5 h-5 flex items-center justify-center rounded bg-finance-burgundy/20 mr-2">1</span>
                    Introduction
                  </a>
                </li>
                <li>
                  <a href="#" className="text-finance-lightgray hover:text-finance-offwhite flex items-center text-sm">
                    <span className="w-5 h-5 flex items-center justify-center rounded bg-finance-steel/10 mr-2">2</span>
                    Formules mathématiques
                  </a>
                </li>
                <li>
                  <a href="#" className="text-finance-lightgray hover:text-finance-offwhite flex items-center text-sm">
                    <span className="w-5 h-5 flex items-center justify-center rounded bg-finance-steel/10 mr-2">3</span>
                    Implémentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-finance-lightgray hover:text-finance-offwhite flex items-center text-sm">
                    <span className="w-5 h-5 flex items-center justify-center rounded bg-finance-steel/10 mr-2">4</span>
                    Analyse de sensibilité
                  </a>
                </li>
                <li>
                  <a href="#" className="text-finance-lightgray hover:text-finance-offwhite flex items-center text-sm">
                    <span className="w-5 h-5 flex items-center justify-center rounded bg-finance-steel/10 mr-2">5</span>
                    Exercices pratiques
                  </a>
                </li>
              </ul>
              
              <div className="mt-6 pt-6 border-t border-finance-steel/10">
                <button className="w-full finance-button-outline text-sm mb-2">
                  {t('notebooks.exportPdf')}
                </button>
                <button className="w-full finance-button-outline text-sm">
                  {t('notebooks.exportNotebook')}
                </button>
              </div>
            </div>
          )}
          
          <div className="flex-1 overflow-auto">
            <div className="p-6 max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <button 
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="mr-4 p-2 rounded hover:bg-finance-steel/10"
                  >
                    <PanelLeft className="h-5 w-5" />
                  </button>
                  <h1 className="text-xl font-bold terminal-text">{activeNotebook.title}</h1>
                </div>
                
                <div className="flex gap-2">
                  <button className="finance-button-outline text-sm flex items-center">
                    <Save className="mr-2 h-4 w-4" />
                    {t('notebooks.save')}
                  </button>
                  <button className="finance-button text-sm flex items-center">
                    <Play className="mr-2 h-4 w-4" />
                    {t('notebooks.run')}
                  </button>
                </div>
              </div>
              
              <div className="finance-card p-6 mb-6">
                <h2 className="text-lg font-medium mb-3">Introduction</h2>
                <p className="text-finance-lightgray mb-4">
                  Le modèle de Black-Scholes est l'un des piliers de la finance quantitative moderne. 
                  Développé en 1973 par Fischer Black, Myron Scholes et Robert Merton, ce modèle 
                  fournit une formule mathématique pour estimer la valeur théorique des options 
                  européennes en négligeant tout frais de transaction et en supposant que les 
                  rendements des actions suivent une distribution log-normale.
                </p>
                
                <p className="text-finance-lightgray">
                  Dans ce notebook, nous allons explorer en détail le modèle de Black-Scholes, 
                  sa dérivation, son implémentation en Python et ses limitations pratiques.
                </p>
              </div>
              
              <div className="finance-card mb-6 overflow-hidden">
                <div className="flex justify-between items-center px-4 py-2 bg-finance-charcoal/50 border-b border-finance-steel/10">
                  <div className="flex items-center">
                    <Code className="h-4 w-4 text-finance-accent mr-2" />
                    <span className="text-sm font-medium">Code</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="p-1.5 rounded hover:bg-finance-steel/10" title="Copier">
                      <Copy className="h-4 w-4 text-finance-lightgray" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-finance-steel/10" title="Exécuter">
                      <Play className="h-4 w-4 text-finance-lightgray" />
                    </button>
                  </div>
                </div>
                
                <div className="px-4 py-3 bg-finance-dark border-b border-finance-steel/10 overflow-x-auto">
                  <pre className="text-finance-lightgray text-sm font-mono whitespace-pre">
                    {sampleCode}
                  </pre>
                </div>
                
                <div className="px-4 py-3 bg-finance-charcoal/20">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                    <span className="text-sm font-medium text-finance-offwhite">Output:</span>
                  </div>
                  
                  <pre className="text-finance-lightgray text-sm font-mono whitespace-pre mb-4">
                    {sampleOutput.text}
                  </pre>
                  
                  <div className="aspect-video bg-finance-charcoal/50 rounded overflow-hidden">
                    <img 
                      src={sampleOutput.chart} 
                      alt="Black-Scholes option prices graph" 
                      className="w-full h-full object-cover opacity-70" 
                    />
                  </div>
                </div>
              </div>
              
              <div className="finance-card p-6 mb-6">
                <h2 className="text-lg font-medium mb-3">Exercice interactif</h2>
                <p className="text-finance-lightgray mb-4">
                  Modifiez le code ci-dessus pour tracer les Greek (Delta, Gamma, Vega, Theta, Rho) 
                  en fonction du prix de l'action sous-jacente. Voici quelques pistes pour vous guider:
                </p>
                
                <ul className="list-disc pl-5 text-finance-lightgray mb-4 space-y-2">
                  <li>Calculez les dérivées partielles de la formule de Black-Scholes</li>
                  <li>Utilisez une approche numérique pour les Greeks qui n'ont pas de forme fermée</li>
                  <li>Tracez les résultats sur un graphique similaire à celui de l'exemple</li>
                </ul>
                
                <div className="flex justify-end">
                  <button className="finance-button-outline text-sm">Voir la solution</button>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <button 
                  onClick={() => setActiveNotebook(null)}
                  className="finance-button-outline text-sm"
                >
                  {t('notebooks.backToLibrary')}
                </button>
                
                <div className="flex gap-2">
                  <button className="finance-button-outline text-sm flex items-center">
                    <Share2 className="mr-2 h-4 w-4" />
                    {t('notebooks.share')}
                  </button>
                  <button className="finance-button text-sm flex items-center">
                    {t('notebooks.nextSection')}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}
      
      <Footer />
    </div>
  );
};

export default Notebooks;
