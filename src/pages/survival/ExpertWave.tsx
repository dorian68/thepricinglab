
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import { survivalChallengeTypes } from "@/data/survival-waves";
import { ArrowLeft, Clock, Check, X, Zap, Trophy, AlertTriangle } from "lucide-react";

const ExpertWave = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const waveInfo = {
    id: 4,
    name: "Mode Survie: Expert",
    description: "Relevez le défi avec des options exotiques et des concepts complexes",
    challenges: 25,
    time: 30,
    topics: ["Options Path-Dependent", "Options à Barrière", "Options Asiatiques", "Lookbacks"]
  };
  
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [timeLeft, setTimeLeft] = useState(waveInfo.time);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [answered, setAnswered] = useState(false);
  const [answerCorrect, setAnswerCorrect] = useState(false);
  
  const challenges = survivalChallengeTypes.expert;

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
    setGameOver(false);
    setTimeLeft(waveInfo.time);
  };

  const handleTimeout = () => {
    setAnswered(true);
    setAnswerCorrect(false);
    
    setTimeout(() => {
      if (currentChallenge >= waveInfo.challenges - 1) {
        setGameOver(true);
      } else {
        setCurrentChallenge((prev) => prev + 1);
        setTimeLeft(waveInfo.time);
        setAnswered(false);
      }
    }, 2000);
  };

  const handleAnswer = (correct) => {
    setAnswered(true);
    setAnswerCorrect(correct);
    
    if (correct) {
      setScore((prev) => prev + 1);
    }
    
    setTimeout(() => {
      if (currentChallenge >= waveInfo.challenges - 1) {
        setGameOver(true);
      } else {
        setCurrentChallenge((prev) => prev + 1);
        setTimeLeft(waveInfo.time);
        setAnswered(false);
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
            
            <div className="flex items-center">
              <div className="bg-finance-charcoal/50 px-4 py-2 rounded-md flex items-center">
                <Trophy className="h-4 w-4 text-finance-accent mr-2" />
                <span>Score: <span className="font-medium">{score}</span></span>
              </div>
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
                  <h2 className="text-2xl font-bold mb-2">Prêt pour le niveau expert?</h2>
                  <p className="text-finance-lightgray mb-8 max-w-lg mx-auto">
                    Vous allez affronter {waveInfo.challenges} défis de niveau expert. 
                    Vous aurez {waveInfo.time} secondes pour répondre à chaque question.
                  </p>
                  <Button variant="finance" size="lg" onClick={startGame}>
                    Commencer le défi
                  </Button>
                </div>
              )}
              
              {gameStarted && !gameOver && (
                <div className="py-6">
                  <div className="mb-8">
                    <span className="text-xs uppercase text-finance-lightgray tracking-wider">Défi actuel</span>
                    <h2 className="text-xl font-medium mt-1">{challenges[currentChallenge % challenges.length]}</h2>
                  </div>
                  
                  <div className="bg-finance-charcoal/30 p-6 rounded-lg mb-8">
                    <div className="h-48 flex items-center justify-center border border-dashed border-finance-steel/30 rounded">
                      <p className="text-finance-lightgray">
                        Calculez la valeur demandée en utilisant les paramètres donnés.
                      </p>
                    </div>
                  </div>
                  
                  {answered ? (
                    <div className={`p-4 rounded-lg text-center ${answerCorrect ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
                      <div className="flex items-center justify-center mb-2">
                        {answerCorrect ? (
                          <Check className="h-6 w-6 text-green-500" />
                        ) : (
                          <X className="h-6 w-6 text-red-500" />
                        )}
                      </div>
                      <p className={answerCorrect ? 'text-green-500' : 'text-red-500'}>
                        {answerCorrect ? "Bonne réponse!" : "Réponse incorrecte"}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="mb-4 w-full">
                        <input
                          type="text"
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          placeholder="Entrez votre réponse"
                          className="w-full p-3 bg-finance-charcoal rounded border border-finance-steel/30 focus:border-finance-accent focus:outline-none"
                        />
                      </div>
                      
                      <div className="flex gap-4">
                        <Button variant="ghost" onClick={() => handleAnswer(false)}>
                          Passer
                        </Button>
                        <Button 
                          variant="finance" 
                          onClick={() => handleAnswer(Math.random() > 0.4)}
                        >
                          Soumettre
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {gameOver && (
                <div className="text-center py-12">
                  {score > waveInfo.challenges / 2 ? (
                    <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  ) : (
                    <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                  )}
                  
                  <h2 className="text-2xl font-bold mb-2">
                    {score > waveInfo.challenges / 2 
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
      
     </div>
  );
};

export default ExpertWave;
