import { useState } from "react";
import Navbar from "../components/Navbar";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Check, 
  ChevronRight, 
  Award, 
  BarChart, 
  Filter, 
  Search,
  Brain,
  Calculator,
  PieChart,
  Sigma,
  Timer,
  X
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

// Filter categories
const categories = [
  { id: "all", name: "Tous" },
  { id: "options", name: "Options" },
  { id: "volatility", name: "Volatilité" },
  { id: "rates", name: "Taux d'intérêt" },
  { id: "risk", name: "Gestion du risque" },
  { id: "simulation", name: "Simulation" }
];

// Difficulty levels
const levels = [
  { id: "beginner", name: "Débutant" },
  { id: "intermediate", name: "Intermédiaire" },
  { id: "advanced", name: "Avancé" },
  { id: "expert", name: "Expert" }
];

// Sample exercise data
const exercisesData = [
  {
    id: "bsm-pricing",
    title: "Pricing d'options avec Black-Scholes",
    category: "options",
    level: "Débutant",
    description: "Calculez le prix d'une option européenne en utilisant le modèle de Black-Scholes.",
    estimatedTime: "15-20 min",
    completionRate: 85,
    popularity: 98,
    hasSimulation: true
  },
  {
    id: "barrier-options",
    title: "Options à barrière",
    category: "options",
    level: "Intermédiaire",
    description: "Implémentez un pricer pour options à barrière knock-in et knock-out.",
    estimatedTime: "30-40 min",
    completionRate: 62,
    popularity: 76,
    hasSimulation: true
  },
  {
    id: "volatility-smile",
    title: "Calibration du smile de volatilité",
    category: "volatility",
    level: "Avancé",
    description: "Calibrez une surface de volatilité à partir de données de marché.",
    estimatedTime: "45-60 min",
    completionRate: 48,
    popularity: 85,
    hasSimulation: true
  },
  {
    id: "monte-carlo-simulation",
    title: "Simulation Monte Carlo",
    category: "simulation",
    level: "Intermédiaire",
    description: "Mettez en œuvre une simulation Monte Carlo pour le pricing d'options path-dependent.",
    estimatedTime: "30-45 min",
    completionRate: 71,
    popularity: 92,
    hasSimulation: true
  },
  {
    id: "interest-rate-curves",
    title: "Construction de courbes de taux",
    category: "rates",
    level: "Intermédiaire",
    description: "Construisez une courbe de taux zéro-coupon à partir d'instruments du marché.",
    estimatedTime: "25-35 min",
    completionRate: 67,
    popularity: 89,
    hasSimulation: true
  },
  {
    id: "delta-hedging",
    title: "Stratégie de couverture Delta",
    category: "risk",
    level: "Avancé",
    description: "Simulez une stratégie de couverture Delta dynamique pour un book d'options.",
    estimatedTime: "40-50 min",
    completionRate: 53,
    popularity: 78,
    hasSimulation: true
  }
];

// Exercise card component
const ExerciseCard = ({ exercise }: { exercise: any }) => {
  const { t } = useTranslation();
  
  // Function to get the appropriate background color based on completion rate
  const getCompletionBgColor = (rate: number) => {
    if (rate >= 80) return "bg-green-900/20";
    if (rate >= 60) return "bg-blue-900/20";
    if (rate >= 40) return "bg-yellow-900/20";
    return "bg-red-900/20";
  };
  
  // Function to get the appropriate text color based on completion rate
  const getCompletionTextColor = (rate: number) => {
    if (rate >= 80) return "text-green-400";
    if (rate >= 60) return "text-blue-400";
    if (rate >= 40) return "text-yellow-400";
    return "text-red-400";
  };
  
  return (
    <div className="finance-card p-4 hover:border-finance-accent transition-colors duration-300">
      <div className="flex justify-between mb-2">
        <h3 className="text-lg font-medium text-finance-offwhite">{exercise.title}</h3>
        {exercise.hasSimulation && (
          <Badge variant="achievement" className="flex items-center">
            <Activity className="h-3 w-3 mr-1" />
            {t('exercises.simulation')}
          </Badge>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2 mb-3">
        <Badge variant="level">{exercise.level}</Badge>
        <Badge variant="outline" className="text-finance-lightgray">{exercise.category}</Badge>
      </div>
      
      <p className="text-finance-lightgray text-sm mb-4">{exercise.description}</p>
      
      <div className="flex flex-wrap justify-between items-center mb-4">
        <div className="flex items-center text-finance-lightgray text-xs">
          <Timer className="h-3 w-3 mr-1" />
          {exercise.estimatedTime}
        </div>
        
        <div className="flex items-center">
          <div className={`px-2 py-1 rounded text-xs ${getCompletionBgColor(exercise.completionRate)} ${getCompletionTextColor(exercise.completionRate)}`}>
            {exercise.completionRate}% {t('exercises.completionRate')}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center text-finance-lightgray text-xs">
          <BarChart className="h-3 w-3 mr-1" />
          {t('exercises.popularity')}: {exercise.popularity}%
        </div>
        
        <Link to={`/exercises/${exercise.id}`} className="text-finance-accent flex items-center text-sm font-medium hover:underline">
          {t('exercises.start')} <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

// Sample step data for the simulation
const simulationSteps = [
  { 
    id: 1, 
    title: "Configuration des paramètres", 
    content: "Définissez les paramètres du modèle de Black-Scholes", 
    isCompleted: true 
  },
  { 
    id: 2, 
    title: "Calcul du prix de l'option", 
    content: "Utilisez la formule de Black-Scholes pour calculer le prix de l'option", 
    isCompleted: true 
  },
  { 
    id: 3, 
    title: "Calcul des Greeks", 
    content: "Calculez Delta, Gamma, Vega, Theta et Rho", 
    isCompleted: false 
  },
  { 
    id: 4, 
    title: "Analyse de sensibilité", 
    content: "Analysez la sensibilité du prix aux variations des paramètres", 
    isCompleted: false 
  }
];

const Exercises = () => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeLevel, setActiveLevel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeExercise, setActiveExercise] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Filter exercises based on selected filters
  const filteredExercises = exercisesData.filter(exercise => {
    // Category filter
    if (activeCategory !== "all" && exercise.category !== activeCategory) {
      return false;
    }
    
    // Level filter
    if (activeLevel && exercise.level !== activeLevel) {
      return false;
    }
    
    // Search query
    if (searchQuery && !exercise.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Simulation step handling
  const handleNextStep = () => {
    if (currentStep < simulationSteps.length) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite">
      <Navbar />
      
      {!activeExercise ? (
        // Exercises list view
        <main className="flex-1 py-8 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold terminal-text mb-2">{t('exercises.title')}</h1>
                <p className="text-finance-lightgray">
                  {t('exercises.subtitle')}
                </p>
              </div>
              
              <div className="mt-4 md:mt-0 flex gap-3">
                <button className="finance-button-outline flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  {t('exercises.filter')}
                </button>
                <Link to="/survival-mode" className="finance-button flex items-center">
                  <Activity className="mr-2 h-4 w-4" />
                  {t('exercises.survivalMode')}
                </Link>
              </div>
            </div>
            
            <div className="finance-card p-4 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-finance-lightgray" />
                    <input
                      type="text"
                      placeholder={t('exercises.searchPlaceholder')}
                      className="w-full bg-finance-charcoal/30 border border-finance-steel/20 rounded pl-10 pr-4 py-2 text-finance-offwhite placeholder:text-finance-lightgray focus:outline-none focus:border-finance-accent"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      className={`px-3 py-1.5 rounded text-sm ${
                        activeCategory === category.id 
                          ? 'bg-finance-burgundy/20 text-finance-accent' 
                          : 'bg-finance-steel/10 text-finance-lightgray hover:bg-finance-steel/20'
                      }`}
                      onClick={() => setActiveCategory(category.id)}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {levels.map((level) => (
                    <button
                      key={level.id}
                      className={`px-3 py-1.5 rounded text-sm ${
                        activeLevel === level.name
                          ? 'bg-finance-burgundy/20 text-finance-accent' 
                          : 'bg-finance-steel/10 text-finance-lightgray hover:bg-finance-steel/20'
                      }`}
                      onClick={() => setActiveLevel(activeLevel === level.name ? null : level.name)}
                    >
                      {level.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExercises.map((exercise) => (
                <ExerciseCard 
                  key={exercise.id} 
                  exercise={exercise}
                />
              ))}
            </div>
          </div>
        </main>
      ) : (
        // Interactive exercise/simulation view
        <main className="flex-1 py-8 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <button 
                onClick={() => setActiveExercise(null)}
                className="finance-button-outline flex items-center"
              >
                {t('exercises.backToList')}
              </button>
              
              <div className="flex items-center">
                <Badge variant="level" className="mr-2">{activeExercise.level}</Badge>
                <Badge variant="outline" className="text-finance-lightgray">{activeExercise.category}</Badge>
              </div>
            </div>
            
            <div className="finance-card p-6 mb-6">
              <h1 className="text-2xl font-bold terminal-text mb-4">{activeExercise.title}</h1>
              <p className="text-finance-lightgray mb-6">{activeExercise.description}</p>
              
              <div className="flex justify-between items-center mb-6">
                <div className="flex gap-4">
                  <div className="flex items-center text-finance-lightgray">
                    <Timer className="h-4 w-4 mr-2" />
                    {activeExercise.estimatedTime}
                  </div>
                  <div className="flex items-center text-finance-lightgray">
                    <Award className="h-4 w-4 mr-2" />
                    {t('exercises.completionPoints')}
                  </div>
                </div>
                
                <button className="finance-button text-sm">
                  {t('exercises.startExercise')}
                </button>
              </div>
              
              <div className="mb-6">
                <h2 className="text-lg font-medium mb-3">{t('exercises.objectives')}</h2>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <div className="p-1 rounded-full bg-green-900/20 text-green-400 mr-2 mt-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-finance-lightgray">Comprendre les fondements du modèle de Black-Scholes</span>
                  </li>
                  <li className="flex items-start">
                    <div className="p-1 rounded-full bg-green-900/20 text-green-400 mr-2 mt-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-finance-lightgray">Implémenter la formule de pricing d'options européennes</span>
                  </li>
                  <li className="flex items-start">
                    <div className="p-1 rounded-full bg-green-900/20 text-green-400 mr-2 mt-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-finance-lightgray">Calculer et interpréter les Greeks</span>
                  </li>
                  <li className="flex items-start">
                    <div className="p-1 rounded-full bg-green-900/20 text-green-400 mr-2 mt-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-finance-lightgray">Analyser la sensibilité du prix aux variations des paramètres</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h2 className="text-lg font-medium mb-3">{t('exercises.prerequisites')}</h2>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center px-3 py-1.5 bg-finance-steel/10 rounded">
                    <Calculator className="h-4 w-4 text-finance-accent mr-2" />
                    <span className="text-finance-lightgray text-sm">Calcul stochastique</span>
                  </div>
                  <div className="flex items-center px-3 py-1.5 bg-finance-steel/10 rounded">
                    <Sigma className="h-4 w-4 text-finance-accent mr-2" />
                    <span className="text-finance-lightgray text-sm">Équations différentielles</span>
                  </div>
                  <div className="flex items-center px-3 py-1.5 bg-finance-steel/10 rounded">
                    <Brain className="h-4 w-4 text-finance-accent mr-2" />
                    <span className="text-finance-lightgray text-sm">Bases de programmation</span>
                  </div>
                  <div className="flex items-center px-3 py-1.5 bg-finance-steel/10 rounded">
                    <PieChart className="h-4 w-4 text-finance-accent mr-2" />
                    <span className="text-finance-lightgray text-sm">Produits dérivés</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="finance-card p-6 mb-6">
              <h2 className="text-xl font-medium mb-4">{t('exercises.simulation')}</h2>
              
              <div className="flex items-center mb-6">
                {simulationSteps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        currentStep > step.id
                          ? 'bg-finance-burgundy/20 text-finance-accent' 
                          : currentStep === step.id
                            ? 'bg-finance-steel/30 text-finance-offwhite'
                            : 'bg-finance-steel/10 text-finance-lightgray'
                      }`}
                    >
                      {step.isCompleted || currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                    </div>
                    {index < simulationSteps.length - 1 && (
                      <div 
                        className={`h-0.5 w-12 ${
                          currentStep > step.id + 1
                            ? 'bg-finance-accent' 
                            : 'bg-finance-steel/20'
                        }`}
                      ></div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-3">
                  {simulationSteps[currentStep - 1].title}
                </h3>
                <p className="text-finance-lightgray mb-4">
                  {simulationSteps[currentStep - 1].content}
                </p>
                
                {currentStep === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-finance-lightgray text-sm mb-1">Prix du sous-jacent (S)</label>
                        <input 
                          type="number" 
                          className="w-full bg-finance-charcoal/30 border border-finance-steel/20 rounded px-4 py-2 text-finance-offwhite"
                          value="100"
                        />
                      </div>
                      <div>
                        <label className="block text-finance-lightgray text-sm mb-1">Prix d'exercice (K)</label>
                        <input 
                          type="number" 
                          className="w-full bg-finance-charcoal/30 border border-finance-steel/20 rounded px-4 py-2 text-finance-offwhite"
                          value="100"
                        />
                      </div>
                      <div>
                        <label className="block text-finance-lightgray text-sm mb-1">Maturité (T, en années)</label>
                        <input 
                          type="number" 
                          className="w-full bg-finance-charcoal/30 border border-finance-steel/20 rounded px-4 py-2 text-finance-offwhite"
                          value="1"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-finance-lightgray text-sm mb-1">Taux sans risque (r)</label>
                        <input 
                          type="number" 
                          className="w-full bg-finance-charcoal/30 border border-finance-steel/20 rounded px-4 py-2 text-finance-offwhite"
                          value="0.05"
                        />
                      </div>
                      <div>
                        <label className="block text-finance-lightgray text-sm mb-1">Volatilité (σ)</label>
                        <input 
                          type="number" 
                          className="w-full bg-finance-charcoal/30 border border-finance-steel/20 rounded px-4 py-2 text-finance-offwhite"
                          value="0.2"
                        />
                      </div>
                      <div>
                        <label className="block text-finance-lightgray text-sm mb-1">Type d'option</label>
                        <select className="w-full bg-finance-charcoal/30 border border-finance-steel/20 rounded px-4 py-2 text-finance-offwhite">
                          <option>Call</option>
                          <option>Put</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
                
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="finance-card p-4">
                      <h4 className="text-finance-offwhite font-medium mb-2">Résultat du calcul</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-finance-lightgray text-sm mb-1">Prix du Call</div>
                          <div className="text-finance-accent text-xl font-bold">10.45 €</div>
                        </div>
                        <div>
                          <div className="text-finance-lightgray text-sm mb-1">Prix du Put</div>
                          <div className="text-finance-accent text-xl font-bold">5.57 €</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-finance-offwhite font-medium mb-2">Formule utilisée</h4>
                      <div className="bg-finance-charcoal/30 p-4 rounded">
                        <p className="text-finance-lightgray mb-2">
                          Pour un call européen:
                        </p>
                        <p className="text-finance-accent font-mono">
                          C = S * N(d1) - K * e^(-rT) * N(d2)
                        </p>
                        <p className="text-finance-lightgray mt-2 mb-2">
                          Pour un put européen:
                        </p>
                        <p className="text-finance-accent font-mono">
                          P = K * e^(-rT) * N(-d2) - S * N(-d1)
                        </p>
                        <p className="text-finance-lightgray mt-2 mb-2">
                          Où:
                        </p>
                        <p className="text-finance-accent font-mono">
                          d1 = (ln(S/K) + (r + σ²/2)*T) / (σ*√T)
                        </p>
                        <p className="text-finance-accent font-mono">
                          d2 = d1 - σ*√T
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="finance-card p-4">
                        <div className="text-finance-lightgray text-sm mb-1">Delta (Δ)</div>
                        <div className="text-finance-accent text-xl font-bold">0.6915</div>
                        <p className="text-finance-lightgray text-xs mt-2">
                          Sensibilité du prix de l'option par rapport au prix du sous-jacent
                        </p>
                      </div>
                      <div className="finance-card p-4">
                        <div className="text-finance-lightgray text-sm mb-1">Gamma (Γ)</div>
                        <div className="text-finance-accent text-xl font-bold">0.0153</div>
                        <p className="text-finance-lightgray text-xs mt-2">
                          Taux de variation du Delta par rapport au prix du sous-jacent
                        </p>
                      </div>
                      <div className="finance-card p-4">
                        <div className="text-finance-lightgray text-sm mb-1">Vega (ν)</div>
                        <div className="text-finance-accent text-xl font-bold">38.2931</div>
                        <p className="text-finance-lightgray text-xs mt-2">
                          Sensibilité du prix de l'option par rapport à la volatilité
                        </p>
                      </div>
                      <div className="finance-card p-4">
                        <div className="text-finance-lightgray text-sm mb-1">Theta (Θ)</div>
                        <div className="text-finance-accent text-xl font-bold">-5.1988</div>
                        <p className="text-finance-lightgray text-xs mt-2">
                          Sensibilité du prix de l'option par rapport au temps
                        </p>
                      </div>
                      <div className="finance-card p-4">
                        <div className="text-finance-lightgray text-sm mb-1">Rho (ρ)</div>
                        <div className="text-finance-accent text-xl font-bold">43.5081</div>
                        <p className="text-finance-lightgray text-xs mt-2">
                          Sensibilité du prix de l'option par rapport au taux d'intérêt
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-finance-offwhite font-medium mb-2">Exercice</h4>
                      <p className="text-finance-lightgray mb-4">
                        Calculez les Greeks pour les paramètres suivants:
                      </p>
                      <ul className="list-disc pl-5 text-finance-lightgray mb-4 space-y-1">
                        <li>S = 105, K = 100, T = 1, r = 0.05, σ = 0.2</li>
                        <li>S = 95, K = 100, T = 1, r = 0.05, σ = 0.2</li>
                        <li>S = 100, K = 100, T = 1, r = 0.05, σ = 0.3</li>
                      </ul>
                      <p className="text-finance-lightgray mb-4">
                        Que remarquez-vous concernant l'impact des variations de ces paramètres sur les Greeks?
                      </p>
                    </div>
                  </div>
                )}
                
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="aspect-video bg-finance-charcoal/50 rounded overflow-hidden">
                      <img 
                        src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3" 
                        alt="Analyse de sensibilité" 
                        className="w-full h-full object-cover opacity-70" 
                      />
                    </div>
                    
                    <div>
                      <h4 className="text-finance-offwhite font-medium mb-2">Exercice de synthèse</h4>
                      <p className="text-finance-lightgray mb-4">
                        En utilisant les connaissances acquises dans cet exercice:
                      </p>
                      <ol className="list-decimal pl-5 text-finance-lightgray mb-4 space-y-2">
                        <li>Calculez le prix d'une option call européenne avec les paramètres suivants: S = 120, K = 115, T = 0.5, r = 0.03, σ = 0.25</li>
                        <li>Calculez les Greeks correspondants</li>
                        <li>Si le sous-jacent augmente de 1%, quel sera l'impact approximatif sur le prix de l'option?</li>
                        <li>Si la volatilité diminue de 2%, quel sera l'impact approximatif sur le prix de l'option?</li>
                        <li>Proposez une stratégie de couverture Delta-neutre</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between">
                <button 
                  onClick={handlePrevStep}
                  disabled={currentStep === 1}
                  className={`finance-button-outline ${currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {t('exercises.prevStep')}
                </button>
                
                <button 
                  onClick={handleNextStep}
                  disabled={currentStep === simulationSteps.length}
                  className={`finance-button ${currentStep === simulationSteps.length ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {currentStep === simulationSteps.length ? t('exercises.finish') : t('exercises.nextStep')}
                </button>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
};

export default Exercises;
