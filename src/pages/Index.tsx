
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MarketVisuals from "../components/MarketVisuals";
import { ArrowRight, BarChart, BookOpen, Users, Award, Code, Zap, Brain, Cpu, Trophy, Target } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description,
  path,
  badges = [] 
}: { 
  icon: React.ComponentType<any>, 
  title: string, 
  description: string,
  path: string,
  badges?: string[]
}) => (
  <div className="finance-card p-6 hover:border-finance-accent transition-colors duration-300 group">
    <div className="bg-finance-burgundy/20 rounded-full p-3 mb-4 inline-block">
      <Icon className="h-6 w-6 text-finance-accent" />
    </div>
    <h3 className="text-lg font-medium text-finance-offwhite mb-2">{title}</h3>
    <p className="text-finance-lightgray text-sm mb-4">{description}</p>
    
    {badges.length > 0 && (
      <div className="flex flex-wrap gap-2 mb-4">
        {badges.map((badge, index) => (
          <Badge key={index} variant="level">{badge}</Badge>
        ))}
      </div>
    )}
    
    <Link to={path} className="flex items-center justify-between p-3 mt-2 rounded bg-finance-burgundy/10 text-finance-accent text-sm font-medium hover:bg-finance-burgundy/20 transition-colors duration-300">
      <span>Découvrir</span>
      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
    </Link>
  </div>
);

const StatCard = ({ icon: Icon, value, label }: { icon: React.ComponentType<any>, value: string, label: string }) => (
  <div className="finance-card p-6 flex items-center space-x-4">
    <div className="bg-finance-burgundy/20 rounded-full p-3">
      <Icon className="h-6 w-6 text-finance-accent" />
    </div>
    <div>
      <p className="text-2xl font-bold text-finance-offwhite">{value}</p>
      <p className="text-finance-lightgray text-sm">{label}</p>
    </div>
  </div>
);

// Freemium plan component
const PricingPlan = ({ 
  title, 
  price, 
  features, 
  cta, 
  ctaLink, 
  isHighlighted = false,
  isFree = false
}: { 
  title: string, 
  price: string, 
  features: string[], 
  cta: string, 
  ctaLink: string, 
  isHighlighted?: boolean,
  isFree?: boolean
}) => (
  <div className={`finance-card p-6 relative ${isHighlighted ? 'border-finance-accent' : ''}`}>
    {isHighlighted && (
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-finance-accent text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full text-white">
        Recommandé
      </div>
    )}
    <h3 className="text-xl font-bold text-finance-offwhite mb-2">{title}</h3>
    <div className="mb-4">
      <span className="text-2xl font-bold text-finance-offwhite">{price}</span>
      {!isFree && <span className="text-finance-lightgray">/mois</span>}
    </div>
    <ul className="space-y-3 mb-6">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start">
          <div className="mt-1 mr-2 text-finance-accent">✓</div>
          <span className="text-finance-lightgray text-sm">{feature}</span>
        </li>
      ))}
    </ul>
    <Link 
      to={ctaLink} 
      className={`block text-center py-2 px-4 rounded transition-colors ${
        isHighlighted 
          ? 'bg-finance-accent hover:bg-finance-accent/90 text-white' 
          : 'bg-finance-burgundy/10 text-finance-accent hover:bg-finance-burgundy/20'
      }`}
    >
      {cta}
    </Link>
  </div>
);

const Index = () => {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite">
      <Navbar />
      
      {/* Animated background canvas */}
      <MarketVisuals />
      
      {/* Hero Section */}
      <section className="relative py-20 md:py-24 px-6 border-b border-finance-steel/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight text-finance-offwhite">
                Prépare-toi <span className="text-finance-accent">à entrer</span><br />
                dans la <span className="text-finance-accent">salle des marchés.</span>
              </h1>
              
              <p className="text-finance-lightgray text-lg mt-6 mb-8">
                Formation d'élite destinée aux étudiants en finance qui souhaitent maîtriser les méthodes de pricing utilisées quotidiennement par les professionnels.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/courses" className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded transition-colors duration-200 text-center">
                  Commencer le parcours
                </Link>
                <Link to="/signup" className="border border-red-600 text-red-600 hover:bg-red-600/10 font-medium py-3 px-6 rounded transition-colors duration-200 text-center">
                  S'inscrire maintenant
                </Link>
              </div>
              
              <div className="mt-8">
                <span className="font-mono text-red-600 tracking-wider text-sm font-medium">MAÎTRISE. TECHNIQUE. MARCHÉS.</span>
              </div>
            </div>
            
            <div className="relative aspect-[4/3] bg-finance-charcoal rounded-lg overflow-hidden">
              <div className="bg-[url('/lovable-uploads/bf767635-7fdf-4661-88ea-ecfb8f95eb5d.png')] bg-cover bg-center w-full h-full"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="font-mono text-red-600 bg-finance-charcoal/80 px-4 py-3 border border-finance-burgundy/30 rounded text-sm tracking-wider">
                  TRADING TERMINAL ACTIVATED
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Main Features Section */}
      <section className="py-16 md:py-24 px-6 border-b border-finance-steel/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 terminal-text">Notre approche pédagogique</h2>
            <p className="text-finance-lightgray max-w-2xl mx-auto">
              Combinant théorie et pratique, notre plateforme vous plonge dans l'univers du pricing à travers une expérience interactive et ludique.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard 
              icon={BookOpen} 
              title="Cours progressifs" 
              description="Modules théoriques et notebooks interactifs couvrant les fondamentaux jusqu'aux modèles avancés."
              path="/courses"
              badges={["BSM", "Monte Carlo", "Volatilité"]}
            />
            <FeatureCard 
              icon={Code} 
              title="Exercices pratiques" 
              description="Mettez en application vos connaissances avec des exercices de pricing auto-évalués."
              path="/exercises"
              badges={["Coding", "Analyse", "Backtesting"]}
            />
            <FeatureCard 
              icon={Zap} 
              title="Mode Survie" 
              description="Affrontez des vagues d'exercices de difficulté croissante et testez vos limites."
              path="/survival-mode"
              badges={["Temps limité", "Scoring", "Compétition"]}
            />
            <FeatureCard 
              icon={Users} 
              title="Communauté" 
              description="Échangez avec d'autres passionnés, participez à des hackathons et résolvez des défis en équipe."
              path="/community"
              badges={["Forum", "Entraide", "Networking"]}
            />
            <FeatureCard 
              icon={BarChart} 
              title="Outils quantitatifs" 
              description="Accédez à des simulateurs et outils de calcul pour explorer les modèles financiers."
              path="/tools"
              badges={["Simulateurs", "Visualisations", "Analytics"]}
            />
            <FeatureCard 
              icon={Brain} 
              title="IA pédagogique" 
              description="Un assistant IA pour vous guider dans votre apprentissage et générer des exercices personnalisés."
              path="/tools"
              badges={["Assistant", "Personnalisation", "Feedback"]}
            />
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="py-16 px-6 bg-finance-charcoal/20 border-b border-finance-steel/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 terminal-text">Une plateforme complète</h2>
            <p className="text-finance-lightgray max-w-2xl mx-auto">
              The Pricing Lab offre un écosystème complet pour maîtriser le pricing et la gestion des risques.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={BookOpen} value="12" label={t('stats.modules')} />
            <StatCard icon={Code} value="500+" label={t('stats.exercises')} />
            <StatCard icon={Award} value="30+" label={t('stats.badges')} />
            <StatCard icon={Cpu} value="4" label={t('stats.simulators')} />
          </div>
        </div>
      </section>
      
      {/* Pricing Plans Section */}
      <section className="py-16 md:py-24 px-6 border-b border-finance-steel/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 terminal-text">{t('pricing.title')}</h2>
            <p className="text-finance-lightgray max-w-2xl mx-auto">
              {t('pricing.description')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PricingPlan 
              title={t('pricing.free.title')}
              price={t('pricing.free.price')}
              features={[
                t('pricing.free.feature1'),
                t('pricing.free.feature2'),
                t('pricing.free.feature3'),
                t('pricing.free.feature4')
              ]}
              cta={t('pricing.free.cta')}
              ctaLink="/signup"
              isFree={true}
            />
            
            <PricingPlan 
              title={t('pricing.pro.title')}
              price="19€"
              features={[
                t('pricing.pro.feature1'),
                t('pricing.pro.feature2'),
                t('pricing.pro.feature3'),
                t('pricing.pro.feature4'),
                t('pricing.pro.feature5')
              ]}
              cta={t('pricing.pro.cta')}
              ctaLink="/signup?plan=pro"
              isHighlighted={true}
            />
            
            <PricingPlan 
              title={t('pricing.mentor.title')}
              price="49€"
              features={[
                t('pricing.mentor.feature1'),
                t('pricing.mentor.feature2'),
                t('pricing.mentor.feature3'),
                t('pricing.mentor.feature4'),
                t('pricing.mentor.feature5')
              ]}
              cta={t('pricing.mentor.cta')}
              ctaLink="/signup?plan=mentor"
            />
          </div>
          
          <div className="mt-12 p-6 bg-finance-charcoal/50 rounded-lg border border-finance-steel/20 text-center">
            <p className="text-finance-accent font-medium mb-2">{t('pricing.discount.title')}</p>
            <p className="text-finance-lightgray mb-4">{t('pricing.discount.description')}</p>
            <Link to="/signup?discount=early" className="inline-flex items-center bg-finance-accent hover:bg-finance-accent/90 text-white px-6 py-3 rounded-lg transition-colors duration-200">
              {t('pricing.discount.cta')} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* Gamification Section */}
      <section className="py-16 md:py-24 px-6 border-b border-finance-steel/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 terminal-text">Progressez et suivez votre évolution</h2>
              <p className="text-finance-lightgray mb-6">
                Notre système de gamification vous permet de visualiser votre progression, débloquer des badges et vous mesurer à la communauté.
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="bg-finance-burgundy/20 rounded-full p-2 mr-4 mt-1">
                    <Award className="h-4 w-4 text-finance-accent" />
                  </div>
                  <div>
                    <h3 className="text-finance-offwhite font-medium">{t('gamification.badges.title')}</h3>
                    <p className="text-finance-lightgray text-sm">{t('gamification.badges.description')}</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-finance-burgundy/20 rounded-full p-2 mr-4 mt-1">
                    <Trophy className="h-4 w-4 text-finance-accent" />
                  </div>
                  <div>
                    <h3 className="text-finance-offwhite font-medium">{t('gamification.leaderboard.title')}</h3>
                    <p className="text-finance-lightgray text-sm">{t('gamification.leaderboard.description')}</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-finance-burgundy/20 rounded-full p-2 mr-4 mt-1">
                    <Target className="h-4 w-4 text-finance-accent" />
                  </div>
                  <div>
                    <h3 className="text-finance-offwhite font-medium">{t('gamification.challenges.title')}</h3>
                    <p className="text-finance-lightgray text-sm">{t('gamification.challenges.description')}</p>
                  </div>
                </li>
              </ul>
              
              <div className="mt-8">
                <Link to="/dashboard" className="finance-button inline-flex items-center">
                  {t('gamification.dashboard')} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="finance-card p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-finance-offwhite font-medium">{t('gamification.progress.level')}</h3>
                  <Badge variant="achievement">{t('gamification.progress.status')}</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-finance-lightgray">{t('gamification.progress.progression')}</span>
                    <span className="text-finance-accent">65%</span>
                  </div>
                  <div className="h-2 bg-finance-steel/20 rounded-full overflow-hidden">
                    <div className="h-full bg-finance-accent rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
                <div className="pt-3 border-t border-finance-steel/10">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-finance-lightgray">XP</span>
                    <span className="text-sm font-medium text-finance-offwhite">2,450 / 3,000</span>
                  </div>
                </div>
              </div>
              
              <div className="finance-card p-4">
                <h3 className="text-finance-offwhite font-medium mb-3">{t('gamification.badges.recent')}</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center">
                    <div className="p-2 rounded-full bg-green-900/20 mb-2">
                      <Award className="h-5 w-5 text-green-400" />
                    </div>
                    <span className="text-xs text-finance-lightgray text-center">BSM Expert</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="p-2 rounded-full bg-blue-900/20 mb-2">
                      <Award className="h-5 w-5 text-blue-400" />
                    </div>
                    <span className="text-xs text-finance-lightgray text-center">Delta Ninja</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="p-2 rounded-full bg-purple-900/20 mb-2">
                      <Award className="h-5 w-5 text-purple-400" />
                    </div>
                    <span className="text-xs text-finance-lightgray text-center">Vol Master</span>
                  </div>
                </div>
              </div>
              
              <div className="finance-card p-4 col-span-2">
                <h3 className="text-finance-offwhite font-medium mb-3">{t('gamification.performance.title')}</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 rounded bg-finance-steel/10 text-center">
                    <p className="text-xl font-bold text-finance-offwhite">85%</p>
                    <p className="text-xs text-finance-lightgray">{t('gamification.performance.accuracy')}</p>
                  </div>
                  <div className="p-3 rounded bg-finance-steel/10 text-center">
                    <p className="text-xl font-bold text-finance-offwhite">42</p>
                    <p className="text-xs text-finance-lightgray">{t('gamification.performance.exercises')}</p>
                  </div>
                  <div className="p-3 rounded bg-finance-steel/10 text-center">
                    <p className="text-xl font-bold text-finance-offwhite">8</p>
                    <p className="text-xs text-finance-lightgray">{t('gamification.performance.challenges')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 px-6 bg-finance-charcoal/50 border-t border-finance-steel/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4 terminal-text">{t('cta.title')}</h2>
          <p className="text-finance-lightgray mb-8">
            {t('cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded transition-colors duration-200 text-center">
              {t('cta.signup')}
            </Link>
            <Link to="/courses" className="border border-red-600 text-red-600 hover:bg-red-600/10 font-medium py-3 px-6 rounded transition-colors duration-200 text-center">
              {t('cta.explore')}
            </Link>
          </div>
        </div>
      </section>
      
      {/* Freemium Upgrade Banner */}
      <div className="fixed bottom-4 left-0 right-0 z-50 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-finance-charcoal p-4 md:p-6 rounded-lg shadow-lg border border-finance-accent/30 flex flex-col md:flex-row items-center justify-between">
            <div className="flex-1 mb-4 md:mb-0 md:mr-6">
              <h4 className="text-finance-offwhite font-bold mb-1">{t('freemium.banner.title')}</h4>
              <p className="text-finance-lightgray text-sm">{t('freemium.banner.description')}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/pricing" className="text-finance-lightgray hover:text-finance-offwhite text-sm">
                {t('freemium.banner.details')}
              </Link>
              <Link to="/signup?plan=pro" className="bg-finance-accent hover:bg-finance-accent/90 text-white px-4 py-2 rounded text-sm font-medium whitespace-nowrap">
                {t('freemium.banner.upgrade')} →
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Index;
