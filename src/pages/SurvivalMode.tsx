
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  AlertTriangle,
  Award,
  Check,
  ChevronRight,
  Clock,
  Heart,
  HelpCircle,
  Home,
  Play,
  Shield,
  X,
  AlertCircle,
  Timer,
  User2,
  BarChart,
  ArrowDownAZ,
  Zap
} from "lucide-react";
import { useTranslation } from "react-i18next";

// Sample questions for different waves
const waves = [
  {
    id: 1,
    name: "Options vanilles européennes",
    difficulty: "Débutant",
    questions: [
      {
        id: "q1_1",
        question: "Calculez le prix d'un call européen avec les paramètres suivants: S = 100, K = 100, T = 1, r = 0.05, σ = 0.2",
        options: [
          { id: "a", text: "10.45 €" },
          { id: "b", text: "8.20 €" },
          { id: "c", text: "12.75 €" },
          { id: "d", text: "9.65 €" }
        ],
        correctAnswer: "a",
        explanation: "En utilisant la formule de Black-Scholes avec les paramètres donnés, le prix du call est de 10.45 €. Le calcul implique d1 = 0.25, d2 = 0.05, N(d1) = 0.599, N(d2) = 0.520."
      },
      {
        id: "q1_2",
        question: "Pour un put européen avec S = 100, K = 110, T = 0.5, r = 0.05, σ = 0.25, quel est son prix selon Black-Scholes?",
        options: [
          { id: "a", text: "7.22 €" },
          { id: "b", text: "12.56 €" },
          { id: "c", text: "9.94 €" },
          { id: "d", text: "14.03 €" }
        ],
        correctAnswer: "c",
        explanation: "Le prix du put européen avec ces paramètres est de 9.94 €, calculé en utilisant la formule P = K*e^(-rT)*N(-d2) - S*N(-d1)."
      },
      {
        id: "q1_3",
        question: "Si la volatilité implicite d'une option call passe de 20% à 25%, que se passe-t-il avec le prix de l'option?",
        options: [
          { id: "a", text: "Le prix augmente" },
          { id: "b", text: "Le prix diminue" },
          { id: "c", text: "Le prix reste inchangé" },
          { id: "d", text: "Impossible à déterminer sans connaître le delta" }
        ],
        correctAnswer: "a",
        explanation: "Le vega d'une option est toujours positif, donc une augmentation de la volatilité entraîne une augmentation du prix de l'option, qu'il s'agisse d'un call ou d'un put."
      }
    ]
  },
  {
    id: 2,
    name: "Options à barrière",
    difficulty: "Intermédiaire",
    questions: [
      {
        id: "q2_1",
        question: "Parmi les options suivantes, laquelle présente généralement un prix inférieur à son équivalent vanille?",
        options: [
          { id: "a", text: "Call Up-and-In" },
          { id: "b", text: "Call Down-and-Out" },
          { id: "c", text: "Put Up-and-Out" },
          { id: "d", text: "Put Down-and-In" }
        ],
        correctAnswer: "c",
        explanation: "Un put Up-and-Out est généralement moins cher que son équivalent vanille car la barrière limite les scénarios où l'option a de la valeur. Si le sous-jacent monte au-dessus de la barrière, l'option disparaît."
      },
      {
        id: "q2_2",
        question: "Pour une option knock-out dont la barrière est très éloignée du prix actuel, comment se compare son prix à celui d'une option vanille?",
        options: [
          { id: "a", text: "Beaucoup plus cher" },
          { id: "b", text: "Légèrement plus cher" },
          { id: "c", text: "Presque identique" },
          { id: "d", text: "Beaucoup moins cher" }
        ],
        correctAnswer: "c",
        explanation: "Si la barrière est très éloignée du prix actuel, la probabilité d'atteindre cette barrière devient très faible, donc le prix de l'option knock-out se rapproche de celui de l'option vanille équivalente."
      }
    ]
  },
  {
    id: 3,
    name: "Volatilité et Greeks",
    difficulty: "Avancé",
    questions: [
      {
        id: "q3_1",
        question: "Laquelle des affirmations suivantes concernant le gamma d'une option est correcte?",
        options: [
          { id: "a", text: "Le gamma est toujours négatif pour un call" },
          { id: "b", text: "Le gamma est maximal lorsque l'option est à la monnaie" },
          { id: "c", text: "Le gamma augmente avec la maturité" },
          { id: "d", text: "Le gamma est plus élevé pour les options à faible volatilité" }
        ],
        correctAnswer: "b",
        explanation: "Le gamma est maximal lorsque l'option est à la monnaie (ATM). Il diminue à mesure que le prix du sous-jacent s'éloigne du strike, que ce soit en position in-the-money ou out-of-the-money."
      }
    ]
  }
];

// Leaderboard data
const leaderboardData = [
  { id: 1, username: "QuantMaster", score: 12500, level: 32, streak: 15 },
  { id: 2, username: "OptionPro", score: 10800, level: 29, streak: 8 },
  { id: 3, username: "VolTrader", score: 9200, level: 25, streak: 12 },
  { id: 4, username: "AlgoFinance", score: 8500, level: 23, streak: 7 },
  { id: 5, username: "BlackScholes", score: 7800, level: 21, streak: 5 }
];

// Quiz result information
const quizResultInfo = {
  score: 2850,
  correct: 8,
  incorrect: 2,
  skipped: 0,
  timeSpent: "4m 35s",
  accuracy: "80%",
  streak: 5,
  levelProgress: 65
};

const SurvivalMode = () => {
  const { t } = useTranslation();
  const [gameState, setGameState] = useState<"intro" | "playing" | "gameOver">("intro");
  const [currentWave, setCurrentWave] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  
  // Effect for the timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isTimerActive && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerActive) {
      // Time's up
      handleIncorrectAnswer();
    }
    
    return () => clearTimeout(timer);
  }, [timeLeft, isTimerActive]);
  
  // Start the game
  const startGame = () => {
    setGameState("playing");
    setCurrentWave(0);
    setCurrentQuestion(0);
    setScore(0);
    setLives(3);
    setTimeLeft(60);
    setIsTimerActive(true);
    setSelectedAnswer(null);
    setIsAnswerRevealed(false);
  };
  
  // Handle answer selection
  const handleAnswerSelect = (answerId: string) => {
    if (isAnswerRevealed) return;
    
    setSelectedAnswer(answerId);
    setIsTimerActive(false);
    
    const isCorrect = answerId === waves[currentWave].questions[currentQuestion].correctAnswer;
    
    if (isCorrect) {
      // Add points based on time left
      const timeBonus = Math.floor(timeLeft / 5);
      const basePoints = 100;
      const totalPoints = basePoints + timeBonus;
      setScore(score + totalPoints);
    } else {
      handleIncorrectAnswer();
    }
    
    setIsAnswerRevealed(true);
  };
  
  // Handle incorrect answer
  const handleIncorrectAnswer = () => {
    setLives(lives - 1);
    if (lives <= 1) {
      // Game over
      setTimeout(() => {
        setGameState("gameOver");
      }, 2000);
    }
  };
  
  // Move to next question
  const moveToNextQuestion = () => {
    // Check if there are more questions in current wave
    if (currentQuestion < waves[currentWave].questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Move to next wave
      if (currentWave < waves.length - 1) {
        setCurrentWave(currentWave + 1);
        setCurrentQuestion(0);
      } else {
        // All waves completed
        setGameState("gameOver");
      }
    }
    
    // Reset for next question
    setSelectedAnswer(null);
    setIsAnswerRevealed(false);
    setTimeLeft(60);
    setIsTimerActive(true);
  };
  
  // Get the current question object
  const getCurrentQuestion = () => {
    if (gameState !== "playing") return null;
    return waves[currentWave].questions[currentQuestion];
  };
  
  // Format time left
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite">
      <Navbar />
      
      <main className="flex-1 py-8 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Game intro screen */}
          {gameState === "intro" && (
            <div className="space-y-8">
              <div className="text-center mb-12">
                <h1 className="text-3xl font-bold terminal-text mb-3">{t('survivalMode.title')}</h1>
                <p className="text-finance-lightgray max-w-2xl mx-auto">
                  {t('survivalMode.subtitle')}
                </p>
              </div>
              
              <div className="finance-card p-6 mb-8">
                <h2 className="text-xl font-medium mb-4">{t('survivalMode.howToPlay')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 rounded-full bg-finance-burgundy/20 mb-3">
                      <Zap className="h-6 w-6 text-finance-accent" />
                    </div>
                    <h3 className="text-finance-offwhite font-medium mb-2">{t('survivalMode.rules.title1')}</h3>
                    <p className="text-finance-lightgray text-sm">
                      {t('survivalMode.rules.desc1')}
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 rounded-full bg-finance-burgundy/20 mb-3">
                      <Heart className="h-6 w-6 text-finance-accent" />
                    </div>
                    <h3 className="text-finance-offwhite font-medium mb-2">{t('survivalMode.rules.title2')}</h3>
                    <p className="text-finance-lightgray text-sm">
                      {t('survivalMode.rules.desc2')}
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 rounded-full bg-finance-burgundy/20 mb-3">
                      <Award className="h-6 w-6 text-finance-accent" />
                    </div>
                    <h3 className="text-finance-offwhite font-medium mb-2">{t('survivalMode.rules.title3')}</h3>
                    <p className="text-finance-lightgray text-sm">
                      {t('survivalMode.rules.desc3')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="finance-card p-6 mb-8">
                <h2 className="text-xl font-medium mb-4">{t('survivalMode.waves')}</h2>
                <div className="space-y-4">
                  {waves.map((wave) => (
                    <div key={wave.id} className="flex justify-between items-center p-4 border border-finance-steel/20 rounded">
                      <div>
                        <h3 className="text-finance-offwhite font-medium">{wave.name}</h3>
                        <p className="text-finance-lightgray text-sm">{wave.questions.length} questions</p>
                      </div>
                      <Badge variant={
                        wave.difficulty === "Débutant" ? "achievement" : 
                        wave.difficulty === "Intermédiaire" ? "warning" : "error"
                      }>
                        {wave.difficulty}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/exercises" className="finance-button-outline text-center">
                  {t('survivalMode.backToExercises')}
                </Link>
                <button onClick={startGame} className="finance-button flex items-center justify-center">
                  <Play className="mr-2 h-4 w-4" />
                  {t('survivalMode.startGame')}
                </button>
              </div>
              
              <div className="mt-8">
                <h2 className="text-xl font-medium mb-4">{t('survivalMode.leaderboard')}</h2>
                <div className="overflow-hidden finance-card">
                  <table className="w-full text-left">
                    <thead className="bg-finance-charcoal/50 border-b border-finance-steel/10">
                      <tr>
                        <th className="px-4 py-3 text-sm font-medium">{t('survivalMode.rank')}</th>
                        <th className="px-4 py-3 text-sm font-medium">{t('survivalMode.player')}</th>
                        <th className="px-4 py-3 text-sm font-medium text-right">{t('survivalMode.score')}</th>
                        <th className="px-4 py-3 text-sm font-medium text-right">{t('survivalMode.level')}</th>
                        <th className="px-4 py-3 text-sm font-medium text-right">{t('survivalMode.streak')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-finance-steel/10">
                      {leaderboardData.map((player, index) => (
                        <tr key={player.id} className="hover:bg-finance-steel/5">
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center">
                              {index === 0 ? (
                                <span className="text-yellow-400 font-bold">#1</span>
                              ) : index === 1 ? (
                                <span className="text-finance-lightgray font-medium">#2</span>
                              ) : index === 2 ? (
                                <span className="text-amber-700 font-medium">#3</span>
                              ) : (
                                <span className="text-finance-lightgray">#{index + 1}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center">
                              <div className="h-6 w-6 rounded-full bg-finance-burgundy/20 flex items-center justify-center mr-2">
                                <User2 className="h-3 w-3 text-finance-accent" />
                              </div>
                              <span className="text-finance-offwhite">{player.username}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-finance-offwhite">
                            {player.score.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <Badge variant="level">Lvl {player.level}</Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <div className="flex items-center justify-end">
                              <Activity className="h-3 w-3 text-finance-accent mr-1" />
                              <span>{player.streak}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {/* Game playing screen */}
          {gameState === "playing" && getCurrentQuestion() && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <Link to="/exercises" className="finance-button-outline text-sm flex items-center">
                  <X className="mr-2 h-4 w-4" />
                  {t('survivalMode.quit')}
                </Link>
                
                <div className="flex gap-4 items-center">
                  <div className="flex items-center">
                    <Award className="h-5 w-5 text-finance-accent mr-2" />
                    <span className="text-finance-offwhite font-medium">{score}</span>
                  </div>
                  <div className="flex">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Heart 
                        key={index} 
                        className={`h-5 w-5 ${index < lives ? 'text-red-500' : 'text-finance-steel/20'}`} 
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="finance-card p-6 mb-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <Badge variant={
                      waves[currentWave].difficulty === "Débutant" ? "achievement" : 
                      waves[currentWave].difficulty === "Intermédiaire" ? "warning" : "error"
                    }>
                      {waves[currentWave].difficulty}
                    </Badge>
                    <h2 className="text-lg font-medium mt-2">{waves[currentWave].name}</h2>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <span className="text-finance-lightgray text-sm">
                      {t('survivalMode.question')} {currentQuestion + 1}/{waves[currentWave].questions.length}
                    </span>
                    <div className={`flex items-center mt-1 ${
                      timeLeft < 10 ? 'text-red-400' : timeLeft < 30 ? 'text-yellow-400' : 'text-finance-lightgray'
                    }`}>
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{formatTimeLeft()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-8">
                  <h3 className="text-xl text-finance-offwhite mb-6">
                    {getCurrentQuestion()?.question}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getCurrentQuestion()?.options.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleAnswerSelect(option.id)}
                        disabled={isAnswerRevealed}
                        className={`p-4 rounded border text-left transition-colors ${
                          !isAnswerRevealed 
                            ? 'border-finance-steel/20 hover:border-finance-accent hover:bg-finance-burgundy/5' 
                            : option.id === getCurrentQuestion()?.correctAnswer
                              ? 'border-green-500 bg-green-900/10'
                              : selectedAnswer === option.id
                                ? 'border-red-500 bg-red-900/10'
                                : 'border-finance-steel/20 opacity-50'
                        }`}
                      >
                        <div className="flex items-start">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 ${
                            !isAnswerRevealed 
                              ? 'bg-finance-steel/20 text-finance-lightgray' 
                              : option.id === getCurrentQuestion()?.correctAnswer
                                ? 'bg-green-900/20 text-green-400'
                                : selectedAnswer === option.id
                                  ? 'bg-red-900/20 text-red-400'
                                  : 'bg-finance-steel/20 text-finance-lightgray'
                          }`}>
                            {isAnswerRevealed ? (
                              option.id === getCurrentQuestion()?.correctAnswer
                                ? <Check className="h-3 w-3" />
                                : selectedAnswer === option.id
                                  ? <X className="h-3 w-3" />
                                  : option.id
                            ) : (
                              option.id
                            )}
                          </div>
                          <span className="text-finance-offwhite">{option.text}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {isAnswerRevealed && (
                  <div className="mb-4">
                    <div className="p-4 rounded bg-finance-charcoal/30 border border-finance-steel/20">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-finance-accent mr-2 mt-0.5" />
                        <div>
                          <h4 className="text-finance-offwhite font-medium mb-2">{t('survivalMode.explanation')}</h4>
                          <p className="text-finance-lightgray text-sm">
                            {getCurrentQuestion()?.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {isAnswerRevealed && (
                  <div className="flex justify-end">
                    <button
                      onClick={moveToNextQuestion}
                      className="finance-button"
                    >
                      {currentQuestion < waves[currentWave].questions.length - 1
                        ? t('survivalMode.nextQuestion')
                        : currentWave < waves.length - 1
                          ? t('survivalMode.nextWave')
                          : t('survivalMode.seeResults')
                      }
                    </button>
                  </div>
                )}
              </div>
              
              <div className="finance-card p-4">
                <div className="flex items-center">
                  <HelpCircle className="h-4 w-4 text-finance-accent mr-2" />
                  <span className="text-finance-offwhite text-sm font-medium">
                    {t('survivalMode.tip')}
                  </span>
                </div>
                <p className="text-finance-lightgray text-xs mt-2">
                  {t('survivalMode.tipText')}
                </p>
              </div>
            </div>
          )}
          
          {/* Game over screen */}
          {gameState === "gameOver" && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold terminal-text mb-3">{t('survivalMode.gameOver')}</h1>
                <p className="text-finance-lightgray">
                  {t('survivalMode.gameOverSubtitle')}
                </p>
              </div>
              
              <div className="finance-card p-6 mb-8">
                <h2 className="text-xl font-medium mb-6 text-center">{t('survivalMode.results')}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                  <div className="flex flex-col items-center">
                    <div className="mb-2">
                      <div className="text-4xl font-bold text-finance-accent">{quizResultInfo.score}</div>
                    </div>
                    <div className="text-finance-lightgray text-sm">{t('survivalMode.totalScore')}</div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="mb-2 flex items-center">
                      <Check className="h-5 w-5 text-green-400 mr-2" />
                      <span className="text-2xl font-bold text-finance-offwhite">{quizResultInfo.correct}</span>
                      <span className="mx-2 text-finance-lightgray">/</span>
                      <X className="h-5 w-5 text-red-400 mr-2" />
                      <span className="text-2xl font-bold text-finance-offwhite">{quizResultInfo.incorrect}</span>
                    </div>
                    <div className="text-finance-lightgray text-sm">{t('survivalMode.correctIncorrect')}</div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="mb-2">
                      <div className="text-2xl font-bold text-finance-offwhite">
                        {quizResultInfo.timeSpent} <span className="text-finance-lightgray font-normal">({quizResultInfo.accuracy})</span>
                      </div>
                    </div>
                    <div className="text-finance-lightgray text-sm">{t('survivalMode.timeAccuracy')}</div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-finance-lightgray">{t('survivalMode.currentStreak')}</span>
                      <div className="flex items-center">
                        <Activity className="h-4 w-4 text-finance-accent mr-2" />
                        <span className="text-finance-offwhite font-medium">{quizResultInfo.streak}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-finance-lightgray">{t('survivalMode.levelProgress')}</span>
                      <div className="flex items-center">
                        <Award className="h-4 w-4 text-finance-accent mr-2" />
                        <span className="text-finance-offwhite font-medium">{quizResultInfo.levelProgress}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-finance-steel/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-finance-accent rounded-full" 
                        style={{ width: `${quizResultInfo.levelProgress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 mt-4 border-t border-finance-steel/10">
                    <div>
                      <h3 className="text-finance-offwhite font-medium">{t('survivalMode.newBadgeUnlocked')}</h3>
                      <p className="text-finance-lightgray text-sm">{t('survivalMode.survivorBadge')}</p>
                    </div>
                    <div className="p-3 rounded-full bg-finance-burgundy/20">
                      <Shield className="h-6 w-6 text-finance-accent" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="finance-card p-6 mb-8">
                <h2 className="text-xl font-medium mb-4">{t('survivalMode.leaderboard')}</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-finance-steel/10">
                      <tr>
                        <th className="px-4 py-3 text-sm font-medium">{t('survivalMode.rank')}</th>
                        <th className="px-4 py-3 text-sm font-medium">{t('survivalMode.player')}</th>
                        <th className="px-4 py-3 text-sm font-medium text-right">{t('survivalMode.score')}</th>
                        <th className="px-4 py-3 text-sm font-medium text-right hidden sm:table-cell">{t('survivalMode.level')}</th>
                        <th className="px-4 py-3 text-sm font-medium text-right hidden md:table-cell">{t('survivalMode.streak')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-finance-steel/10">
                      {leaderboardData.slice(0, 3).map((player, index) => (
                        <tr key={player.id} className="hover:bg-finance-steel/5">
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center">
                              {index === 0 ? (
                                <span className="text-yellow-400 font-bold">#1</span>
                              ) : index === 1 ? (
                                <span className="text-finance-lightgray font-medium">#2</span>
                              ) : (
                                <span className="text-amber-700 font-medium">#3</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center">
                              <div className="h-6 w-6 rounded-full bg-finance-burgundy/20 flex items-center justify-center mr-2">
                                <User2 className="h-3 w-3 text-finance-accent" />
                              </div>
                              <span className="text-finance-offwhite">{player.username}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-finance-offwhite">
                            {player.score.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-right hidden sm:table-cell">
                            <Badge variant="level">Lvl {player.level}</Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-right hidden md:table-cell">
                            <div className="flex items-center justify-end">
                              <Activity className="h-3 w-3 text-finance-accent mr-1" />
                              <span>{player.streak}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {/* Highlighting the user's position */}
                      <tr className="bg-finance-burgundy/10 border-l-2 border-finance-accent">
                        <td className="px-4 py-3 text-sm">
                          <span className="text-finance-accent font-medium">#8</span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center">
                            <div className="h-6 w-6 rounded-full bg-finance-burgundy/30 flex items-center justify-center mr-2">
                              <User2 className="h-3 w-3 text-finance-accent" />
                            </div>
                            <span className="text-finance-accent font-medium">Vous</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-finance-accent">
                          {quizResultInfo.score.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right hidden sm:table-cell">
                          <Badge variant="achievement">Lvl 16</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-right hidden md:table-cell">
                          <div className="flex items-center justify-end text-finance-accent">
                            <Activity className="h-3 w-3 mr-1" />
                            <span>{quizResultInfo.streak}</span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-center">
                  <Link to="/leaderboard" className="text-finance-accent text-sm flex items-center justify-center hover:underline">
                    {t('survivalMode.viewFullLeaderboard')} <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/exercises" className="finance-button-outline text-center">
                  <Home className="mr-2 h-4 w-4" />
                  {t('survivalMode.backToExercises')}
                </Link>
                <button onClick={startGame} className="finance-button flex items-center justify-center">
                  <Play className="mr-2 h-4 w-4" />
                  {t('survivalMode.playAgain')}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SurvivalMode;
