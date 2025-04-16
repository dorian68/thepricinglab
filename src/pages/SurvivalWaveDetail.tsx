
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import { useSurvivalWaves, survivalChallengeTypes, SubscriptionPlan } from "@/data/survival-waves";
import { ArrowLeft, Clock, Check, X, Zap, Trophy, AlertTriangle } from "lucide-react";

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
  const [userAnswer, setUserAnswer] = useState("");
  const [answered, setAnswered] = useState(false);
  const [answerCorrect, setAnswerCorrect] = useState(false);
  
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

  const challenges = wave ? getChallengeTypes(wave.id) : [];

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
    setTimeLeft(wave?.time || 30);
  };

  const handleTimeout = () => {
    setAnswered(true);
    setAnswerCorrect(false);
    
    // After 2 seconds, move to next challenge or end game
    setTimeout(() => {
      if (currentChallenge >= (wave?.challenges || 10) - 1) {
        setGameOver(true);
      } else {
        setCurrentChallenge((prev) => prev + 1);
        setTimeLeft(wave?.time || 30);
        setAnswered(false);
      }
    }, 2000);
  };

  const handleAnswer = (correct: boolean) => {
    setAnswered(true);
    setAnswerCorrect(correct);
    
    if (correct) {
      setScore((prev) => prev + 1);
    }
    
    // After 2 seconds, move to next challenge or end game
    setTimeout(() => {
      if (currentChallenge >= (wave?.challenges || 10) - 1) {
        setGameOver(true);
      } else {
        setCurrentChallenge((prev) => prev + 1);
        setTimeLeft(wave?.time || 30);
        setAnswered(false);
      }
    }, 2000);
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
            
            <div className="flex items-center">
              <div className="bg-finance-charcoal/50 px-4 py-2 rounded-md flex items-center">
                <Trophy className="h-4 w-4 text-finance-accent mr-2" />
                <span>{t('survivalMode.score')}: <span className="font-medium">{score}</span></span>
              </div>
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
                    <span>{t('survivalMode.challenge')} {currentChallenge + 1}/{wave.challenges}</span>
                    <span>{Math.round((currentChallenge / wave.challenges) * 100)}%</span>
                  </div>
                  <Progress value={(currentChallenge / wave.challenges) * 100} className="h-1.5" />
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
                    {t('survivalMode.waveDescription', { wave: wave.name, challenges: wave.challenges, time: wave.time })}
                  </p>
                  <Button variant="finance" size="lg" onClick={startGame}>
                    {t('survivalMode.startChallenge')}
                  </Button>
                </div>
              )}
              
              {gameStarted && !gameOver && (
                <div className="py-6">
                  <div className="mb-8">
                    <span className="text-xs uppercase text-finance-lightgray tracking-wider">{t('survivalMode.currentChallenge')}</span>
                    <h2 className="text-xl font-medium mt-1">{challenges[currentChallenge % challenges.length]}</h2>
                  </div>
                  
                  <div className="bg-finance-charcoal/30 p-6 rounded-lg mb-8">
                    {/* This would be the challenge UI - for now just a placeholder */}
                    <div className="h-48 flex items-center justify-center border border-dashed border-finance-steel/30 rounded">
                      <p className="text-finance-lightgray">
                        {t('survivalMode.challengeContent')}
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
                        {answerCorrect 
                          ? t('survivalMode.correctAnswer') 
                          : t('survivalMode.incorrectAnswer')}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="mb-4 w-full">
                        <input
                          type="text"
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          placeholder={t('survivalMode.enterAnswer')}
                          className="w-full p-3 bg-finance-charcoal rounded border border-finance-steel/30 focus:border-finance-accent focus:outline-none"
                        />
                      </div>
                      
                      <div className="flex gap-4">
                        <Button variant="ghost" onClick={() => handleAnswer(false)}>
                          {t('survivalMode.skip')}
                        </Button>
                        <Button 
                          variant="finance" 
                          onClick={() => handleAnswer(Math.random() > 0.4)} // 60% chance to be correct for demo
                        >
                          {t('survivalMode.submit')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {gameOver && (
                <div className="text-center py-12">
                  {score > wave.challenges / 2 ? (
                    <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  ) : (
                    <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                  )}
                  
                  <h2 className="text-2xl font-bold mb-2">
                    {score > wave.challenges / 2 
                      ? t('survivalMode.congratulations') 
                      : t('survivalMode.challengeFailed')}
                  </h2>
                  
                  <p className="text-finance-lightgray mb-4">
                    {t('survivalMode.finalScore', { score, total: wave.challenges })}
                  </p>
                  
                  <div className="bg-finance-charcoal/30 p-4 rounded-lg max-w-md mx-auto mb-8">
                    <div className="flex justify-between mb-2">
                      <span className="text-finance-lightgray">{t('survivalMode.accuracy')}</span>
                      <span className="font-medium">{Math.round((score / wave.challenges) * 100)}%</span>
                    </div>
                    <Progress value={(score / wave.challenges) * 100} className="h-2 mb-4" />
                    
                    <p className="text-sm text-finance-lightgray">
                      {score > wave.challenges * 0.8 
                        ? t('survivalMode.excellentPerformance')
                        : score > wave.challenges * 0.5
                        ? t('survivalMode.goodPerformance')
                        : t('survivalMode.needPractice')}
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button variant="outline" onClick={() => navigate('/survival-mode')}>
                      {t('survivalMode.returnToWaves')}
                    </Button>
                    <Button variant="finance" onClick={startGame}>
                      {t('survivalMode.tryAgain')}
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

export default SurvivalWaveDetail;
