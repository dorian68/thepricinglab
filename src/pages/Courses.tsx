
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Clock, BarChart, Lock } from "lucide-react";

interface CourseModuleProps {
  title: string;
  level: string;
  duration: string;
  description: string;
  topics: string[];
  image: string;
  locked?: boolean;
  path: string;
}

const CourseModule = ({ 
  title, 
  level, 
  duration, 
  description, 
  topics, 
  image, 
  locked = false,
  path 
}: CourseModuleProps) => (
  <div className="finance-card overflow-hidden group">
    <div className="relative aspect-video bg-finance-charcoal">
      <div className={`bg-cover bg-center w-full h-full ${locked ? 'opacity-30' : 'opacity-50'}`} style={{ backgroundImage: `url(${image})` }}></div>
      
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-finance-dark/40">
          <div className="p-3 rounded-full bg-finance-dark/60 border border-finance-steel/30">
            <Lock className="h-6 w-6 text-finance-accent" />
          </div>
        </div>
      )}
      
      <div className="absolute top-4 left-4">
        <span className="terminal-text text-xs px-2 py-1 bg-finance-burgundy/80 rounded text-finance-offwhite">
          {level}
        </span>
      </div>
    </div>
    
    <div className="p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-medium text-finance-offwhite">{title}</h3>
        <div className="flex items-center text-finance-lightgray text-sm">
          <Clock className="h-4 w-4 mr-1" />
          {duration}
        </div>
      </div>
      
      <p className="text-finance-lightgray text-sm mb-4">{description}</p>
      
      <div className="mb-6">
        <h4 className="text-sm font-medium text-finance-offwhite mb-2">Sujets traités:</h4>
        <ul className="grid grid-cols-2 gap-2">
          {topics.map((topic, index) => (
            <li key={index} className="flex items-center text-xs text-finance-lightgray">
              <span className="h-1 w-1 rounded-full bg-finance-accent mr-2"></span>
              {topic}
            </li>
          ))}
        </ul>
      </div>
      
      <Link 
        to={path}
        className={`flex justify-between items-center p-3 rounded ${
          locked 
            ? 'bg-finance-steel/10 text-finance-lightgray cursor-not-allowed' 
            : 'bg-finance-burgundy/10 text-finance-accent hover:bg-finance-burgundy/20 transition-colors duration-300'
        }`}
      >
        <span className="text-sm font-medium">
          {locked ? "Module verrouillé" : "Accéder au module"}
        </span>
        <ArrowRight className={`h-4 w-4 ${!locked && 'group-hover:translate-x-1 transition-transform duration-300'}`} />
      </Link>
    </div>
  </div>
);

const Courses = () => {
  const fundamentalsCourses = [
    {
      title: "Introduction au Pricing et Black-Scholes",
      level: "FONDAMENTAUX",
      duration: "3h 20min",
      description: "Les bases essentielles pour comprendre les mécanismes de pricing d'options.",
      topics: ["Probabilités", "Mouvement Brownien", "Dérivation B-S", "Put-Call Parity"],
      image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f",
      path: "/courses/fundamentals/black-scholes"
    },
    {
      title: "Taux d'intérêt et courbes de rendement",
      level: "FONDAMENTAUX",
      duration: "2h 45min",
      description: "Comprendre et modéliser les courbes de taux pour la valorisation.",
      topics: ["Zéro-coupons", "Interpolation", "Bootstrapping", "Discounting"],
      image: "https://images.unsplash.com/photo-1543286386-713bdd548da4",
      path: "/courses/fundamentals/yield-curves"
    },
    {
      title: "Greeks et sensibilités",
      level: "FONDAMENTAUX",
      duration: "4h 10min",
      description: "Maîtriser les mesures de risque et les techniques de couverture.",
      topics: ["Delta", "Gamma", "Vega", "Theta", "Hedging"],
      image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e",
      path: "/courses/fundamentals/greeks"
    }
  ];
  
  const advancedCourses = [
    {
      title: "Volatilité implicite et structures",
      level: "VANILLES AVANCÉS",
      duration: "5h 30min",
      description: "Analyser et interpréter les surfaces de volatilité du marché.",
      topics: ["Smile", "Skew", "Calibration", "Forward Vol"],
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71",
      path: "/courses/advanced/implied-vol",
      locked: true
    },
    {
      title: "Produits de volatilité",
      level: "VANILLES AVANCÉS",
      duration: "4h 15min",
      description: "Maitriser les indices de volatilité et leurs dérivés.",
      topics: ["VIX", "Variance Swaps", "Vol Swaps", "Vol Targeting"],
      image: "https://images.unsplash.com/photo-1535320903710-d993d3d77d29",
      path: "/courses/advanced/vol-products",
      locked: true
    }
  ];
  
  const complexCourses = [
    {
      title: "Options exotiques et barrières",
      level: "PRODUITS COMPLEXES",
      duration: "6h 40min",
      description: "Pricing des produits dérivés complexes avec discontinuités.",
      topics: ["Knock-in/out", "Touch", "Digitals", "Corridors"],
      image: "https://images.unsplash.com/photo-1605792657660-596af9009e82",
      path: "/courses/complex/exotic-options",
      locked: true
    },
    {
      title: "Monte Carlo pour produits path-dependent",
      level: "PRODUITS COMPLEXES",
      duration: "7h 15min",
      description: "Techniques avancées de simulation pour options dépendantes du chemin.",
      topics: ["Asiatiques", "Lookback", "Simulation", "Réduction variance"],
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
      path: "/courses/complex/monte-carlo",
      locked: true
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-6 border-b border-finance-steel/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-6 terminal-text">
                Modules de formation
              </h1>
              <p className="text-finance-lightgray text-lg mb-8">
                Une progression pédagogique structurée des fondamentaux aux techniques avancées 
                de pricing utilisées en salle des marchés.
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 text-finance-accent mr-2" />
                  <span className="text-finance-lightgray text-sm">12 modules</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-finance-accent mr-2" />
                  <span className="text-finance-lightgray text-sm">48+ heures</span>
                </div>
                <div className="flex items-center">
                  <BarChart className="h-5 w-5 text-finance-accent mr-2" />
                  <span className="text-finance-lightgray text-sm">24 exercices pratiques</span>
                </div>
              </div>
            </div>
            
            <div className="relative aspect-[4/3] bg-finance-charcoal rounded-lg overflow-hidden hidden lg:block">
              <div className="bg-[url('https://images.unsplash.com/photo-1642104704074-907c0698cbd9')] bg-cover bg-center w-full h-full opacity-50 mix-blend-overlay"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="terminal-text text-finance-accent bg-finance-charcoal/80 px-4 py-3 border border-finance-burgundy/30 rounded text-sm tracking-wider">
                  EXPERTISE. PRÉCISION. TRADING.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Course Navigation */}
      <div className="sticky top-16 z-40 border-b border-finance-steel/10 bg-finance-dark/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <nav className="flex overflow-x-auto">
            <a href="#fundamentals" className="flex-shrink-0 px-6 py-4 border-b-2 border-finance-accent text-finance-offwhite font-medium">
              Fondamentaux
            </a>
            <a href="#advanced" className="flex-shrink-0 px-6 py-4 border-b-2 border-transparent hover:border-finance-accent/50 text-finance-lightgray hover:text-finance-offwhite transition-colors duration-300">
              Vanilles avancés
            </a>
            <a href="#complex" className="flex-shrink-0 px-6 py-4 border-b-2 border-transparent hover:border-finance-accent/50 text-finance-lightgray hover:text-finance-offwhite transition-colors duration-300">
              Produits complexes
            </a>
            <a href="#bonus" className="flex-shrink-0 px-6 py-4 border-b-2 border-transparent hover:border-finance-accent/50 text-finance-lightgray hover:text-finance-offwhite transition-colors duration-300">
              Bonus
            </a>
          </nav>
        </div>
      </div>
      
      {/* Fundamentals Section */}
      <section id="fundamentals" className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 terminal-text">Fondamentaux</h2>
            <p className="text-finance-lightgray">
              Les bases essentielles pour comprendre les mécanismes de pricing et construire 
              une expertise solide.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fundamentalsCourses.map((course, index) => (
              <CourseModule key={index} {...course} />
            ))}
          </div>
        </div>
      </section>
      
      {/* Advanced Section */}
      <section id="advanced" className="py-16 px-6 bg-finance-charcoal/20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 terminal-text">Vanilles avancés</h2>
            <p className="text-finance-lightgray">
              Techniques sophistiquées pour valoriser et gérer les produits vanilles dans des environnements complexes.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advancedCourses.map((course, index) => (
              <CourseModule key={index} {...course} />
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <Link to="/signup" className="finance-button inline-flex items-center">
              Débloquer tous les modules <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <p className="mt-3 text-finance-lightgray text-sm">
              Accès complet avec l'abonnement à 19€/mois
            </p>
          </div>
        </div>
      </section>
      
      {/* Complex Products Section */}
      <section id="complex" className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 terminal-text">Produits complexes</h2>
            <p className="text-finance-lightgray">
              Maîtrisez les méthodes de pricing pour les produits structurés et exotiques.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complexCourses.map((course, index) => (
              <CourseModule key={index} {...course} />
            ))}
          </div>
        </div>
      </section>
      
      {/* Subscription CTA */}
      <section className="py-16 px-6 bg-finance-charcoal/50 border-y border-finance-steel/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4 terminal-text">Accédez à tous les modules</h2>
          <p className="text-finance-lightgray mb-8">
            Débloquez l'intégralité du contenu et progressez à votre rythme avec l'abonnement 
            mensuel à The Pricing Lab.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="finance-button text-center">
              S'abonner pour 19€/mois
            </Link>
            <Link to="/" className="finance-button-outline text-center">
              En savoir plus
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Courses;
