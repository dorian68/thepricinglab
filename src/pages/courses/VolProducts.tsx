
import { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  BookOpen, 
  Calculator, 
  Check, 
  ChevronRight, 
  Clock, 
  FileText, 
  GraduationCap, 
  Play,
  Download,
  Code,
  PenLine,
  Lock,
  TrendingUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";

const VolProductsCourse = () => {
  const { t } = useTranslation();
  const [activeLesson, setActiveLesson] = useState(0);

  // Course content
  const lessons = [
    { 
      title: "Introduction to Volatility Products",
      duration: "25 min", 
      type: "lecture"
    },
    { 
      title: "VIX and Volatility Indices",
      duration: "30 min", 
      type: "lecture"
    },
    { 
      title: t('coursesPage.advanced.volProducts.topics.varianceSwaps'),
      duration: "35 min", 
      type: "lecture"
    },
    { 
      title: t('coursesPage.advanced.volProducts.topics.volSwaps'),
      duration: "30 min", 
      type: "lecture"
    },
    { 
      title: "Trading Volatility",
      duration: "40 min", 
      type: "lecture"
    },
    { 
      title: t('coursesPage.advanced.volProducts.topics.volTargeting'),
      duration: "35 min", 
      type: "lecture"
    },
    { 
      title: "Exercise: Pricing a Variance Swap",
      duration: "60 min", 
      type: "exercise"
    },
    { 
      title: "Notebook: Volatility Trading Strategies",
      duration: "70 min", 
      type: "notebook"
    },
    { 
      title: "Quiz: Volatility Products",
      duration: "15 min", 
      type: "quiz"
    }
  ];
  
  // Helper function to get icon for lesson type
  const getLessonIcon = (type: string) => {
    switch (type) {
      case "lecture":
        return <FileText className="h-4 w-4" />;
      case "exercise":
        return <Calculator className="h-4 w-4" />;
      case "notebook":
        return <BookOpen className="h-4 w-4" />;
      case "quiz":
        return <PenLine className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite">
      <Navbar />
      
      <main className="flex-1 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-finance-lightgray mb-8">
            <Link to="/" className="hover:text-finance-accent">
              {t('navbar.courses')}
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <Link to="/courses" className="hover:text-finance-accent">
              {t('courses.advanced')}
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-finance-offwhite">{t('coursesPage.advanced.volProducts.title')}</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="finance-card p-6 mb-6">
                <h2 className="text-xl font-medium mb-4">{t('coursesPage.advanced.volProducts.title')}</h2>
                <p className="text-finance-lightgray text-sm mb-6">
                  {t('coursesPage.advanced.volProducts.description')}
                </p>
                
                <div className="space-y-3">
                  {lessons.map((lesson, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveLesson(index)}
                      className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                        activeLesson === index 
                          ? 'bg-finance-burgundy/20 border border-finance-burgundy/30'
                          : 'hover:bg-finance-steel/10'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className={activeLesson === index ? 'text-finance-accent' : 'text-finance-offwhite'}>
                            {lesson.title}
                          </span>
                        </div>
                        <div className="flex items-center text-xs text-finance-lightgray">
                          <Lock className="h-3 w-3 mr-1" />
                          {lesson.duration}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="mt-8 pt-6 border-t border-finance-steel/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <GraduationCap className="h-5 w-5 text-finance-accent mr-2" />
                      <span className="text-finance-offwhite font-medium">Niveau</span>
                    </div>
                    <Badge variant="achievement">{t('coursesPage.levels.intermediate')}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-finance-accent mr-2" />
                      <span className="text-finance-offwhite font-medium">Durée estimée</span>
                    </div>
                    <span className="text-finance-lightgray">{t('coursesPage.advanced.volProducts.duration')}</span>
                  </div>
                </div>
              </div>
              
              <div className="finance-card p-6">
                <h3 className="text-lg font-medium mb-4">Débloquer ce cours</h3>
                <p className="text-finance-lightgray text-sm mb-6">
                  Les cours avancés sont disponibles exclusivement avec un abonnement premium.
                </p>
                <Link to="/signup" className="finance-button w-full flex items-center justify-center">
                  S'abonner pour accéder <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <p className="mt-4 text-xs text-finance-lightgray text-center">
                  Déjà abonné? <Link to="/login" className="text-finance-accent hover:underline">Connexion</Link>
                </p>
              </div>
            </div>
            
            {/* Main content */}
            <div className="lg:col-span-2">
              <div className="finance-card overflow-hidden">
                <div className="aspect-video bg-finance-charcoal relative">
                  <div className="bg-[url('https://images.unsplash.com/photo-1535320903710-d993d3d77d29')] bg-cover bg-center w-full h-full opacity-30"></div>
                  <div className="absolute inset-0 flex items-center justify-center bg-finance-dark/50">
                    <div className="text-center">
                      <div className="p-3 rounded-full bg-finance-burgundy/20 inline-flex items-center justify-center mb-4">
                        <Lock className="h-8 w-8 text-finance-accent" />
                      </div>
                      <h2 className="terminal-text text-2xl mb-4">{t('coursesPage.advanced.volProducts.title')}</h2>
                      <Link to="/signup" className="finance-button inline-flex items-center">
                        <Play className="mr-2 h-4 w-4" /> Débloquer ce contenu
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <h2 className="text-xl font-medium mb-4">{lessons[activeLesson].title}</h2>
                  <div className="flex items-center mb-6">
                    <Badge variant={
                      lessons[activeLesson].type === 'lecture' ? 'event' :
                      lessons[activeLesson].type === 'exercise' ? 'success' :
                      lessons[activeLesson].type === 'notebook' ? 'premium' :
                      'challenge'
                    }>
                      {lessons[activeLesson].type}
                    </Badge>
                    <div className="flex items-center ml-3 text-xs text-finance-lightgray">
                      <Clock className="h-3 w-3 mr-1" />
                      {lessons[activeLesson].duration}
                    </div>
                    <div className="ml-auto">
                      <Badge variant="challenge" className="bg-finance-burgundy/20 text-finance-accent">
                        {t('coursesPage.locked')}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="bg-finance-charcoal/30 rounded-md p-8 mb-6 text-center">
                    <Lock className="h-10 w-10 text-finance-accent mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Contenu Premium</h3>
                    <p className="text-finance-lightgray mb-6 max-w-md mx-auto">
                      Ce cours avancé sur les produits de volatilité n'est accessible qu'aux membres premium. Améliorez votre abonnement pour accéder à ce contenu.
                    </p>
                    <div className="space-y-3">
                      <Link to="/signup" className="finance-button block w-full sm:w-auto sm:inline-block">
                        Débloquer maintenant
                      </Link>
                      <Link to="/courses" className="block w-full sm:w-auto sm:inline-block text-finance-lightgray hover:text-finance-offwhite mt-3">
                        Découvrir autres cours
                      </Link>
                    </div>
                  </div>
                  
                  <div className="finance-card p-4 mb-6 bg-finance-steel/10">
                    <h4 className="flex items-center text-finance-offwhite font-medium mb-2">
                      <TrendingUp className="h-4 w-4 mr-2 text-finance-accent" />
                      Applications pratiques
                    </h4>
                    <p className="text-sm text-finance-lightgray">
                      Ce cours vous apprend à comprendre, valoriser et trader des produits basés sur la volatilité comme le VIX, les swaps de variance et de volatilité. Vous explorerez comment ces instruments sont utilisés pour la gestion des risques et les stratégies de trading spéculatives.
                    </p>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-finance-steel/10">
                    <h3 className="text-lg font-medium mb-4">Compétences que vous acquerrez</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-start p-3 bg-finance-steel/10 rounded-md">
                        <div className="p-1.5 rounded-full bg-finance-burgundy/20 mr-3">
                          <Check className="h-3.5 w-3.5 text-finance-accent" />
                        </div>
                        <span className="text-sm text-finance-lightgray">Comprendre les indices de volatilité</span>
                      </div>
                      <div className="flex items-start p-3 bg-finance-steel/10 rounded-md">
                        <div className="p-1.5 rounded-full bg-finance-burgundy/20 mr-3">
                          <Check className="h-3.5 w-3.5 text-finance-accent" />
                        </div>
                        <span className="text-sm text-finance-lightgray">Valoriser les swaps de variance</span>
                      </div>
                      <div className="flex items-start p-3 bg-finance-steel/10 rounded-md">
                        <div className="p-1.5 rounded-full bg-finance-burgundy/20 mr-3">
                          <Check className="h-3.5 w-3.5 text-finance-accent" />
                        </div>
                        <span className="text-sm text-finance-lightgray">Concevoir des stratégies de volatilité</span>
                      </div>
                      <div className="flex items-start p-3 bg-finance-steel/10 rounded-md">
                        <div className="p-1.5 rounded-full bg-finance-burgundy/20 mr-3">
                          <Check className="h-3.5 w-3.5 text-finance-accent" />
                        </div>
                        <span className="text-sm text-finance-lightgray">Gérer un portefeuille target-vol</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-finance-steel/10">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="text-finance-offwhite font-medium">Prérequis</h4>
                        <p className="text-sm text-finance-lightgray">Black-Scholes, Greeks, Volatilité implicite</p>
                      </div>
                      <Link to="/courses/advanced/implied-vol" className="text-finance-accent hover:underline text-sm flex items-center">
                        Voir le cours prérequis <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
    </div>
  );
};

export default VolProductsCourse;
