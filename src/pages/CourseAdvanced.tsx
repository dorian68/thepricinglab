
import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  BookOpen, 
  Calculator, 
  Check, 
  ChevronRight, 
  Clock, 
  ExternalLink, 
  FileText, 
  GraduationCap, 
  Lock, 
  Play, 
  Star 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { safeTranslate } from "../utils/translationUtils";

const CourseAdvanced = () => {
  const { t } = useTranslation();
  const [activeModule, setActiveModule] = useState(0);
  
  // Helper function for safe translations
  const st = (key: string, defaultValue: string) => safeTranslate(t, key, defaultValue);
  
  // Module content
  const modules = [
    {
      id: 1,
      title: st('coursesPage.advanced.impliedVol.title', "Implied Volatility Analysis"),
      description: st('coursesPage.advanced.impliedVol.description', "Understanding and analyzing implied volatility across strike prices and maturities"),
      lessons: [
        { 
          title: st('coursesPage.advanced.impliedVol.lesson1', "Introduction to Implied Volatility"), 
          duration: "15 min", 
          type: "lecture" 
        },
        { 
          title: st('coursesPage.advanced.impliedVol.lesson2', "Historical vs Implied Volatility"), 
          duration: "20 min", 
          type: "lecture" 
        },
        { 
          title: st('coursesPage.advanced.impliedVol.lesson3', "Volatility Surface"), 
          duration: "30 min", 
          type: "lecture" 
        },
        { 
          title: st('coursesPage.advanced.impliedVol.lesson4', "Exercise: Calculate Implied Volatility"), 
          duration: "45 min", 
          type: "exercise" 
        },
        { 
          title: st('coursesPage.advanced.impliedVol.lesson5', "Notebook: Volatility Smile"), 
          duration: "60 min", 
          type: "notebook" 
        },
        { 
          title: st('coursesPage.advanced.impliedVol.lesson6', "Module Quiz"), 
          duration: "15 min", 
          type: "quiz" 
        }
      ]
    },
    {
      id: 2,
      title: st('coursesPage.advanced.volProducts.title', "Volatility Products"),
      description: st('coursesPage.advanced.volProducts.description', "Trade and invest in volatility through specialized financial products"),
      lessons: [
        { 
          title: st('coursesPage.advanced.volProducts.lesson1', "Introduction to Volatility Products"), 
          duration: "20 min", 
          type: "lecture" 
        },
        { 
          title: st('coursesPage.advanced.volProducts.lesson2', "VIX and Other Volatility Indices"), 
          duration: "25 min", 
          type: "lecture" 
        },
        { 
          title: st('coursesPage.advanced.volProducts.lesson3', "Variance and Volatility Swaps"), 
          duration: "35 min", 
          type: "lecture" 
        },
        { 
          title: st('coursesPage.advanced.volProducts.lesson4', "Exercise: Pricing a Variance Swap"), 
          duration: "50 min", 
          type: "exercise" 
        },
        { 
          title: st('coursesPage.advanced.volProducts.lesson5', "Notebook: Volatility Trading Strategies"), 
          duration: "60 min", 
          type: "notebook" 
        },
        { 
          title: st('coursesPage.advanced.volProducts.lesson6', "Module Quiz"), 
          duration: "15 min", 
          type: "quiz" 
        }
      ]
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
        return <Star className="h-4 w-4" />;
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
              {st('navigation.home', "Home")}
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <Link to="/courses" className="hover:text-finance-accent">
              {st('navigation.courses', "Courses")}
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-finance-offwhite">{st('courses.advanced', "Advanced Courses")}</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="finance-card p-6 mb-6">
                <h2 className="text-xl font-medium mb-4">{st('courses.advanced', "Advanced Courses")}</h2>
                <p className="text-finance-lightgray text-sm mb-6">
                  {st('coursesPage.advanced.description', "Go beyond the basics with our advanced courses on volatility, hedging, and complex derivatives.")}
                </p>
                
                <div className="space-y-3">
                  {modules.map((module, index) => (
                    <button
                      key={module.id}
                      onClick={() => setActiveModule(index)}
                      className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                        activeModule === index 
                          ? 'bg-finance-burgundy/20 border border-finance-burgundy/30'
                          : 'hover:bg-finance-steel/10'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={activeModule === index ? 'text-finance-accent' : 'text-finance-offwhite'}>
                          {module.title}
                        </span>
                        <Lock className="h-4 w-4 text-finance-lightgray" />
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="mt-8 pt-6 border-t border-finance-steel/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <GraduationCap className="h-5 w-5 text-finance-accent mr-2" />
                      <span className="text-finance-offwhite font-medium">{st('coursesPage.difficulty', "Difficulty")}</span>
                    </div>
                    <Badge variant="achievement">{st('coursesPage.intermediate', "Intermediate")}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-finance-accent mr-2" />
                      <span className="text-finance-offwhite font-medium">{st('exercisesPage.duration', "Duration")}</span>
                    </div>
                    <span className="text-finance-lightgray">8-10 {st('exercisesPage.hours', "hours")}</span>
                  </div>
                </div>
              </div>
              
              <div className="finance-card p-6">
                <h3 className="text-lg font-medium mb-4">{st('coursesPage.unlockCourse', "Unlock This Course")}</h3>
                <p className="text-finance-lightgray text-sm mb-6">
                  {st('coursesPage.advancedCoursesInfo', "Advanced courses are available with our Student and Pro plans. Subscribe to gain access.")}
                </p>
                <Link to="/signup" className="finance-button w-full flex items-center justify-center">
                  {st('coursesPage.subscribeToAccess', "Subscribe to Access")} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <p className="mt-4 text-xs text-finance-lightgray text-center">
                  {st('coursesPage.alreadySubscribed', "Already subscribed?")} <Link to="/login" className="text-finance-accent hover:underline">{st('navigation.login', "Login")}</Link>
                </p>
              </div>
            </div>
            
            {/* Main content */}
            <div className="lg:col-span-2">
              <div className="finance-card p-0 overflow-hidden">
                <div className="aspect-video bg-finance-charcoal relative">
                  <div className="bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71')] bg-cover bg-center w-full h-full opacity-30"></div>
                  <div className="absolute inset-0 flex items-center justify-center bg-finance-dark/50">
                    <div className="text-center">
                      <div className="p-3 rounded-full bg-finance-burgundy/20 inline-flex items-center justify-center mb-4">
                        <Lock className="h-8 w-8 text-finance-accent" />
                      </div>
                      <h2 className="terminal-text text-2xl mb-4">{modules[activeModule].title}</h2>
                      <Link to="/signup" className="finance-button inline-flex items-center">
                        <Play className="mr-2 h-4 w-4" /> {st('coursesPage.unlockContent', "Unlock Content")}
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <h2 className="text-xl font-medium mb-4">{modules[activeModule].title}</h2>
                  <p className="text-finance-lightgray mb-6">
                    {modules[activeModule].description}
                  </p>
                  
                  <div className="space-y-3 mb-8">
                    {modules[activeModule].lessons.map((lesson, index) => (
                      <div key={index} className="flex items-center p-4 border border-finance-steel/10 rounded-md">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                          lesson.type === 'lecture' ? 'bg-blue-900/20 text-blue-400' :
                          lesson.type === 'exercise' ? 'bg-green-900/20 text-green-400' :
                          lesson.type === 'notebook' ? 'bg-purple-900/20 text-purple-400' :
                          'bg-orange-900/20 text-orange-400'
                        }`}>
                          {getLessonIcon(lesson.type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-finance-offwhite">{lesson.title}</h3>
                          <div className="flex items-center mt-1">
                            <Badge variant={
                              lesson.type === 'lecture' ? 'event' :
                              lesson.type === 'exercise' ? 'success' :
                              lesson.type === 'notebook' ? 'premium' :
                              'challenge'
                            }>
                              {lesson.type}
                            </Badge>
                            <div className="flex items-center ml-3 text-xs text-finance-lightgray">
                              <Clock className="h-3 w-3 mr-1" />
                              {lesson.duration}
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          <Lock className="h-5 w-5 text-finance-lightgray" />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="finance-card p-4 mb-6">
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-finance-burgundy/20 mr-3">
                        <Check className="h-4 w-4 text-finance-accent" />
                      </div>
                      <div>
                        <h3 className="text-finance-offwhite font-medium">{st('coursesPage.skillsGained', "Skills You'll Gain")}</h3>
                        <p className="text-finance-lightgray text-sm">
                          {st('coursesPage.volSkillsDescription', "Volatility surface analysis, pricing variance swaps, volatility trading strategies, and more.")}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-6 mt-6 border-t border-finance-steel/10">
                    <Link to="/exercises" className="text-finance-lightgray hover:text-finance-offwhite flex items-center">
                      <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                      {st('coursesPage.backToExercises', "Back to Exercises")}
                    </Link>
                    <Link to="/signup" className="finance-button flex items-center">
                      {st('coursesPage.unlockNow', "Unlock Now")} <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CourseAdvanced;
