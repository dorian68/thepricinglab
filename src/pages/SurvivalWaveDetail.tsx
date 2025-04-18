
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import { useSurvivalWaves, survivalChallengeTypes, SubscriptionPlan } from "@/data/survival-waves";
import { ArrowLeft, Clock, Check, X, Zap, Trophy, AlertTriangle, Heart, Flame } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Type pour les questions QCM
type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
};

// Fonction pour générer des questions basées sur les sujets et la difficulté
const generateQuestions = (topics: string[], difficulty: string, count: number = 5): QuizQuestion[] => {
  // Cette fonction simule la génération de questions
  // Dans une implémentation réelle, ces questions viendraient d'une API ou d'une base de données
  const questions: QuizQuestion[] = [];
  
  const difficultyLevel = 
    difficulty === 'beginner' ? 1 :
    difficulty === 'intermediate' ? 2 :
    difficulty === 'advanced' ? 3 :
    difficulty === 'expert' ? 4 : 5;
  
  for (let i = 0; i < count; i++) {
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const questionLevel = Math.min(5, Math.max(1, difficultyLevel + (i % 3 - 1))) as 1 | 2 | 3 | 4 | 5;
    
    questions.push({
      question: `Question ${i+1} sur ${topic} (Niveau ${questionLevel}/5)`,
      options: [
        `Option A pour ${topic}`,
        `Option B pour ${topic}`,
        `Option C pour ${topic}`,
        `Option D pour ${topic}`
      ],
      correctAnswer: Math.floor(Math.random() * 4),
      explanation: `Explication de la réponse correcte pour ${topic}`,
      difficulty: questionLevel
    });
  }
  
  return questions;
};

const SurvivalWaveDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [userPlan] = useState<SubscriptionPlan>('freemium'); // Simulating user's plan
  
  const survivalWaves = useSurvivalWaves(userPlan);
  const wave = survivalWaves.find((w) => w.id === Number(id));
  
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [timeLeft, setTimeLeft] = useState(wave?.time || 30);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [answerCorrect, setAnswerCorrect] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  
  // Nouvelles fonctionnalités
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [mistakes, setMistakes] = useState<number[]>([]);
  const [successRate, setSuccessRate] = useState(0);
  
  // Get challenge types based on wave id
  const getChallengeTypes = (waveId: number) => {
    switch(waveId) {
      case 1: return survivalChallengeTypes.beginner;
      case 2: return survivalChallengeTypes.intermediate;
      case 3: return survivalChallengeTypes.advanced;
      case 4: return survivalChallengeTypes.expert;
      case 5: return survivalChallengeTypes.master;
      case 6: return survivalChallengeTypes.legendary;
      default: return survivalChallengeTypes.beginner;
    }
  };

  const getDifficultyByWaveId = (waveId: number) => {
    switch(waveId) {
      case 1: return 'beginner';
      case 2: return 'intermediate';
      case 3: return 'advanced';
      case 4: return 'expert';
      case 5: return 'master';
      case 6: return 'legendary';
      default: return 'beginner';
    }
  };

  const challenges = wave ? getChallengeTypes(wave.id) : [];

  // Générer des questions au démarrage du jeu
  useEffect(() => {
    if (wave) {
      const difficulty = getDifficultyByWaveId(wave.id);
      const questionCount = Math.min(10, Math.max(5, wave.id + 4)); // 5 à 10 questions selon le niveau
      const generatedQuestions = generateQuestions(wave.topics, difficulty, questionCount);
      setQuestions(generatedQuestions);
    }
  }, [wave]);

  useEffect(() => {
    // Redirect if wave doesn't exist or isn't unlocked
    if (!wave) {
      navigate('/survival-mode');
      return;
    }
    
    if (!wave.unlocked) {
      navigate(`/pricing?recommended=${wave.requiredPlan}`);
      return;
    }
  }, [wave, navigate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (gameStarted && !gameOver && !answered && lives > 0) {
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
  }, [gameStarted, gameOver, answered, lives]);

  const startGame = () => {
    setGameStarted(true);
    setCurrentChallenge(0);
    setScore(0);
    setLives(3);
    setCombo(0);
    setMaxCombo(0);
    setGameOver(false);
    setTimeLeft(wave?.time || 30);
    setMistakes([]);
    setSelectedOption(null);
    
    // Générer de nouvelles questions
    if (wave) {
      const difficulty = getDifficultyByWaveId(wave.id);
      const questionCount = Math.min(10, Math.max(5, wave.id + 4));
      const generatedQuestions = generateQuestions(wave.topics, difficulty, questionCount);
      setQuestions(generatedQuestions);
    }
    
    toast.success("Mode Survie démarré ! Bonne chance !");
  };

  const handleTimeout = () => {
    setAnswered(true);
    setAnswerCorrect(false);
    setLives(prev => prev - 1);
    setCombo(0);
    
    if (!mistakes.includes(currentChallenge)) {
      setMistakes(prev => [...prev, currentChallenge]);
    }
    
    // After 2 seconds, move to next challenge or end game
    setTimeout(() => {
      if (lives <= 1) {
        endGame();
      } else if (currentChallenge >= (questions.length - 1)) {
        endGame();
      } else {
        setCurrentChallenge((prev) => prev + 1);
        setTimeLeft(wave?.time || 30);
        setAnswered(false);
        setSelectedOption(null);
      }
    }, 2000);
  };

  const handleAnswer = (optionIndex: number) => {
    if (answered) return; // Empêcher le clic multiple sur les options
    
    setSelectedOption(optionIndex);
    setAnswered(true);
    
    const correct = questions[currentChallenge]?.correctAnswer === optionIndex;
    setAnswerCorrect(correct);
    
    if (correct) {
      // Calculer le score basé sur la difficulté et le temps restant
      const difficultyBonus = questions[currentChallenge]?.difficulty || 1;
      const timeBonus = Math.max(1, timeLeft / (wave?.time || 30));
      const pointsEarned = Math.round((10 * difficultyBonus) * timeBonus);
      
      setScore(prev => prev + pointsEarned);
      setCombo(prev => prev + 1);
      setMaxCombo(prev => Math.max(prev, combo + 1));
      
      // Afficher un toast pour les points gagnés
      if (combo >= 2) {
        toast.success(`Combo x${combo + 1}! +${pointsEarned} points`, {
          icon: <Flame className="text-yellow-500 h-5 w-5" />
        });
      } else {
        toast.success(`+${pointsEarned} points`);
      }
    } else {
      setLives(prev => prev - 1);
      setCombo(0);
      
      if (!mistakes.includes(currentChallenge)) {
        setMistakes(prev => [...prev, currentChallenge]);
      }
      
      toast.error("Réponse incorrecte");
    }
    
    // After 2 seconds, move to next challenge or end game
    setTimeout(() => {
      if (lives <= 1 && !correct) {
        endGame();
      } else if (currentChallenge >= (questions.length - 1)) {
        endGame();
      } else {
        setCurrentChallenge((prev) => prev + 1);
        setTimeLeft(wave?.time || 30);
        setAnswered(false);
        setSelectedOption(null);
      }
    }, 2000);
  };

  const endGame = () => {
    setGameOver(true);
    // Calculer le taux de réussite
    const correctAnswers = questions.length - mistakes.length;
    const successRateValue = Math.round((correctAnswers / questions.length) * 100);
    setSuccessRate(successRateValue);
    
    // Sauvegarder la progression (simulé)
    // Dans une implémentation réelle, cela serait sauvegardé dans une base de données
    localStorage.setItem(`wave-${id}-highscore`, score.toString());
    localStorage.setItem(`wave-${id}-completed`, successRateValue >= 80 ? 'true' : 'false');
    
    // Afficher un toast pour le résultat final
    if (successRateValue >= 80) {
      toast.success("Vague complétée avec succès! Vous avez débloqué la prochaine vague!", {
        duration: 5000
      });
    } else if (successRateValue >= 50) {
      toast.info("Vague terminée! Essayez d'atteindre 80% pour débloquer la prochaine vague.", {
        duration: 5000
      });
    } else {
      toast.error("Vague échouée. Réessayez pour vous améliorer!", {
        duration: 5000
      });
    }
  };

  const getCurrentQuestion = () => {
    return questions[currentChallenge] || null;
  };

  if (!wave) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite">
      <Navbar />
      
      <main className="flex-1 py-8 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/survival-mode" className="text-finance-lightgray hover:text-finance-offwhite flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('survivalMode.backToWaves')}
            </Link>
            
            <div className="flex items-center space-x-3">
              <div className="bg-finance-charcoal/50 px-4 py-2 rounded-md flex items-center">
                <Trophy className="h-4 w-4 text-finance-accent mr-2" />
                <span>{t('survivalMode.score')}: <span className="font-medium">{score}</span></span>
              </div>
              
              {gameStarted && !gameOver && (
                <div className="bg-finance-charcoal/50 px-4 py-2 rounded-md flex items-center">
                  <Flame className="h-4 w-4 text-yellow-500 mr-2" />
                  <span>Combo: <span className="font-medium">{combo}x</span></span>
                </div>
              )}
              
              {gameStarted && !gameOver && (
                <div className="bg-finance-charcoal/50 px-4 py-2 rounded-md flex items-center">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Heart 
                      key={i} 
                      className={`h-4 w-4 mr-1 ${i < lives ? 'text-red-500 fill-red-500' : 'text-finance-steel/30'}`} 
                    />
                  ))}
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
                  <h1 className="text-xl font-medium text-finance-accent">{wave.name}</h1>
                  <p className="text-finance-lightgray text-sm">{wave.description}</p>
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
                    <span>{t('survivalMode.challenge')} {currentChallenge + 1}/{questions.length}</span>
                    <span>{Math.round((currentChallenge / questions.length) * 100)}%</span>
                  </div>
                  <Progress value={(currentChallenge / questions.length) * 100} className="h-1.5" />
                </div>
              )}
            </div>
            
            {/* Game content */}
            <div className="p-6">
              {!gameStarted && (
                <div className="text-center py-12">
                  <Zap className="h-12 w-12 text-finance-accent mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">{t('survivalMode.readyToStart')}</h2>
                  <p className="text-finance-lightgray mb-8 max-w-lg mx-auto">
                    {t('survivalMode.waveDescription', { wave: wave.name, challenges: questions.length, time: wave.time })}
                  </p>
                  
                  <div className="mb-8 bg-finance-charcoal/30 rounded-lg p-4 max-w-md mx-auto">
                    <h3 className="text-lg font-medium mb-2">Règles du jeu</h3>
                    <ul className="text-sm text-left text-finance-lightgray space-y-2">
                      <li className="flex items-start">
                        <Heart className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                        <span>Vous avez 3 vies pour compléter la vague</span>
                      </li>
                      <li className="flex items-start">
                        <Clock className="h-4 w-4 text-finance-accent mr-2 mt-0.5" />
                        <span>Répondez avant que le temps ne s'écoule</span>
                      </li>
                      <li className="flex items-start">
                        <Flame className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                        <span>Enchaînez les bonnes réponses pour des combos et plus de points</span>
                      </li>
                      <li className="flex items-start">
                        <Trophy className="h-4 w-4 text-finance-accent mr-2 mt-0.5" />
                        <span>Atteignez 80% de réussite pour débloquer la vague suivante</span>
                      </li>
                    </ul>
                  </div>
                  
                  <Button variant="finance" size="lg" onClick={startGame}>
                    {t('survivalMode.startChallenge')}
                  </Button>
                </div>
              )}
              
              {gameStarted && !gameOver && (
                <div className="py-6">
                  <div className="mb-8">
                    <div className="flex justify-between items-center">
                      <span className="text-xs uppercase text-finance-lightgray tracking-wider">
                        {t('survivalMode.currentChallenge')}
                      </span>
                      <Badge className="bg-finance-accent/20 text-finance-accent border-0">
                        Difficulté {getCurrentQuestion()?.difficulty}/5
                      </Badge>
                    </div>
                    <h2 className="text-xl font-medium mt-1">
                      {challenges[currentChallenge % challenges.length]}
                    </h2>
                  </div>
                  
                  <div className="bg-finance-charcoal/30 p-6 rounded-lg mb-8">
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-4">{getCurrentQuestion()?.question}</h3>
                      
                      {/* Fixed: Stabilized the options layout with fixed heights and absolute positioning for icons */}
                      <div className="space-y-3">
                        {getCurrentQuestion()?.options.map((option, index) => (
                          <div 
                            key={index}
                            className={`flex items-center space-x-2 p-3 rounded-md border relative h-[56px] 
                              ${!answered ? 'cursor-pointer' : 'cursor-default'} 
                              ${answered && index === getCurrentQuestion()?.correctAnswer 
                                ? 'bg-green-900/20 border-green-500/30' 
                                : answered && index === selectedOption 
                                  ? 'bg-red-900/20 border-red-500/30' 
                                  : 'border-finance-steel/30 hover:border-finance-accent/50'
                              }`}
                            onClick={() => !answered && handleAnswer(index)}
                          >
                            <div className="flex items-center w-full">
                              <span className={`h-4 w-4 rounded-full border ${answered && index === selectedOption ? 'bg-finance-accent border-finance-accent' : 'border-finance-steel'}`}></span>
                              <span className="ml-2 flex-1">{option}</span>
                              
                              {answered && index === getCurrentQuestion()?.correctAnswer && (
                                <Check className="h-5 w-5 text-green-500 absolute right-3" />
                              )}
                              {answered && index === selectedOption && index !== getCurrentQuestion()?.correctAnswer && (
                                <X className="h-5 w-5 text-red-500 absolute right-3" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {answered && (
                      <div className={`p-4 rounded-lg ${answerCorrect ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
                        <div className="flex items-center mb-2">
                          {answerCorrect ? (
                            <Check className="h-5 w-5 text-green-500 mr-2" />
                          ) : (
                            <X className="h-5 w-5 text-red-500 mr-2" />
                          )}
                          <h4 className={`font-medium ${answerCorrect ? 'text-green-500' : 'text-red-500'}`}>
                            {answerCorrect ? 'Bonne réponse!' : 'Réponse incorrecte'}
                          </h4>
                        </div>
                        <p className="text-sm text-finance-lightgray">
                          {getCurrentQuestion()?.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {gameOver && (
                <div className="text-center py-12">
                  {successRate >= 80 ? (
                    <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  ) : successRate >= 50 ? (
                    <Trophy className="h-12 w-12 text-finance-accent mx-auto mb-4" />
                  ) : (
                    <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                  )}
                  
                  <h2 className="text-2xl font-bold mb-2">
                    {successRate >= 80 
                      ? "Félicitations!"
                      : successRate >= 50
                      ? "Bien joué!"
                      : t('survivalMode.challengeFailed')}
                  </h2>
                  
                  <p className="text-finance-lightgray mb-4">
                    {t('survivalMode.finalScore', { score, total: questions.length })}
                  </p>
                  
                  <div className="bg-finance-charcoal/30 p-4 rounded-lg max-w-md mx-auto mb-8">
                    <div className="flex justify-between mb-2">
                      <span className="text-finance-lightgray">{t('survivalMode.accuracy')}</span>
                      <span className="font-medium">{successRate}%</span>
                    </div>
                    <Progress 
                      value={successRate} 
                      className={`h-2 mb-4 ${
                        successRate >= 80 ? 'bg-green-500' : 
                        successRate >= 50 ? 'bg-finance-accent' : 
                        'bg-red-500'
                      }`} 
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-finance-charcoal/50 p-3 rounded">
                        <div className="text-finance-lightgray text-xs mb-1">Score final</div>
                        <div className="text-xl font-medium">{score} pts</div>
                      </div>
                      
                      <div className="bg-finance-charcoal/50 p-3 rounded">
                        <div className="text-finance-lightgray text-xs mb-1">Combo max</div>
                        <div className="text-xl font-medium">{maxCombo}x</div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-finance-lightgray">
                      {successRate >= 80 
                        ? t('survivalMode.excellentPerformance')
                        : successRate >= 50
                        ? t('survivalMode.goodPerformance')
                        : t('survivalMode.needPractice')}
                    </p>
                    
                    {successRate < 80 && (
                      <div className="mt-4 pt-4 border-t border-finance-steel/10">
                        <h4 className="text-sm font-medium mb-2">Suggestions d'amélioration :</h4>
                        <ul className="text-sm text-finance-lightgray list-disc list-inside">
                          <li>Révisez les concepts de {wave.topics[0]} et {wave.topics[1]}</li>
                          <li>Travaillez sur la rapidité de vos calculs</li>
                          <li>Pratiquez avec les exercices de niveau {wave.id}</li>
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button variant="outline" onClick={() => navigate('/survival-mode')}>
                      {t('survivalMode.returnToWaves')}
                    </Button>
                    <Button variant="finance" onClick={startGame}>
                      {t('survivalMode.tryAgain')}
                    </Button>
                    
                    {successRate >= 80 && wave.id < 6 && (
                      <Button 
                        variant="finance" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => navigate(`/survival-mode/wave/${wave.id + 1}`)}
                      >
                        Niveau suivant
                        <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                      </Button>
                    )}
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

export default SurvivalWaveDetail;
