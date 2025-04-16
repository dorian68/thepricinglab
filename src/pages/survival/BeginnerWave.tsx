
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import { survivalChallengeTypes } from "@/data/survival-waves";
import { ArrowLeft, Clock, Check, X, Zap, Trophy, AlertTriangle, Heart } from "lucide-react";
import { toast } from "sonner";

// Définition du type pour les exercices
type Exercise = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

// Base de données d'exercices pour le niveau débutant
const beginnerExercises: Exercise[] = [
  {
    question: "Quelle formule est utilisée pour calculer le prix d'une option européenne?",
    options: [
      "Modèle de Black-Scholes",
      "Modèle de Monte Carlo",
      "Modèle binomial de Cox-Ross-Rubinstein",
      "Formule de Ito"
    ],
    correctAnswer: 0,
    explanation: "Le modèle de Black-Scholes est la formule de référence pour évaluer les options européennes en temps continu."
  },
  {
    question: "Quel est le Delta d'une option d'achat (call) deep in-the-money?",
    options: ["Proche de 0", "Proche de 0.5", "Proche de 1", "Proche de -1"],
    correctAnswer: 2,
    explanation: "Le Delta d'un call deep in-the-money tend vers 1, car la probabilité que l'option soit exercée est très élevée."
  },
  {
    question: "Comment évolue la valeur temporelle d'une option à l'approche de l'échéance?",
    options: [
      "Elle augmente linéairement", 
      "Elle diminue exponentiellement", 
      "Elle reste constante", 
      "Elle oscille de façon périodique"
    ],
    correctAnswer: 1,
    explanation: "La valeur temporelle d'une option diminue de façon exponentielle à l'approche de l'échéance, phénomène connu sous le nom de 'décroissance theta'."
  },
  {
    question: "Quel Greek mesure la sensibilité du prix de l'option à la volatilité?",
    options: ["Delta", "Gamma", "Theta", "Vega"],
    correctAnswer: 3,
    explanation: "Le Vega mesure la variation du prix de l'option par rapport à un changement de volatilité implicite."
  },
  {
    question: "Pour une option européenne, quand peut-elle être exercée?",
    options: [
      "À tout moment avant l'échéance", 
      "Uniquement à la date d'échéance", 
      "Uniquement pendant les jours de trading", 
      "À la discrétion de l'émetteur"
    ],
    correctAnswer: 1,
    explanation: "Une option européenne ne peut être exercée qu'à sa date d'échéance, contrairement à une option américaine qui peut être exercée à tout moment avant l'échéance."
  },
  {
    question: "Quel est l'effet d'une augmentation des taux d'intérêt sur le prix d'un call européen, toutes choses égales par ailleurs?",
    options: [
      "Augmentation du prix",
      "Diminution du prix",
      "Aucun effet",
      "Effet variable selon la moneyness"
    ],
    correctAnswer: 0,
    explanation: "Une hausse des taux d'intérêt augmente généralement le prix d'un call européen car elle réduit la valeur actualisée du prix d'exercice."
  },
  {
    question: "Comment se comporte le Gamma d'une option ATM (at-the-money) à l'approche de l'échéance?",
    options: [
      "Il diminue progressivement",
      "Il augmente fortement",
      "Il reste constant",
      "Il devient négatif"
    ],
    correctAnswer: 1,
    explanation: "Le Gamma d'une option ATM augmente fortement à l'approche de l'échéance, rendant l'option plus sensible aux variations du sous-jacent."
  },
  {
    question: "Dans le modèle de Black-Scholes, quelle hypothèse est faite concernant la volatilité?",
    options: [
      "Elle suit un processus stochastique",
      "Elle est constante pendant la durée de vie de l'option",
      "Elle augmente avec le temps",
      "Elle dépend du prix du sous-jacent"
    ],
    correctAnswer: 1,
    explanation: "Le modèle de Black-Scholes suppose une volatilité constante pendant toute la durée de vie de l'option, ce qui est une simplification importante du modèle."
  },
  {
    question: "Pour une option call avec un strike de 100€ et un sous-jacent à 120€, cette option est:",
    options: [
      "In-the-money",
      "At-the-money",
      "Out-of-the-money",
      "Near-the-money"
    ],
    correctAnswer: 0,
    explanation: "Un call est in-the-money lorsque le prix du sous-jacent est supérieur au strike (ici 120€ > 100€)."
  },
  {
    question: "Quelle est la valeur intrinsèque d'un put européen avec un strike de 50€ quand le sous-jacent vaut 40€?",
    options: [
      "0€",
      "10€",
      "50€",
      "40€"
    ],
    correctAnswer: 1,
    explanation: "La valeur intrinsèque d'un put est max(K-S, 0), soit max(50-40, 0) = 10€."
  }
];

const BeginnerWave = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const waveInfo = {
    id: 1,
    name: "Mode Survie: Débutant",
    description: "Maîtrisez les bases des options financières et de la valorisation",
    challenges: 10,
    time: 15,
    topics: ["Black-Scholes", "Options Vanille", "Greeks de base"]
  };
  
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [timeLeft, setTimeLeft] = useState(waveInfo.time);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [answerCorrect, setAnswerCorrect] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [lives, setLives] = useState(3);
  
  // Mélange aléatoire des exercices pour chaque partie
  const [exercises, setExercises] = useState<Exercise[]>([]);
  
  useEffect(() => {
    // Mélanger les exercices au démarrage du jeu
    const shuffleExercises = () => {
      const shuffled = [...beginnerExercises].sort(() => 0.5 - Math.random());
      setExercises(shuffled.slice(0, waveInfo.challenges));
    };
    
    shuffleExercises();
  }, []);

  useEffect(() => {
    let timer;
    
    if (gameStarted && !gameOver && !answered) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(timer);
  }, [gameStarted, gameOver, answered]);

  const startGame = () => {
    setGameStarted(true);
    setCurrentChallenge(0);
    setScore(0);
    setLives(3);
    setGameOver(false);
    setTimeLeft(waveInfo.time);
    setAnswered(false);
    setSelectedAnswer(null);
    
    // Mélanger à nouveau les exercices
    const shuffled = [...beginnerExercises].sort(() => 0.5 - Math.random());
    setExercises(shuffled.slice(0, waveInfo.challenges));
    
    toast.success("Le défi commence! Vous avez 3 vies.");
  };

  const handleTimeout = () => {
    setAnswered(true);
    setAnswerCorrect(false);
    
    // Perdre une vie en cas de timeout
    setLives(prev => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        setGameOver(true);
        toast.error("Vous avez perdu toutes vos vies!");
      }
      return newLives;
    });
    
    toast.error("Temps écoulé!");
    
    setTimeout(() => {
      if (!gameOver) {
        if (currentChallenge >= waveInfo.challenges - 1) {
          setGameOver(true);
        } else {
          setCurrentChallenge((prev) => prev + 1);
          setTimeLeft(waveInfo.time);
          setAnswered(false);
          setSelectedAnswer(null);
        }
      }
    }, 2000);
  };

  const handleAnswer = (selectedIndex: number) => {
    if (answered) return;
    
    setSelectedAnswer(selectedIndex);
    setAnswered(true);
    
    const isCorrect = selectedIndex === exercises[currentChallenge].correctAnswer;
    setAnswerCorrect(isCorrect);
    
    if (isCorrect) {
      setScore((prev) => prev + 1);
      toast.success("Bonne réponse!");
    } else {
      // Perdre une vie en cas de mauvaise réponse
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          setGameOver(true);
          toast.error("Vous avez perdu toutes vos vies!");
        } else {
          toast.error("Réponse incorrecte! Vous perdez une vie.");
        }
        return newLives;
      });
    }
    
    setTimeout(() => {
      if (!gameOver) {
        if (currentChallenge >= waveInfo.challenges - 1 || lives <= 0) {
          setGameOver(true);
        } else {
          setCurrentChallenge((prev) => prev + 1);
          setTimeLeft(waveInfo.time);
          setAnswered(false);
          setSelectedAnswer(null);
        }
      }
    }, 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite">
      <Navbar />
      
      <main className="flex-1 py-8 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => navigate("/survival-mode")} className="text-finance-lightgray hover:text-finance-offwhite flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('survivalMode.backToWaves')}
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="bg-finance-charcoal/50 px-4 py-2 rounded-md flex items-center">
                <Trophy className="h-4 w-4 text-finance-accent mr-2" />
                <span>Score: <span className="font-medium">{score}</span></span>
              </div>
              
              {gameStarted && !gameOver && (
                <div className="bg-finance-charcoal/50 px-4 py-2 rounded-md flex items-center">
                  <div className="flex space-x-1">
                    {[...Array(3)].map((_, i) => (
                      <Heart 
                        key={i} 
                        className={`h-4 w-4 ${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} 
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Game container */}
          <div className="finance-card p-0 overflow-hidden">
            {/* Wave info */}
            <div className="bg-finance-charcoal/50 p-4 border-b border-finance-steel/10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-medium text-finance-accent">{waveInfo.name}</h1>
                  <p className="text-finance-lightgray text-sm">{waveInfo.description}</p>
                </div>
                {gameStarted && !gameOver && (
                  <div className="bg-finance-charcoal/50 px-4 py-2 rounded-md flex items-center">
                    <Clock className={`h-4 w-4 mr-2 ${timeLeft < 5 ? 'text-red-500' : 'text-finance-accent'}`} />
                    <span className={timeLeft < 5 ? 'text-red-500 font-bold' : ''}>{timeLeft}s</span>
                  </div>
                )}
              </div>
              
              {gameStarted && !gameOver && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-finance-lightgray mb-1">
                    <span>Défi {currentChallenge + 1}/{waveInfo.challenges}</span>
                    <span>{Math.round((currentChallenge / waveInfo.challenges) * 100)}%</span>
                  </div>
                  <Progress value={(currentChallenge / waveInfo.challenges) * 100} className="h-1.5" />
                </div>
              )}
            </div>
            
            {/* Game content */}
            <div className="p-6">
              {!gameStarted && (
                <div className="text-center py-12">
                  <Zap className="h-12 w-12 text-finance-accent mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Prêt à relever le défi?</h2>
                  <p className="text-finance-lightgray mb-8 max-w-lg mx-auto">
                    Vous allez affronter {waveInfo.challenges} défis de niveau débutant. 
                    Vous aurez {waveInfo.time} secondes pour répondre à chaque question et 3 vies.
                  </p>
                  <Button variant="finance" size="lg" onClick={startGame}>
                    Commencer le défi
                  </Button>
                </div>
              )}
              
              {gameStarted && !gameOver && exercises.length > 0 && (
                <div className="py-6">
                  <div className="mb-8">
                    <span className="text-xs uppercase text-finance-lightgray tracking-wider">Question {currentChallenge + 1}</span>
                    <h2 className="text-xl font-medium mt-1">{exercises[currentChallenge].question}</h2>
                  </div>
                  
                  <div className="space-y-3 mb-8">
                    {exercises[currentChallenge].options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswer(index)}
                        disabled={answered}
                        className={`w-full text-left p-4 rounded-lg transition-colors ${
                          answered 
                            ? index === exercises[currentChallenge].correctAnswer
                              ? 'bg-green-900/30 border border-green-500'
                              : index === selectedAnswer
                                ? 'bg-red-900/30 border border-red-500'
                                : 'bg-finance-charcoal/30 border border-finance-steel/20'
                            : 'bg-finance-charcoal/30 border border-finance-steel/20 hover:bg-finance-charcoal/50'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                            answered
                              ? index === exercises[currentChallenge].correctAnswer
                                ? 'bg-green-500'
                                : index === selectedAnswer
                                  ? 'bg-red-500'
                                  : 'bg-finance-charcoal'
                              : 'bg-finance-charcoal'
                          }`}>
                            {answered && index === exercises[currentChallenge].correctAnswer && (
                              <Check className="h-4 w-4 text-white" />
                            )}
                            {answered && index === selectedAnswer && index !== exercises[currentChallenge].correctAnswer && (
                              <X className="h-4 w-4 text-white" />
                            )}
                            {(!answered || (index !== selectedAnswer && index !== exercises[currentChallenge].correctAnswer)) && (
                              <span className="text-xs">{String.fromCharCode(65 + index)}</span>
                            )}
                          </div>
                          <span>{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {answered && (
                    <div className={`p-4 rounded-lg ${answerCorrect ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
                      <div className="flex items-start mb-2">
                        {answerCorrect ? (
                          <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                        ) : (
                          <X className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                        )}
                        <div>
                          <p className={answerCorrect ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                            {answerCorrect ? "Bonne réponse!" : "Réponse incorrecte"}
                          </p>
                          <p className="text-finance-lightgray text-sm mt-1">
                            {exercises[currentChallenge].explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {gameOver && (
                <div className="text-center py-12">
                  {(score > waveInfo.challenges / 2 && lives > 0) ? (
                    <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  ) : (
                    <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                  )}
                  
                  <h2 className="text-2xl font-bold mb-2">
                    {(score > waveInfo.challenges / 2 && lives > 0)
                      ? "Félicitations!" 
                      : "Défi échoué"}
                  </h2>
                  
                  <p className="text-finance-lightgray mb-4">
                    Score final: {score}/{waveInfo.challenges}
                  </p>
                  
                  <div className="bg-finance-charcoal/30 p-4 rounded-lg max-w-md mx-auto mb-8">
                    <div className="flex justify-between mb-2">
                      <span className="text-finance-lightgray">Précision</span>
                      <span className="font-medium">{Math.round((score / waveInfo.challenges) * 100)}%</span>
                    </div>
                    <Progress value={(score / waveInfo.challenges) * 100} className="h-2 mb-4" />
                    
                    <p className="text-sm text-finance-lightgray">
                      {score > waveInfo.challenges * 0.8 
                        ? "Performance excellente!"
                        : score > waveInfo.challenges * 0.5
                        ? "Bonne performance!"
                        : "Besoin de pratique supplémentaire"}
                    </p>
                    
                    <div className="mt-3 flex items-center justify-center space-x-1">
                      <span className="text-finance-lightgray text-sm">Vies restantes: </span>
                      {[...Array(lives)].map((_, i) => (
                        <Heart 
                          key={i} 
                          className="h-4 w-4 text-red-500 fill-red-500" 
                        />
                      ))}
                      {[...Array(3 - lives)].map((_, i) => (
                        <Heart 
                          key={i} 
                          className="h-4 w-4 text-gray-600" 
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button variant="outline" onClick={() => navigate('/survival-mode')}>
                      Retour aux niveaux
                    </Button>
                    <Button variant="finance" onClick={startGame}>
                      Réessayer
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default BeginnerWave;
