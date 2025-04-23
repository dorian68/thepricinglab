
import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { 
  BarChart3, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Award, 
  TrendingUp,
  Trophy,
  BarChart,
  Play, 
  ChevronRight
} from "lucide-react";

// Progress course module component
const CourseProgress = ({ 
  title, 
  progress, 
  lastActivity, 
  level, 
  path 
}: { 
  title: string; 
  progress: number; 
  lastActivity: string;
  level: string;
  path: string;
}) => (
  <Link to={path} className="finance-card p-4 hover:border-finance-accent/50 transition-colors duration-300">
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1">
        <h3 className="text-finance-offwhite font-medium text-sm">{title}</h3>
        <p className="text-finance-lightgray text-xs">{lastActivity}</p>
      </div>
      <span className="terminal-text text-xs px-2 py-0.5 bg-finance-steel/20 rounded text-finance-lightgray">
        {level}
      </span>
    </div>
    
    <div className="mb-2">
      <div className="h-1.5 bg-finance-steel/20 rounded-full overflow-hidden">
        <div 
          className="h-full bg-finance-accent rounded-full" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
    
    <div className="flex justify-between items-center">
      <span className="text-finance-lightgray text-xs">{progress}% complété</span>
      <button className="text-finance-accent flex items-center text-xs font-medium">
        Continuer <ChevronRight className="ml-1 h-3 w-3" />
      </button>
    </div>
  </Link>
);

// Stat card component
const StatCard = ({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string; 
}) => (
  <div className="finance-card p-4">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-md bg-finance-burgundy/10">
        <Icon className="h-5 w-5 text-finance-accent" />
      </div>
      <div>
        <p className="text-finance-lightgray text-xs">{label}</p>
        <p className="text-finance-offwhite font-medium">{value}</p>
      </div>
    </div>
  </div>
);

// Achievement badge component
const AchievementBadge = ({ 
  icon: Icon, 
  name, 
  description, 
  unlocked 
}: { 
  icon: React.ElementType; 
  name: string; 
  description: string; 
  unlocked: boolean;
}) => (
  <div className={`finance-card p-4 ${unlocked ? 'border-finance-accent/30' : 'opacity-50'}`}>
    <div className="flex gap-4">
      <div className={`p-3 rounded-full ${unlocked ? 'bg-finance-burgundy/20' : 'bg-finance-steel/10'}`}>
        <Icon className={`h-6 w-6 ${unlocked ? 'text-finance-accent' : 'text-finance-lightgray'}`} />
      </div>
      <div>
        <h3 className="text-finance-offwhite font-medium text-sm">{name}</h3>
        <p className="text-finance-lightgray text-xs">{description}</p>
      </div>
    </div>
  </div>
);

// Quiz result component
const QuizResult = ({ 
  title, 
  score, 
  date, 
  correct, 
  total 
}: { 
  title: string; 
  score: number; 
  date: string; 
  correct: number; 
  total: number;
}) => (
  <div className="finance-card p-4">
    <div className="flex justify-between items-start mb-2">
      <h3 className="text-finance-offwhite font-medium text-sm">{title}</h3>
      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
        score >= 80 ? 'bg-green-900/20 text-green-400' : 
        score >= 60 ? 'bg-yellow-900/20 text-yellow-400' : 
        'bg-red-900/20 text-red-400'
      }`}>
        {score}%
      </span>
    </div>
    <p className="text-finance-lightgray text-xs mb-3">{date}</p>
    <div className="flex items-center">
      <span className="text-finance-lightgray text-xs">{correct}/{total} questions correctes</span>
    </div>
  </div>
);

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  
  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite">
      <Navbar />
      
      {/* Dashboard Header */}
      <header className="py-8 px-6 border-b border-finance-steel/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
            <div>
              <h1 className="text-2xl font-bold terminal-text">Tableau de bord</h1>
              <p className="text-finance-lightgray">Bonjour, Julien. Continuez votre progression.</p>
            </div>
            
            <div className="flex space-x-4">
              <Link to="/courses" className="finance-button flex items-center">
                <BookOpen className="mr-2 h-4 w-4" />
                Explorer les cours
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Dashboard Tabs */}
      <div className="border-b border-finance-steel/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex overflow-x-auto">
            <button 
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-4 font-medium text-sm ${
                activeTab === "overview" 
                  ? "border-b-2 border-finance-accent text-finance-offwhite" 
                  : "border-b-2 border-transparent text-finance-lightgray hover:text-finance-offwhite"
              }`}
            >
              Vue d'ensemble
            </button>
            <button 
              onClick={() => setActiveTab("progress")}
              className={`px-6 py-4 font-medium text-sm ${
                activeTab === "progress" 
                  ? "border-b-2 border-finance-accent text-finance-offwhite" 
                  : "border-b-2 border-transparent text-finance-lightgray hover:text-finance-offwhite"
              }`}
            >
              Progression
            </button>
            <button 
              onClick={() => setActiveTab("quizzes")}
              className={`px-6 py-4 font-medium text-sm ${
                activeTab === "quizzes" 
                  ? "border-b-2 border-finance-accent text-finance-offwhite" 
                  : "border-b-2 border-transparent text-finance-lightgray hover:text-finance-offwhite"
              }`}
            >
              Résultats Quiz
            </button>
            <button 
              onClick={() => setActiveTab("achievements")}
              className={`px-6 py-4 font-medium text-sm ${
                activeTab === "achievements" 
                  ? "border-b-2 border-finance-accent text-finance-offwhite" 
                  : "border-b-2 border-transparent text-finance-lightgray hover:text-finance-offwhite"
              }`}
            >
              Réalisations
            </button>
          </div>
        </div>
      </div>
      
      {/* Dashboard Content */}
      <main className="flex-1 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Stats Overview */}
              <section>
                <h2 className="text-lg font-medium mb-4">Statistiques</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard 
                    icon={BookOpen} 
                    label="Modules complétés" 
                    value="3/12" 
                  />
                  <StatCard 
                    icon={Clock} 
                    label="Temps de visionnage" 
                    value="14h 22m" 
                  />
                  <StatCard 
                    icon={CheckCircle2} 
                    label="Quiz réussis" 
                    value="7/10" 
                  />
                  <StatCard 
                    icon={Trophy} 
                    label="Badges débloqués" 
                    value="5/15" 
                  />
                </div>
              </section>
              
              {/* Continue Learning */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">Continuer l'apprentissage</h2>
                  <Link to="/courses" className="text-finance-accent text-sm flex items-center">
                    Voir tous les cours <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <CourseProgress 
                    title="Black-Scholes & Modèles fondamentaux" 
                    progress={75} 
                    lastActivity="Dernière activité: aujourd'hui"
                    level="FONDAMENTAUX"
                    path="/courses/fundamentals/black-scholes"
                  />
                  <CourseProgress 
                    title="Taux d'intérêt et courbes de rendement" 
                    progress={40} 
                    lastActivity="Dernière activité: hier"
                    level="FONDAMENTAUX"
                    path="/courses/fundamentals/yield-curves"
                  />
                  <CourseProgress 
                    title="Greeks et sensibilités" 
                    progress={10} 
                    lastActivity="Dernière activité: il y a 3 jours"
                    level="FONDAMENTAUX"
                    path="/courses/fundamentals/greeks"
                  />
                </div>
              </section>
              
              {/* Recent Quizzes */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">Derniers quiz</h2>
                  <button 
                    onClick={() => setActiveTab("quizzes")}
                    className="text-finance-accent text-sm flex items-center"
                  >
                    Tous les résultats <ChevronRight className="ml-1 h-4 w-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <QuizResult 
                    title="Quiz: Valorisation Black-Scholes" 
                    score={85} 
                    date="Complété le 15 avril 2025" 
                    correct={17} 
                    total={20} 
                  />
                  <QuizResult 
                    title="Quiz: Calibration de la volatilité" 
                    score={65} 
                    date="Complété le 12 avril 2025" 
                    correct={13} 
                    total={20} 
                  />
                  <QuizResult 
                    title="Quiz: Structures de taux" 
                    score={90} 
                    date="Complété le 8 avril 2025" 
                    correct={18} 
                    total={20} 
                  />
                </div>
              </section>
              
              {/* Upcoming Challenges */}
              <section>
                <h2 className="text-lg font-medium mb-4">Challenges à venir</h2>
                <div className="finance-card p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-finance-offwhite font-medium mb-1">Challenge mensuel: Option Pricing Competition</h3>
                      <p className="text-finance-lightgray text-sm">
                        Testez vos compétences en pricing d'options contre d'autres membres de la communauté.
                      </p>
                    </div>
                    <span className="terminal-text text-xs px-2 py-1 bg-finance-burgundy/20 rounded text-finance-accent">
                      COMMENCE DANS 5 JOURS
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-finance-accent" />
                      <span className="text-finance-lightgray text-sm">Données de marché fournies</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-finance-accent" />
                      <span className="text-finance-lightgray text-sm">Délai: 48 heures</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-finance-accent" />
                      <span className="text-finance-lightgray text-sm">Prix: 6 mois d'abonnement gratuit</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link to="/projects" className="finance-button text-center">
                      Voir tous les challenges
                    </Link>
                    <button className="finance-button-outline flex items-center justify-center">
                      <Bell className="mr-2 h-4 w-4" />
                      Recevoir un rappel
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}
          
          {activeTab === "achievements" && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium mb-4">Badges & Réalisations</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AchievementBadge 
                  icon={BookOpen} 
                  name="Fondamentaux maîtrisés" 
                  description="Compléter tous les modules fondamentaux avec un score moyen > 80%" 
                  unlocked={true} 
                />
                <AchievementBadge 
                  icon={TrendingUp} 
                  name="Trader en herbe" 
                  description="Compléter votre premier challenge mensuel" 
                  unlocked={true} 
                />
                <AchievementBadge 
                  icon={Award} 
                  name="Expert en volatilité" 
                  description="Obtenir 100% au quiz sur les structures de volatilité" 
                  unlocked={true} 
                />
                <AchievementBadge 
                  icon={BarChart} 
                  name="Maître des Greeks" 
                  description="Réussir le module avancé sur les stratégies de couverture" 
                  unlocked={false} 
                />
                <AchievementBadge 
                  icon={BarChart3} 
                  name="Analyste quantitatif" 
                  description="Implémenter avec succès un pricer Monte Carlo pour options exotiques" 
                  unlocked={false} 
                />
                <AchievementBadge 
                  icon={Trophy} 
                  name="Elite de la finance" 
                  description="Compléter tous les modules avec un score moyen > 90%" 
                  unlocked={false} 
                />
              </div>
            </div>
          )}
          
          {activeTab === "progress" && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium mb-4">Progression des cours</h2>
              
              <div className="finance-card p-6">
                <h3 className="text-lg font-medium mb-4">Progression globale</h3>
                <div className="h-2.5 bg-finance-steel/20 rounded-full overflow-hidden mb-4">
                  <div 
                    className="h-full bg-finance-accent rounded-full" 
                    style={{ width: '27%' }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-finance-lightgray">27% complété</span>
                  <span className="text-finance-lightgray">3/12 modules terminés</span>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-medium mb-3">Fondamentaux</h3>
                  <div className="space-y-4">
                    <CourseProgress 
                      title="Introduction au Pricing et Black-Scholes" 
                      progress={100} 
                      lastActivity="Complété le 5 avril 2025"
                      level="FONDAMENTAUX"
                      path="/courses/fundamentals/black-scholes"
                    />
                    <CourseProgress 
                      title="Taux d'intérêt et courbes de rendement" 
                      progress={100} 
                      lastActivity="Complété le 10 avril 2025"
                      level="FONDAMENTAUX"
                      path="/courses/fundamentals/yield-curves"
                    />
                    <CourseProgress 
                      title="Greeks et sensibilités" 
                      progress={75} 
                      lastActivity="Dernière activité: aujourd'hui"
                      level="FONDAMENTAUX"
                      path="/courses/fundamentals/greeks"
                    />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-md font-medium mb-3">Vanilles avancés</h3>
                  <div className="space-y-4">
                    <CourseProgress 
                      title="Volatilité implicite et structures" 
                      progress={40} 
                      lastActivity="Dernière activité: hier"
                      level="VANILLES AVANCÉS"
                      path="/courses/advanced/implied-vol"
                    />
                    <CourseProgress 
                      title="Produits de volatilité" 
                      progress={0} 
                      lastActivity="Non commencé"
                      level="VANILLES AVANCÉS"
                      path="/courses/advanced/vol-products"
                    />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-md font-medium mb-3">Produits complexes</h3>
                  <div className="space-y-4">
                    <CourseProgress 
                      title="Options exotiques et barrières" 
                      progress={0} 
                      lastActivity="Non commencé"
                      level="PRODUITS COMPLEXES"
                      path="/courses/complex/exotic-options"
                    />
                    <CourseProgress 
                      title="Monte Carlo pour produits path-dependent" 
                      progress={0} 
                      lastActivity="Non commencé"
                      level="PRODUITS COMPLEXES"
                      path="/courses/complex/monte-carlo"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === "quizzes" && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium mb-4">Résultats des quiz</h2>
              
              <div className="finance-card p-6 mb-6">
                <div className="flex items-center mb-4">
                  <div className="w-14 h-14 rounded-full bg-finance-burgundy/20 flex items-center justify-center mr-4">
                    <span className="text-2xl font-bold text-finance-accent">80%</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Score moyen</h3>
                    <p className="text-finance-lightgray text-sm">Basé sur 10 quiz complétés</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center px-3 py-1.5 bg-finance-steel/10 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
                    <span className="text-xs text-finance-lightgray">7 réussis</span>
                  </div>
                  <div className="flex items-center px-3 py-1.5 bg-finance-steel/10 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-yellow-400 mr-2"></div>
                    <span className="text-xs text-finance-lightgray">2 à améliorer</span>
                  </div>
                  <div className="flex items-center px-3 py-1.5 bg-finance-steel/10 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-red-400 mr-2"></div>
                    <span className="text-xs text-finance-lightgray">1 échoué</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <QuizResult 
                  title="Quiz: Valorisation Black-Scholes" 
                  score={85} 
                  date="Complété le 15 avril 2025" 
                  correct={17} 
                  total={20} 
                />
                <QuizResult 
                  title="Quiz: Calibration de la volatilité" 
                  score={65} 
                  date="Complété le 12 avril 2025" 
                  correct={13} 
                  total={20} 
                />
                <QuizResult 
                  title="Quiz: Structures de taux" 
                  score={90} 
                  date="Complété le 8 avril 2025" 
                  correct={18} 
                  total={20} 
                />
                <QuizResult 
                  title="Quiz: Mouvement Brownien" 
                  score={95} 
                  date="Complété le 6 avril 2025" 
                  correct={19} 
                  total={20} 
                />
                <QuizResult 
                  title="Quiz: Put-Call Parity" 
                  score={100} 
                  date="Complété le 3 avril 2025" 
                  correct={20} 
                  total={20} 
                />
                <QuizResult 
                  title="Quiz: Calcul de Delta et Gamma" 
                  score={75} 
                  date="Complété le 1 avril 2025" 
                  correct={15} 
                  total={20} 
                />
                <QuizResult 
                  title="Quiz: Bootstrapping de courbe" 
                  score={80} 
                  date="Complété le 30 mars 2025" 
                  correct={16} 
                  total={20} 
                />
                <QuizResult 
                  title="Quiz: Hedging dynamique" 
                  score={55} 
                  date="Complété le 27 mars 2025" 
                  correct={11} 
                  total={20} 
                />
                <QuizResult 
                  title="Quiz: Interpolation de taux" 
                  score={85} 
                  date="Complété le 25 mars 2025" 
                  correct={17} 
                  total={20} 
                />
                <QuizResult 
                  title="Quiz: Facteurs de volatilité" 
                  score={45} 
                  date="Complété le 22 mars 2025" 
                  correct={9} 
                  total={20} 
                />
              </div>
            </div>
          )}
        </div>
      </main>
      
    </div>
  );
};

export default Dashboard;

const Bell = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);
