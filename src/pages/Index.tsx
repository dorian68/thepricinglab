
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MarketVisuals from "../components/MarketVisuals";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Code, Trophy, Users, BarChart3, Zap, ArrowRight, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col min-h-screen bg-[#1A1F2C] text-white">
      <Navbar />
      
      {/* Animated background canvas */}
      <MarketVisuals />
      
      {/* Hero Section */}
      <section className="relative py-20 md:py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Prépare-toi <span className="text-[#ea384c]">à entrer</span><br />
                dans la <span className="text-[#ea384c]">salle des marchés.</span>
              </h1>
              
              <p className="text-[#8E9196] text-lg mt-6 mb-8">
                Formation d'élite destinée aux étudiants en finance qui souhaitent maîtriser les méthodes de pricing utilisées quotidiennement par les professionnels.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="finance" asChild>
                  <Link to="/courses">
                    Commencer le parcours
                  </Link>
                </Button>
                <Button variant="financeOutline" asChild>
                  <Link to="/signup">
                    S'inscrire maintenant
                  </Link>
                </Button>
              </div>
              
              <div className="mt-8">
                <span className="font-mono text-[#ea384c] tracking-wider text-sm font-medium">MAÎTRISE. TECHNIQUE. MARCHÉS.</span>
              </div>
            </div>
            
            <div className="relative aspect-[4/3] bg-black/60 rounded-lg overflow-hidden">
              <div className="bg-[url('/lovable-uploads/bf767635-7fdf-4661-88ea-ecfb8f95eb5d.png')] bg-cover bg-center w-full h-full"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="font-mono text-[#ea384c] bg-black/80 px-4 py-3 border border-red-900/30 rounded text-sm tracking-wider">
                  TRADING TERMINAL ACTIVATED
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cours d'actif Section */}
      <section className="py-16 px-6 bg-[#141821]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Cours d'un <span className="text-[#ea384c]">Actif</span></h2>
            <p className="text-[#8E9196] max-w-2xl mx-auto">
              Analysez l'évolution des cours et apprenez à interpréter les graphiques pour prendre des décisions éclairées.
            </p>
          </div>
          
          <div className="relative rounded-lg overflow-hidden shadow-2xl">
            <img 
              src="/lovable-uploads/3dce3f83-e875-47e1-8a3d-1c81196b0ed4.png" 
              alt="Cours d'un actif" 
              className="w-full h-auto object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#141821]/80 via-transparent to-transparent flex items-center">
              <div className="p-8">
                <div className="inline-flex items-center bg-[#ea384c]/10 px-3 py-1 rounded-full text-xs font-medium text-[#ea384c] mb-4">
                  <TrendingUp size={14} className="mr-1" />
                  Analyse technique
                </div>
                <h3 className="text-3xl font-bold mb-4">Maîtrisez l'analyse des <span className="text-[#ea384c]">tendances</span></h3>
                <p className="text-[#8E9196] mb-6 max-w-md">
                  Apprenez à identifier les supports, les résistances et les figures chartistes pour prévoir l'évolution des marchés.
                </p>
                <Button variant="finance" asChild>
                  <Link to="/courses/technical-analysis">
                    Découvrir le cours
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notre Mission */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Notre <span className="text-[#ea384c]">Mission</span></h2>
            <p className="text-[#8E9196] max-w-2xl mx-auto">
              Former la prochaine génération de financiers aux techniques quantitatives modernes pour les rendre plus compétitifs sur le marché du travail.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#1A1F2C] p-6 rounded-lg border border-[#2A2F3C] hover:border-[#ea384c] transition-colors">
              <div className="mb-4 text-[#ea384c]">
                <BookOpen size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Contenu académique</h3>
              <p className="text-[#8E9196]">
                Formations créées par des professionnels et professeurs spécialisés dans les marchés financiers.
              </p>
            </div>
            
            <div className="bg-[#1A1F2C] p-6 rounded-lg border border-[#2A2F3C] hover:border-[#ea384c] transition-colors">
              <div className="mb-4 text-[#ea384c]">
                <Code size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Application pratique</h3>
              <p className="text-[#8E9196]">
                Codage d'algorithmes et implémentation de modèles financiers dans des environnements réels.
              </p>
            </div>
            
            <div className="bg-[#1A1F2C] p-6 rounded-lg border border-[#2A2F3C] hover:border-[#ea384c] transition-colors">
              <div className="mb-4 text-[#ea384c]">
                <Trophy size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Compétition</h3>
              <p className="text-[#8E9196]">
                Challenges pour tester vos compétences contre d'autres étudiants et recevoir des feedbacks constructifs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="py-16 px-6 bg-[#141821]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Nos <span className="text-[#ea384c]">Modules</span></h2>
            <p className="text-[#8E9196] max-w-2xl mx-auto">
              Découvrez nos différents modules d'apprentissage conçus pour vous faire progresser pas à pas.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-[#1A1F2C] border-[#2A2F3C] hover:border-[#ea384c] transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="mr-2 text-[#ea384c]" /> Cours
                </CardTitle>
                <CardDescription className="text-[#8E9196]">
                  Formation complète sur les modèles financiers
                </CardDescription>
              </CardHeader>
              <CardContent className="text-[#8E9196]">
                Des cours fondamentaux aux techniques avancées, apprenez à valoriser tous types d'instruments financiers.
              </CardContent>
              <CardFooter>
                <Link to="/courses" className="text-[#ea384c] hover:text-red-400 flex items-center">
                  Découvrir les cours <ArrowRight size={16} className="ml-2" />
                </Link>
              </CardFooter>
            </Card>
            
            <Card className="bg-[#1A1F2C] border-[#2A2F3C] hover:border-[#ea384c] transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="mr-2 text-[#ea384c]" /> Mode Survie
                </CardTitle>
                <CardDescription className="text-[#8E9196]">
                  Testez vos compétences sous pression
                </CardDescription>
              </CardHeader>
              <CardContent className="text-[#8E9196]">
                Affrontez une série de défis chronométrés qui simulent les conditions de stress d'une salle de marché.
              </CardContent>
              <CardFooter>
                <Link to="/survival-mode" className="text-[#ea384c] hover:text-red-400 flex items-center">
                  Commencer un challenge <ArrowRight size={16} className="ml-2" />
                </Link>
              </CardFooter>
            </Card>
            
            <Card className="bg-[#1A1F2C] border-[#2A2F3C] hover:border-[#ea384c] transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 text-[#ea384c]" /> Exercices
                </CardTitle>
                <CardDescription className="text-[#8E9196]">
                  Pratique guidée et auto-évaluation
                </CardDescription>
              </CardHeader>
              <CardContent className="text-[#8E9196]">
                Des exercices adaptés à chaque niveau pour consolider vos connaissances et perfectionner votre maîtrise.
              </CardContent>
              <CardFooter>
                <Link to="/exercises" className="text-[#ea384c] hover:text-red-400 flex items-center">
                  Explorer les exercices <ArrowRight size={16} className="ml-2" />
                </Link>
              </CardFooter>
            </Card>

            <Card className="bg-[#1A1F2C] border-[#2A2F3C] hover:border-[#ea384c] transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 text-[#ea384c]" /> Communauté
                </CardTitle>
                <CardDescription className="text-[#8E9196]">
                  Échangez avec d'autres apprenants
                </CardDescription>
              </CardHeader>
              <CardContent className="text-[#8E9196]">
                Rejoignez une communauté active de passionnés de finance quantitative et partagez vos connaissances.
              </CardContent>
              <CardFooter>
                <Link to="/community" className="text-[#ea384c] hover:text-red-400 flex items-center">
                  Rejoindre la communauté <ArrowRight size={16} className="ml-2" />
                </Link>
              </CardFooter>
            </Card>

            <Card className="bg-[#1A1F2C] border-[#2A2F3C] hover:border-[#ea384c] transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Code className="mr-2 text-[#ea384c]" /> Outils
                </CardTitle>
                <CardDescription className="text-[#8E9196]">
                  Calculateurs et simulateurs
                </CardDescription>
              </CardHeader>
              <CardContent className="text-[#8E9196]">
                Accédez à des outils professionnels pour tester différents scénarios et valider vos modèles.
              </CardContent>
              <CardFooter>
                <Link to="/tools" className="text-[#ea384c] hover:text-red-400 flex items-center">
                  Utiliser les outils <ArrowRight size={16} className="ml-2" />
                </Link>
              </CardFooter>
            </Card>

            <Card className="bg-[#1A1F2C] border-[#2A2F3C] hover:border-[#ea384c] transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 text-[#ea384c]" /> Classement
                </CardTitle>
                <CardDescription className="text-[#8E9196]">
                  Comparez vos performances
                </CardDescription>
              </CardHeader>
              <CardContent className="text-[#8E9196]">
                Suivez votre progression et mesurez-vous aux meilleurs étudiants de la plateforme.
              </CardContent>
              <CardFooter>
                <Link to="/leaderboard" className="text-[#ea384c] hover:text-red-400 flex items-center">
                  Voir le classement <ArrowRight size={16} className="ml-2" />
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Prêt à <span className="text-[#ea384c]">développer</span> vos compétences financières?</h2>
          <p className="text-[#8E9196] mb-8">
            Rejoignez dès maintenant notre communauté et accédez à l'ensemble de nos ressources pédagogiques.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="finance">
                  Voir nos tarifs
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1A1F2C] text-white border-[#2A2F3C]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Nos formules d'abonnement</DialogTitle>
                  <DialogDescription className="text-[#8E9196]">
                    Choisissez l'offre qui correspond à vos besoins
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="bg-[#141821] p-6 rounded-lg border border-[#2A2F3C]">
                    <h3 className="text-xl font-bold mb-2">Débutant</h3>
                    <div className="text-2xl font-bold text-[#ea384c] mb-4">29€ <span className="text-sm text-[#8E9196] font-normal">/mois</span></div>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center">
                        <span className="mr-2 text-green-500">✓</span>
                        <span>Accès aux cours fondamentaux</span>
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2 text-green-500">✓</span>
                        <span>Exercices de base</span>
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2 text-green-500">✓</span>
                        <span>Mode survie limité</span>
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2 text-green-500">✓</span>
                        <span>Accès au forum communautaire</span>
                      </li>
                    </ul>
                    <Button variant="finance" className="w-full" asChild>
                      <Link to="/signup?plan=debutant">
                        Choisir cette offre
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="bg-[#141821] p-6 rounded-lg border border-[#ea384c]">
                    <div className="bg-[#ea384c] text-white text-xs font-bold uppercase py-1 px-2 rounded absolute -mt-9 ml-4">Recommandé</div>
                    <h3 className="text-xl font-bold mb-2">Pro</h3>
                    <div className="text-2xl font-bold text-[#ea384c] mb-4">49€ <span className="text-sm text-[#8E9196] font-normal">/mois</span></div>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center">
                        <span className="mr-2 text-green-500">✓</span>
                        <span>Accès à tous les cours</span>
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2 text-green-500">✓</span>
                        <span>Tous les exercices et projets</span>
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2 text-green-500">✓</span>
                        <span>Mode survie illimité</span>
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2 text-green-500">✓</span>
                        <span>Session de mentorat mensuelle</span>
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2 text-green-500">✓</span>
                        <span>Certificat de compétence</span>
                      </li>
                    </ul>
                    <Button variant="finance" className="w-full" asChild>
                      <Link to="/signup?plan=pro">
                        Choisir cette offre
                      </Link>
                    </Button>
                  </div>
                </div>
                <div className="mt-6 text-center text-[#8E9196] text-sm">
                  Satisfait ou remboursé pendant 30 jours. Sans engagement.
                </div>
              </DialogContent>
            </Dialog>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="financeOutline" asChild>
                  <Link to="/courses/fundamentals">
                    Cours gratuit d'introduction
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-[#1A1F2C] border-[#2A2F3C] text-white">
                <p>Commencez gratuitement avec notre cours d'introduction</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
