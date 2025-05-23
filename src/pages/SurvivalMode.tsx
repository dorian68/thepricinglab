import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import { 
  ArrowRight, 
  Clock, 
  Trophy, 
  Zap, 
  Lock, 
  Star, 
  GraduationCap, 
  Rocket,
  CheckCircle2,
  Clock4
} from "lucide-react";
import { useSurvivalWaves, getDifficultyColorClass, SubscriptionPlan } from "@/data/survival-waves";
import SurvivalButton from "@/components/survival/SurvivalButton";

const SurvivalMode = () => {
  const { t } = useTranslation();
  const [userPlan] = useState<SubscriptionPlan>('freemium'); // Simulating user's current plan
  
  // Get survival waves from our hook
  const survivalWaves = useSurvivalWaves(userPlan);
  
  // Get saved progress from localStorage (simulated)
  const [waveProgress, setWaveProgress] = useState<{[key: number]: number}>({});
  const [completedWaves, setCompletedWaves] = useState<number[]>([]);
  
  useEffect(() => {
    // Simuler le chargement des progrès de l'utilisateur
    const progress: {[key: number]: number} = {};
    const completed: number[] = [];
    
    survivalWaves.forEach(wave => {
      const highScore = localStorage.getItem(`wave-${wave.id}-highscore`);
      const isCompleted = localStorage.getItem(`wave-${wave.id}-completed`) === 'true';
      
      if (highScore) {
        progress[wave.id] = parseInt(highScore);
      }
      
      if (isCompleted) {
        completed.push(wave.id);
      }
    });
    
    setWaveProgress(progress);
    setCompletedWaves(completed);
  }, [survivalWaves]);
  
  const userStats = {
    highestWave: Math.max(...completedWaves, 0) || 2,
    totalChallenges: 25,
    successRate: 78,
    averageTime: 14.3,
    ranking: 342
  };
  
  // Get the subscription plan icon
  const getPlanIcon = (requiredPlan: SubscriptionPlan) => {
    switch (requiredPlan) {
      case 'freemium':
        return <Star className="h-4 w-4 text-yellow-400" />;
      case 'student':
        return <GraduationCap className="h-4 w-4 text-blue-400" />;
      case 'pro':
        return <Rocket className="h-4 w-4 text-purple-400" />;
      default:
        return null;
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-16 px-6 bg-[url('https://images.unsplash.com/photo-1605792657660-596af9009e82')] bg-cover bg-center">
        <div className="max-w-7xl mx-auto">
          <div className="bg-finance-dark/70 backdrop-blur-sm p-8 rounded-lg max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-finance-accent terminal-text">
              {t('survivalMode.title')}
            </h1>
            <p className="text-finance-offwhite text-lg mb-8">
              {t('survivalMode.subtitle')}
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center bg-finance-charcoal/50 py-2 px-4 rounded">
                <Zap className="text-finance-accent mr-2 h-5 w-5" />
                <span>{t('survivalMode.stats.waves', { count: survivalWaves.length })}</span>
              </div>
              <div className="flex items-center bg-finance-charcoal/50 py-2 px-4 rounded">
                <Trophy className="text-finance-accent mr-2 h-5 w-5" />
                <span>{t('survivalMode.stats.challenges', { count: survivalWaves.reduce((total, wave) => total + wave.challenges, 0) })}</span>
              </div>
              <div className="flex items-center bg-finance-charcoal/50 py-2 px-4 rounded">
                <Clock className="text-finance-accent mr-2 h-5 w-5" />
                <span>{t('survivalMode.stats.timeLimit')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* User Stats */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="finance-card p-6">
            <h2 className="text-xl font-medium mb-6">{t('survivalMode.yourStats')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="p-4 bg-finance-charcoal/30 rounded border border-finance-steel/10">
                <div className="text-finance-lightgray text-sm mb-1">{t('survivalMode.stats.highestWave')}</div>
                <div className="text-2xl font-bold text-finance-offwhite">{userStats.highestWave}</div>
              </div>
              
              <div className="p-4 bg-finance-charcoal/30 rounded border border-finance-steel/10">
                <div className="text-finance-lightgray text-sm mb-1">{t('survivalMode.stats.completed')}</div>
                <div className="text-2xl font-bold text-finance-offwhite">{userStats.totalChallenges}</div>
              </div>
              
              <div className="p-4 bg-finance-charcoal/30 rounded border border-finance-steel/10">
                <div className="text-finance-lightgray text-sm mb-1">{t('survivalMode.stats.success')}</div>
                <div className="text-2xl font-bold text-finance-offwhite">{userStats.successRate}%</div>
              </div>
              
              <div className="p-4 bg-finance-charcoal/30 rounded border border-finance-steel/10">
                <div className="text-finance-lightgray text-sm mb-1">{t('survivalMode.stats.avgTime')}</div>
                <div className="text-2xl font-bold text-finance-offwhite">{userStats.averageTime}s</div>
              </div>
              
              <div className="p-4 bg-finance-charcoal/30 rounded border border-finance-steel/10">
                <div className="text-finance-lightgray text-sm mb-1">{t('survivalMode.stats.ranking')}</div>
                <div className="text-2xl font-bold text-finance-offwhite">#{userStats.ranking}</div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-finance-steel/10">
              <div className="flex items-center justify-between mb-2">
                <div className="text-finance-lightgray">{t('survivalMode.progress')}</div>
                <div className="text-finance-lightgray">{Math.round(userStats.totalChallenges / survivalWaves.reduce((total, wave) => total + wave.challenges, 0) * 100)}%</div>
              </div>
              <Progress value={Math.round(userStats.totalChallenges / survivalWaves.reduce((total, wave) => total + wave.challenges, 0) * 100)} className="h-2" />
            </div>
          </div>
        </div>
      </section>
      
      {/* Subscription Info */}
      {userPlan === 'freemium' && (
        <section className="py-4 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="finance-card p-6 border-finance-accent">
              <div className="flex items-start">
                <div className="bg-finance-charcoal/50 p-3 rounded mr-4">
                  <Lock className="h-6 w-6 text-finance-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium mb-2">{t('survivalMode.subscription.title')}</h3>
                  <p className="text-finance-lightgray mb-4">
                    {t('survivalMode.subscription.description')}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Link to="/pricing?recommended=student" className="finance-button inline-flex items-center">
                      {t('survivalMode.subscription.unlock')} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                    <Link to="/pricing" className="finance-button-outline inline-flex items-center">
                      {t('survivalMode.subscription.comparePlans')}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
      
      {/* Available Waves */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 terminal-text">{t('survivalMode.availableWaves')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {survivalWaves.map((wave) => {
              const isCompleted = completedWaves.includes(wave.id);
              const hasProgress = waveProgress[wave.id] !== undefined;
              const waveHighScore = waveProgress[wave.id] || 0;
              
              return (
                <div key={wave.id} className={`finance-card p-0 overflow-hidden group relative
                  ${isCompleted ? 'border-green-500/30' : hasProgress ? 'border-yellow-500/30' : ''}`}
                >
                  {isCompleted && (
                    <div className="absolute top-3 right-3 z-10 bg-green-900/80 p-1.5 rounded-full">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    </div>
                  )}
                  
                  {hasProgress && !isCompleted && (
                    <div className="absolute top-3 right-3 z-10 bg-yellow-900/80 p-1.5 rounded-full">
                      <Clock4 className="h-4 w-4 text-yellow-400" />
                    </div>
                  )}
                  
                  <div className="relative aspect-video bg-finance-charcoal">
                    <div className={`bg-cover bg-center w-full h-full ${!wave.unlocked ? 'opacity-30' : 'opacity-50'}`} style={{ backgroundImage: `url(${wave.image})` }}></div>
                    
                    {!wave.unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-finance-dark/40">
                        <div className="p-3 rounded-full bg-finance-dark/60 border border-finance-steel/30">
                          <Lock className="h-6 w-6 text-finance-accent" />
                        </div>
                      </div>
                    )}
                    
                    <div className="absolute top-4 left-4 flex space-x-2">
                      <span className={`terminal-text text-xs px-2 py-1 rounded text-finance-offwhite ${getDifficultyColorClass(wave.difficulty)}`}>
                        {t(`survivalMode.difficulty.${wave.difficulty}`)}
                      </span>
                      
                      <Badge variant="outline" className="bg-finance-dark/50 border-finance-steel/20 flex items-center space-x-1">
                        {getPlanIcon(wave.requiredPlan)}
                        <span className="text-xs">
                          {wave.requiredPlan === 'freemium' ? t('pricing.freemium.badge') : 
                           wave.requiredPlan === 'student' ? t('pricing.student.badge') : 
                           t('pricing.pro.badge')}
                        </span>
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-medium text-finance-offwhite mb-2">{wave.name}</h3>
                    <p className="text-finance-lightgray text-sm mb-4">{wave.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center">
                        <Zap className="h-4 w-4 text-finance-accent mr-2" />
                        <span className="text-finance-lightgray text-sm">{wave.challenges} {t('survivalMode.challenges')}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-finance-accent mr-2" />
                        <span className="text-finance-lightgray text-sm">{wave.time}s {t('survivalMode.perChallenge')}</span>
                      </div>
                    </div>
                    
                    {hasProgress && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-finance-lightgray mb-1">
                          <span>Score actuel</span>
                          <span className="font-medium">{waveHighScore} pts</span>
                        </div>
                        <Progress 
                          value={isCompleted ? 100 : 60} 
                          className={`h-1.5 ${isCompleted ? 'bg-green-500' : ''}`} 
                        />
                      </div>
                    )}
                    
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-finance-offwhite mb-2">{t('survivalMode.topics')}:</h4>
                      <div className="flex flex-wrap gap-2">
                        {wave.topics.map((topic, index) => (
                          <span key={index} className="text-xs bg-finance-charcoal/50 px-2 py-1 rounded text-finance-lightgray">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {wave.unlocked ? (
                      <SurvivalButton 
                        waveId={wave.id}
                        className="w-full"
                      />
                    ) : (
                      <Button variant="finance" className="w-full" asChild>
                        <Link to={`/pricing?recommended=${wave.requiredPlan}`}>
                          {t('survivalMode.unlockWave')} <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      
      {/* Leaderboard Preview */}
      <section className="py-16 px-6 bg-finance-charcoal/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-start mb-8">
            <h2 className="text-2xl font-bold terminal-text">{t('survivalMode.leaderboard')}</h2>
            <Link to="/leaderboard" className="text-finance-accent hover:underline flex items-center">
              {t('survivalMode.viewFull')} <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="finance-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-finance-charcoal/50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-finance-lightgray uppercase tracking-wider">
                      {t('survivalMode.rank')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-finance-lightgray uppercase tracking-wider">
                      {t('survivalMode.player')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-finance-lightgray uppercase tracking-wider">
                      {t('survivalMode.highestWave')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-finance-lightgray uppercase tracking-wider">
                      {t('survivalMode.challenges')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-finance-lightgray uppercase tracking-wider">
                      {t('survivalMode.success')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-finance-lightgray uppercase tracking-wider">
                      {t('survivalMode.avgTime')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-finance-steel/10">
                  {[
                    { rank: 1, player: "QuantKing", avatar: "👑", wave: 6, challenges: 142, success: "94%", time: "12.3s" },
                    { rank: 2, player: "OptionsMaster", avatar: "🔥", wave: 6,  challenges: 138, success: "92%", time: "12.7s" },
                    { rank: 3, player: "VolTrader", avatar: "⚡", wave: 5, challenges: 135, success: "88%", time: "13.1s" },
                    { rank: 4, player: "DerivDragon", avatar: "🐉", wave: 5, challenges: 130, success: "90%", time: "13.5s" },
                    { rank: 5, player: "AlphaHunter", avatar: "🎯", wave: 5, challenges: 128, success: "86%", time: "13.8s" }
                  ].map((row) => (
                    <tr key={row.rank} className="hover:bg-finance-charcoal/20">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-finance-offwhite font-medium">#{row.rank}</span>
                          {row.rank <= 3 && (
                            <Trophy className={`ml-2 h-4 w-4 ${
                              row.rank === 1 ? 'text-yellow-400' :
                              row.rank === 2 ? 'text-gray-400' :
                              'text-amber-700'
                            }`} />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="mr-2">{row.avatar}</span>
                          <span className="text-finance-offwhite">{row.player}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-finance-offwhite">
                        {row.wave}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-finance-offwhite">
                        {row.challenges}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-finance-offwhite">
                        {row.success}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-finance-offwhite">
                        {row.time}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Current user */}
                  <tr className="bg-finance-accent/10 border border-finance-accent/20">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-finance-offwhite font-medium">#{userStats.ranking}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="mr-2">👤</span>
                        <span className="text-finance-offwhite font-medium">You</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-finance-offwhite">
                      {userStats.highestWave}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-finance-offwhite">
                      {userStats.totalChallenges}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-finance-offwhite">
                      {userStats.successRate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-finance-offwhite">
                      {userStats.averageTime}s
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
      
    </div>
  );
};

export default SurvivalMode;
