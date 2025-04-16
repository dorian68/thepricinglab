
import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Dumbbell, 
  Lightbulb, 
  GraduationCap, 
  BookOpen, 
  Target, 
  Trophy,
  Zap,
  ArrowRight
} from "lucide-react";

const Practice = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero section */}
        <section className="py-16 px-6 bg-gradient-to-b from-finance-charcoal to-finance-dark">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 terminal-text text-finance-accent">
              Entraînement & Challenges
            </h1>
            <p className="text-xl text-finance-lightgray max-w-3xl mx-auto mb-8">
              Mettez vos connaissances à l'épreuve avec des exercices pratiques et des défis chronométrés
            </p>
            
            <div className="flex flex-wrap justify-center gap-6 mt-8">
              <div className="flex items-center bg-finance-charcoal/50 py-3 px-6 rounded-lg">
                <Dumbbell className="text-finance-accent mr-3 h-5 w-5" />
                <span>Exercices guidés</span>
              </div>
              <div className="flex items-center bg-finance-charcoal/50 py-3 px-6 rounded-lg">
                <Zap className="text-finance-accent mr-3 h-5 w-5" />
                <span>Mode survie</span>
              </div>
              <div className="flex items-center bg-finance-charcoal/50 py-3 px-6 rounded-lg">
                <Trophy className="text-finance-accent mr-3 h-5 w-5" />
                <span>Classements</span>
              </div>
            </div>
          </div>
        </section>
        
        {/* Main content with tabs */}
        <section className="py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <Tabs defaultValue="exercises" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="exercises" className="text-lg py-3">
                  <BookOpen className="mr-2 h-5 w-5" /> Exercices
                </TabsTrigger>
                <TabsTrigger value="survival" className="text-lg py-3">
                  <Zap className="mr-2 h-5 w-5" /> Mode Survie
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="exercises" className="space-y-8">
                <div className="finance-card p-6">
                  <div className="flex items-start">
                    <div className="bg-finance-charcoal/50 p-3 rounded-lg mr-4">
                      <GraduationCap className="h-8 w-8 text-finance-accent" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold mb-2">Exercices Guidés</h2>
                      <p className="text-finance-lightgray mb-4">
                        Des exercices pratiques pour maîtriser chaque concept à votre rythme, avec des indices et des solutions détaillées.
                      </p>
                      <Link to="/exercises">
                        <Button variant="finance" className="flex items-center">
                          Accéder aux exercices <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="finance-card p-6">
                    <div className="flex flex-col h-full">
                      <div className="mb-4">
                        <span className="terminal-text px-2 py-1 bg-green-600/30 text-green-400 text-xs rounded">DÉBUTANT</span>
                      </div>
                      <h3 className="text-lg font-bold mb-2">Fondamentaux</h3>
                      <p className="text-finance-lightgray mb-4 flex-grow">
                        Exercices sur Black-Scholes, options européennes, et calculs de Greeks de base.
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-finance-lightgray">15 exercices</span>
                        <Link to="/exercises?level=beginner">
                          <Button variant="outline" size="sm" className="flex items-center">
                            Commencer <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                  
                  <div className="finance-card p-6">
                    <div className="flex flex-col h-full">
                      <div className="mb-4">
                        <span className="terminal-text px-2 py-1 bg-yellow-600/30 text-yellow-400 text-xs rounded">INTERMÉDIAIRE</span>
                      </div>
                      <h3 className="text-lg font-bold mb-2">Options Avancées</h3>
                      <p className="text-finance-lightgray mb-4 flex-grow">
                        Exercices sur les options américaines, valorisation binomiale et stratégies de couverture.
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-finance-lightgray">20 exercices</span>
                        <Link to="/exercises?level=intermediate">
                          <Button variant="outline" size="sm" className="flex items-center">
                            Commencer <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                  
                  <div className="finance-card p-6">
                    <div className="flex flex-col h-full">
                      <div className="mb-4">
                        <span className="terminal-text px-2 py-1 bg-red-600/30 text-red-400 text-xs rounded">AVANCÉ</span>
                      </div>
                      <h3 className="text-lg font-bold mb-2">Sujets Complexes</h3>
                      <p className="text-finance-lightgray mb-4 flex-grow">
                        Exercices sur volatilité stochastique, options exotiques et modèles multi-factoriels.
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-finance-lightgray">25 exercices</span>
                        <Link to="/exercises?level=advanced">
                          <Button variant="outline" size="sm" className="flex items-center">
                            Commencer <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="survival" className="space-y-8">
                <div className="finance-card p-6">
                  <div className="flex items-start">
                    <div className="bg-finance-charcoal/50 p-3 rounded-lg mr-4">
                      <Zap className="h-8 w-8 text-finance-accent" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold mb-2">Mode Survie</h2>
                      <p className="text-finance-lightgray mb-4">
                        Défiez-vous avec des challenges chronométrés de difficulté croissante pour tester vos compétences sous pression.
                      </p>
                      <Link to="/survival-mode">
                        <Button variant="finance" className="flex items-center">
                          Accéder au mode survie <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Link to="/survival-mode/wave/1" className="block">
                    <div className="finance-card p-0 overflow-hidden h-full transition-transform hover:scale-[1.02]">
                      <div className="relative h-40 bg-cover bg-center" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3)` }}>
                        <div className="absolute inset-0 bg-finance-dark/40"></div>
                        <div className="absolute top-4 left-4">
                          <span className="terminal-text text-xs px-2 py-1 rounded text-finance-offwhite bg-green-600/80">
                            DÉBUTANT
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold mb-2">Niveau Débutant</h3>
                        <p className="text-finance-lightgray mb-4">
                          10 défis sur les concepts fondamentaux de Black-Scholes et des options vanille.
                        </p>
                        <div className="flex items-center text-sm text-finance-lightgray">
                          <Clock className="h-4 w-4 mr-1 text-finance-accent" /> 15s par défi
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  <Link to="/survival-mode/wave/2" className="block">
                    <div className="finance-card p-0 overflow-hidden h-full transition-transform hover:scale-[1.02]">
                      <div className="relative h-40 bg-cover bg-center" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1642104704074-907c0698cbd9)` }}>
                        <div className="absolute inset-0 bg-finance-dark/40"></div>
                        <div className="absolute top-4 left-4">
                          <span className="terminal-text text-xs px-2 py-1 rounded text-finance-offwhite bg-yellow-600/80">
                            INTERMÉDIAIRE
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold mb-2">Niveau Intermédiaire</h3>
                        <p className="text-finance-lightgray mb-4">
                          15 défis sur les arbres binomiaux, options américaines et stratégies de couverture.
                        </p>
                        <div className="flex items-center text-sm text-finance-lightgray">
                          <Clock className="h-4 w-4 mr-1 text-finance-accent" /> 20s par défi
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  <Link to="/survival-mode/wave/3" className="block">
                    <div className="finance-card p-0 overflow-hidden h-full transition-transform hover:scale-[1.02]">
                      <div className="relative h-40 bg-cover bg-center" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1569025743873-ea3a9ade89f9)` }}>
                        <div className="absolute inset-0 bg-finance-dark/40"></div>
                        <div className="absolute top-4 left-4">
                          <span className="terminal-text text-xs px-2 py-1 rounded text-finance-offwhite bg-orange-600/80">
                            AVANCÉ
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold mb-2">Niveau Avancé</h3>
                        <p className="text-finance-lightgray mb-4">
                          20 défis sur la volatilité stochastique, Monte Carlo et options exotiques européennes.
                        </p>
                        <div className="flex items-center text-sm text-finance-lightgray">
                          <Clock className="h-4 w-4 mr-1 text-finance-accent" /> 25s par défi
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  <Link to="/survival-mode/wave/4" className="block">
                    <div className="finance-card p-0 overflow-hidden h-full transition-transform hover:scale-[1.02]">
                      <div className="relative h-40 bg-cover bg-center" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1605792657660-596af9009e82)` }}>
                        <div className="absolute inset-0 bg-finance-dark/40"></div>
                        <div className="absolute top-4 left-4">
                          <span className="terminal-text text-xs px-2 py-1 rounded text-finance-offwhite bg-red-600/80">
                            EXPERT
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold mb-2">Niveau Expert</h3>
                        <p className="text-finance-lightgray mb-4">
                          25 défis sur les options path-dependent, barrières, asiatiques et lookbacks.
                        </p>
                        <div className="flex items-center text-sm text-finance-lightgray">
                          <Clock className="h-4 w-4 mr-1 text-finance-accent" /> 30s par défi
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
                
                <div className="flex justify-center">
                  <Link to="/survival-mode">
                    <Button variant="outline" className="flex items-center">
                      Voir tous les niveaux de défi <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
        
        {/* Leaderboard preview */}
        <section className="py-12 px-6 bg-finance-charcoal/20">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold terminal-text">Classement</h2>
              <Link to="/leaderboard" className="text-finance-accent hover:underline flex items-center">
                Voir le classement complet <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            
            <div className="finance-card p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-finance-steel/10">
                      <th className="text-left py-3 px-4 font-medium text-finance-lightgray">Rang</th>
                      <th className="text-left py-3 px-4 font-medium text-finance-lightgray">Utilisateur</th>
                      <th className="text-left py-3 px-4 font-medium text-finance-lightgray">Niveau max</th>
                      <th className="text-left py-3 px-4 font-medium text-finance-lightgray">Score total</th>
                      <th className="text-left py-3 px-4 font-medium text-finance-lightgray">Précision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { rank: 1, user: "QuantKing", avatar: "👑", level: "Légendaire", score: 2840, accuracy: "94%" },
                      { rank: 2, user: "OptionsMaster", avatar: "🔥", level: "Légendaire", score: 2755, accuracy: "92%" },
                      { rank: 3, user: "VolTrader", avatar: "⚡", level: "Maître", score: 2690, accuracy: "88%" },
                      { rank: 4, user: "DerivDragon", avatar: "🐉", level: "Maître", score: 2580, accuracy: "90%" },
                      { rank: 5, user: "AlphaHunter", avatar: "🎯", level: "Expert", score: 2420, accuracy: "86%" }
                    ].map((entry) => (
                      <tr key={entry.rank} className="border-b border-finance-steel/10 hover:bg-finance-charcoal/20">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <span className="font-medium text-finance-offwhite">#{entry.rank}</span>
                            {entry.rank <= 3 && (
                              <Trophy className={`ml-2 h-4 w-4 ${
                                entry.rank === 1 ? 'text-yellow-400' :
                                entry.rank === 2 ? 'text-gray-400' :
                                'text-amber-700'
                              }`} />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">{entry.avatar}</span>
                            <span className="font-medium">{entry.user}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">{entry.level}</td>
                        <td className="py-3 px-4">{entry.score}</td>
                        <td className="py-3 px-4">{entry.accuracy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Practice;
