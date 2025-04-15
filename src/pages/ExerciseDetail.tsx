
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  Award,
  Check,
  ChevronLeft,
  Clock,
  Code,
  FileText,
  HelpCircle,
  Link as LinkIcon,
  Save,
  Share2,
  Timer,
  X,
  MessageSquare,
  ThumbsUp,
  Calculator,
  Brain,
  Sigma,
  PieChart,
  Play
} from "lucide-react";
import { useTranslation } from "react-i18next";

// Sample exercise data
const exercisesData = [
  {
    id: "bsm-pricing",
    title: "Pricing d'options avec Black-Scholes",
    category: "options",
    level: "Débutant",
    description: "Calculez le prix d'une option européenne en utilisant le modèle de Black-Scholes.",
    longDescription: "Le modèle de Black-Scholes est un modèle mathématique d'évaluation du prix des options européennes. Développé en 1973 par Fischer Black et Myron Scholes, il a valu à Scholes (et à Robert Merton qui l'a développé) le prix Nobel d'économie en 1997. Dans cet exercice, vous allez implémenter ce modèle en Python et l'utiliser pour calculer le prix d'une option européenne.",
    estimatedTime: "15-20 min",
    completionRate: 85,
    popularity: 98,
    hasSimulation: true,
    prerequisites: [
      { id: "calcul", name: "Calcul stochastique", icon: "Calculator" },
      { id: "eq-diff", name: "Équations différentielles", icon: "Sigma" },
      { id: "prog", name: "Bases de programmation", icon: "Brain" },
      { id: "deriv", name: "Produits dérivés", icon: "PieChart" }
    ],
    objectives: [
      "Comprendre les fondements du modèle de Black-Scholes",
      "Implémenter la formule de pricing d'options européennes",
      "Calculer et interpréter les Greeks",
      "Analyser la sensibilité du prix aux variations des paramètres"
    ],
    steps: [
      { 
        id: 1, 
        title: "Configuration des paramètres", 
        content: "Définissez les paramètres du modèle de Black-Scholes", 
        isCompleted: false
      },
      { 
        id: 2, 
        title: "Calcul du prix de l'option", 
        content: "Utilisez la formule de Black-Scholes pour calculer le prix de l'option", 
        isCompleted: false
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
    ],
    discussions: [
      {
        id: 1,
        user: {
          name: "QuantMaster",
          avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=1480&auto=format&fit=crop"
        },
        content: "Je remarque que nous utilisons la formule classique de Black-Scholes, mais qu'en est-il des ajustements pour les dividendes?",
        date: "2024-03-15T10:30:00Z",
        likes: 4,
        replies: [
          {
            id: 1,
            user: {
              name: "OptionPro",
              avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1480&auto=format&fit=crop"
            },
            content: "Bonne question! Pour les actions versant des dividendes, on peut ajuster le prix du sous-jacent en soustrayant la valeur actualisée des dividendes attendus pendant la durée de vie de l'option.",
            date: "2024-03-15T11:15:00Z",
            likes: 2
          }
        ]
      },
      {
        id: 2,
        user: {
          name: "VolTrader",
          avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1522&auto=format&fit=crop"
        },
        content: "Est-ce que quelqu'un pourrait expliquer pourquoi Theta est généralement négatif pour les options?",
        date: "2024-03-16T09:45:00Z",
        likes: 3,
        replies: []
      }
    ]
  },
  {
    id: "monte-carlo-simulation",
    title: "Simulation Monte Carlo",
    category: "simulation",
    level: "Intermédiaire",
    description: "Mettez en œuvre une simulation Monte Carlo pour le pricing d'options path-dependent.",
    longDescription: "Les méthodes de Monte Carlo sont particulièrement utiles pour évaluer les options complexes où les solutions analytiques n'existent pas. Dans cet exercice, vous allez implémenter une simulation Monte Carlo pour évaluer des options path-dependent comme les options asiatiques ou à barrière.",
    estimatedTime: "30-45 min",
    completionRate: 71,
    popularity: 92,
    hasSimulation: true,
    prerequisites: [
      { id: "prog-avance", name: "Programmation avancée", icon: "Brain" },
      { id: "stats", name: "Statistiques", icon: "Calculator" },
      { id: "options", name: "Options vanilles", icon: "PieChart" }
    ],
    objectives: [
      "Comprendre les principes de la simulation Monte Carlo",
      "Implémenter un générateur de trajectoires de prix",
      "Évaluer des options path-dependent",
      "Analyser la convergence et la précision des estimations"
    ],
    steps: [
      { 
        id: 1, 
        title: "Génération de nombres aléatoires", 
        content: "Implémentez un générateur de nombres aléatoires suivant une loi normale", 
        isCompleted: false
      },
      { 
        id: 2, 
        title: "Simulation de trajectoires", 
        content: "Générez des trajectoires de prix d'actifs selon un mouvement brownien géométrique", 
        isCompleted: false
      },
      { 
        id: 3, 
        title: "Calcul des payoffs", 
        content: "Calculez les payoffs des options sur les trajectoires simulées", 
        isCompleted: false
      },
      { 
        id: 4, 
        title: "Analyse statistique", 
        content: "Analysez les résultats et estimez le prix de l'option avec un intervalle de confiance", 
        isCompleted: false
      }
    ],
    discussions: [
      {
        id: 1,
        user: {
          name: "AlgoFinance",
          avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=1480&auto=format&fit=crop"
        },
        content: "Comment peut-on réduire la variance dans nos simulations Monte Carlo?",
        date: "2024-03-14T15:20:00Z",
        likes: 5,
        replies: [
          {
            id: 1,
            user: {
              name: "BlackScholes",
              avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1470&auto=format&fit=crop"
            },
            content: "Il existe plusieurs techniques: variables antithétiques, variables de contrôle, stratification, et moments conditionnels. La plus simple à implémenter est celle des variables antithétiques.",
            date: "2024-03-14T16:05:00Z",
            likes: 3
          }
        ]
      }
    ]
  }
];

// Code editor component (simplified for demo)
const CodeEditor = ({ code, setCode }: { code: string; setCode: (code: string) => void }) => {
  return (
    <div className="w-full h-64 rounded overflow-hidden">
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full h-full p-4 bg-finance-charcoal/50 text-finance-offwhite font-mono text-sm resize-none focus:outline-none focus:border-finance-accent border border-finance-steel/20"
        spellCheck="false"
      />
    </div>
  );
};

const DiscussionThread = ({ discussions }: { discussions: any[] }) => {
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const handlePostComment = () => {
    if (newComment.trim() === "") return;
    
    toast({
      title: t('exerciseDetail.commentPosted'),
      description: t('exerciseDetail.commentPostedDesc'),
    });
    
    setNewComment("");
  };
  
  return (
    <div className="space-y-6">
      <div>
        <textarea
          placeholder={t('exerciseDetail.writeComment')}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="w-full p-3 rounded bg-finance-charcoal/30 border border-finance-steel/20 placeholder:text-finance-lightgray text-finance-offwhite focus:outline-none focus:border-finance-accent min-h-24"
        />
        <div className="flex justify-end mt-2">
          <button 
            className="finance-button"
            onClick={handlePostComment}
          >
            {t('exerciseDetail.postComment')}
          </button>
        </div>
      </div>
      
      {discussions.map((discussion) => (
        <div key={discussion.id} className="border border-finance-steel/20 rounded p-4 space-y-4">
          <div className="flex items-start">
            <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
              <img 
                src={discussion.user.avatar} 
                alt={discussion.user.name} 
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="font-medium text-finance-offwhite">{discussion.user.name}</div>
                <div className="text-xs text-finance-lightgray">
                  {new Date(discussion.date).toLocaleDateString()}
                </div>
              </div>
              <div className="mt-2 text-finance-lightgray">
                {discussion.content}
              </div>
              <div className="mt-3 flex items-center space-x-4">
                <button className="text-finance-lightgray hover:text-finance-accent text-xs flex items-center">
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  {discussion.likes}
                </button>
                <button className="text-finance-lightgray hover:text-finance-accent text-xs flex items-center">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  {t('exerciseDetail.reply')}
                </button>
                <button className="text-finance-lightgray hover:text-finance-accent text-xs flex items-center">
                  <Share2 className="h-3 w-3 mr-1" />
                  {t('exerciseDetail.share')}
                </button>
              </div>
            </div>
          </div>
          
          {discussion.replies && discussion.replies.length > 0 && (
            <div className="pl-12 space-y-4 mt-2">
              {discussion.replies.map((reply: any) => (
                <div key={reply.id} className="border-l-2 border-finance-steel/20 pl-4">
                  <div className="flex items-start">
                    <div className="h-8 w-8 rounded-full overflow-hidden mr-3">
                      <img 
                        src={reply.user.avatar} 
                        alt={reply.user.name} 
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-finance-offwhite">{reply.user.name}</div>
                        <div className="text-xs text-finance-lightgray">
                          {new Date(reply.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="mt-2 text-finance-lightgray">
                        {reply.content}
                      </div>
                      <div className="mt-2 flex items-center space-x-4">
                        <button className="text-finance-lightgray hover:text-finance-accent text-xs flex items-center">
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          {reply.likes}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const ExerciseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [code, setCode] = useState(
    `import numpy as np
from scipy.stats import norm

def black_scholes(S, K, T, r, sigma, option_type="call"):
    """
    Calculate option price using Black-Scholes formula
    
    Parameters:
    S: Stock price
    K: Strike price
    T: Time to maturity in years
    r: Risk-free interest rate
    sigma: Volatility
    option_type: "call" or "put"
    
    Returns:
    option_price: Price of the option
    """
    # Calculate d1 and d2
    d1 = (np.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    
    # TODO: Implement the Black-Scholes formula
    
    return option_price

# Example usage
S = 100    # Stock price
K = 100    # Strike price
T = 1      # Time to maturity (1 year)
r = 0.05   # Risk-free rate
sigma = 0.2  # Volatility

call_price = black_scholes(S, K, T, r, sigma, "call")
put_price = black_scholes(S, K, T, r, sigma, "put")
print(f"Call price: {call_price}")
print(f"Put price: {put_price}")
`
  );
  const [activeTab, setActiveTab] = useState<"exercise" | "simulation" | "discussion">("exercise");
  
  // Find the current exercise
  const exercise = exercisesData.find(ex => ex.id === id);
  
  useEffect(() => {
    // If exercise doesn't exist, navigate back to exercises list
    if (!exercise && id) {
      navigate("/exercises");
    }
  }, [exercise, id, navigate]);
  
  if (!exercise) {
    return null;
  }
  
  // Handle next step
  const handleNextStep = () => {
    if (currentStep < exercise.steps.length) {
      setCurrentStep(currentStep + 1);
      
      // Update exercise steps (simulate completion)
      const updatedSteps = [...exercise.steps];
      updatedSteps[currentStep - 1] = { ...updatedSteps[currentStep - 1], isCompleted: true };
      
      toast({
        title: t('exerciseDetail.stepCompleted'),
        description: t('exerciseDetail.stepCompletedDesc', { step: currentStep }),
      });
    }
  };
  
  // Handle previous step
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Handle save
  const handleSave = () => {
    toast({
      title: t('exerciseDetail.codeSaved'),
      description: t('exerciseDetail.codeSavedDesc'),
    });
  };
  
  // Get icon component based on name
  const getPrerequisiteIcon = (iconName: string) => {
    switch (iconName) {
      case "Calculator":
        return <Calculator className="h-4 w-4 text-finance-accent mr-2" />;
      case "Sigma":
        return <Sigma className="h-4 w-4 text-finance-accent mr-2" />;
      case "Brain":
        return <Brain className="h-4 w-4 text-finance-accent mr-2" />;
      case "PieChart":
        return <PieChart className="h-4 w-4 text-finance-accent mr-2" />;
      default:
        return <HelpCircle className="h-4 w-4 text-finance-accent mr-2" />;
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite">
      <Navbar />
      
      <main className="flex-1 py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={() => navigate("/exercises")}
              className="finance-button-outline flex items-center"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              {t('exerciseDetail.backToList')}
            </button>
            
            <div className="flex items-center">
              <Badge variant="level" className="mr-2">{exercise.level}</Badge>
              <Badge variant="outline" className="text-finance-lightgray">{exercise.category}</Badge>
            </div>
          </div>
          
          <div className="finance-card p-6 mb-6">
            <h1 className="text-2xl font-bold terminal-text mb-4">{exercise.title}</h1>
            <p className="text-finance-lightgray mb-6">{exercise.longDescription}</p>
            
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-4">
                <div className="flex items-center text-finance-lightgray">
                  <Timer className="h-4 w-4 mr-2" />
                  {exercise.estimatedTime}
                </div>
                <div className="flex items-center text-finance-lightgray">
                  <Award className="h-4 w-4 mr-2" />
                  {t('exerciseDetail.completionPoints')}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  className="finance-button-outline flex items-center"
                  onClick={() => toast({
                    title: t('exerciseDetail.exerciseShared'),
                    description: t('exerciseDetail.exerciseSharedDesc'),
                  })}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  {t('exerciseDetail.share')}
                </button>
                <button 
                  className="finance-button text-sm flex items-center"
                  onClick={() => setActiveTab("simulation")}
                >
                  <Play className="mr-2 h-4 w-4" />
                  {t('exerciseDetail.startSimulation')}
                </button>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-3">{t('exerciseDetail.objectives')}</h2>
              <ul className="space-y-2">
                {exercise.objectives.map((objective, index) => (
                  <li key={index} className="flex items-start">
                    <div className="p-1 rounded-full bg-green-900/20 text-green-400 mr-2 mt-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-finance-lightgray">{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h2 className="text-lg font-medium mb-3">{t('exerciseDetail.prerequisites')}</h2>
              <div className="flex flex-wrap gap-3">
                {exercise.prerequisites.map((prerequisite) => (
                  <div key={prerequisite.id} className="flex items-center px-3 py-1.5 bg-finance-steel/10 rounded">
                    {getPrerequisiteIcon(prerequisite.icon)}
                    <span className="text-finance-lightgray text-sm">{prerequisite.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex mb-6">
            <button
              className={`px-4 py-2 ${activeTab === "exercise" ? "border-b-2 border-finance-accent text-finance-accent" : "text-finance-lightgray"}`}
              onClick={() => setActiveTab("exercise")}
            >
              {t('exerciseDetail.exercise')}
            </button>
            <button
              className={`px-4 py-2 ${activeTab === "simulation" ? "border-b-2 border-finance-accent text-finance-accent" : "text-finance-lightgray"}`}
              onClick={() => setActiveTab("simulation")}
            >
              {t('exerciseDetail.simulation')}
            </button>
            <button
              className={`px-4 py-2 ${activeTab === "discussion" ? "border-b-2 border-finance-accent text-finance-accent" : "text-finance-lightgray"}`}
              onClick={() => setActiveTab("discussion")}
            >
              {t('exerciseDetail.discussion')}
            </button>
          </div>
          
          {activeTab === "exercise" && (
            <div className="finance-card p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium">{t('exerciseDetail.codeEditor')}</h2>
                <div className="flex gap-2">
                  <button 
                    className="finance-button-outline text-sm flex items-center"
                    onClick={handleSave}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {t('exerciseDetail.save')}
                  </button>
                  <button 
                    className="finance-button text-sm flex items-center"
                    onClick={() => toast({
                      title: t('exerciseDetail.codeSubmitted'),
                      description: t('exerciseDetail.codeSubmittedDesc'),
                    })}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {t('exerciseDetail.runCode')}
                  </button>
                </div>
              </div>
              
              <CodeEditor code={code} setCode={setCode} />
              
              <div className="mt-6 finance-card p-4">
                <h3 className="text-finance-offwhite font-medium mb-2">{t('exerciseDetail.instructions')}</h3>
                <p className="text-finance-lightgray text-sm mb-4">
                  {t('exerciseDetail.blackScholesInstructions')}
                </p>
                <div className="bg-finance-charcoal/30 p-4 rounded">
                  <p className="text-finance-lightgray mb-2 font-mono text-sm">
                    {t('exerciseDetail.formulaHeader')}
                  </p>
                  <p className="text-finance-accent font-mono text-sm">
                    C = S * N(d1) - K * e^(-rT) * N(d2)
                  </p>
                  <p className="text-finance-lightgray mt-2 mb-2 font-mono text-sm">
                    {t('exerciseDetail.putFormulaHeader')}
                  </p>
                  <p className="text-finance-accent font-mono text-sm">
                    P = K * e^(-rT) * N(-d2) - S * N(-d1)
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-finance-offwhite font-medium mb-2">{t('exerciseDetail.resources')}</h3>
                <div className="space-y-2">
                  <a href="#" className="flex items-center text-finance-accent hover:underline">
                    <FileText className="h-4 w-4 mr-2" />
                    {t('exerciseDetail.bsmTheory')}
                  </a>
                  <a href="#" className="flex items-center text-finance-accent hover:underline">
                    <Code className="h-4 w-4 mr-2" />
                    {t('exerciseDetail.pythonImplementation')}
                  </a>
                  <a href="#" className="flex items-center text-finance-accent hover:underline">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    {t('exerciseDetail.additionalReading')}
                  </a>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === "simulation" && (
            <div className="finance-card p-6 mb-6">
              <h2 className="text-xl font-medium mb-4">{t('exerciseDetail.simulation')}</h2>
              
              <div className="flex items-center mb-6">
                {exercise.steps.map((step, index) => (
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
                    {index < exercise.steps.length - 1 && (
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
                  {exercise.steps[currentStep - 1].title}
                </h3>
                <p className="text-finance-lightgray mb-4">
                  {exercise.steps[currentStep - 1].content}
                </p>
                
                {currentStep === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-finance-lightgray text-sm mb-1">Prix du sous-jacent (S)</label>
                        <input 
                          type="number" 
                          className="w-full bg-finance-charcoal/30 border border-finance-steel/20 rounded px-4 py-2 text-finance-offwhite"
                          defaultValue="100"
                        />
                      </div>
                      <div>
                        <label className="block text-finance-lightgray text-sm mb-1">Prix d'exercice (K)</label>
                        <input 
                          type="number" 
                          className="w-full bg-finance-charcoal/30 border border-finance-steel/20 rounded px-4 py-2 text-finance-offwhite"
                          defaultValue="100"
                        />
                      </div>
                      <div>
                        <label className="block text-finance-lightgray text-sm mb-1">Maturité (T, en années)</label>
                        <input 
                          type="number" 
                          className="w-full bg-finance-charcoal/30 border border-finance-steel/20 rounded px-4 py-2 text-finance-offwhite"
                          defaultValue="1"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-finance-lightgray text-sm mb-1">Taux sans risque (r)</label>
                        <input 
                          type="number" 
                          className="w-full bg-finance-charcoal/30 border border-finance-steel/20 rounded px-4 py-2 text-finance-offwhite"
                          defaultValue="0.05"
                        />
                      </div>
                      <div>
                        <label className="block text-finance-lightgray text-sm mb-1">Volatilité (σ)</label>
                        <input 
                          type="number" 
                          className="w-full bg-finance-charcoal/30 border border-finance-steel/20 rounded px-4 py-2 text-finance-offwhite"
                          defaultValue="0.2"
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
                  {t('exerciseDetail.prevStep')}
                </button>
                
                <button 
                  onClick={handleNextStep}
                  disabled={currentStep === exercise.steps.length}
                  className={`finance-button ${currentStep === exercise.steps.length ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {currentStep === exercise.steps.length ? t('exerciseDetail.finish') : t('exerciseDetail.nextStep')}
                </button>
              </div>
            </div>
          )}
          
          {activeTab === "discussion" && (
            <div className="finance-card p-6 mb-6">
              <h2 className="text-xl font-medium mb-6">{t('exerciseDetail.discussion')}</h2>
              <DiscussionThread discussions={exercise.discussions} />
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ExerciseDetail;
