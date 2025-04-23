
import { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  ArrowLeft,
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
  Lock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";

const ImpliedVolCourse = () => {
  const { t } = useTranslation();
  const [activeLesson, setActiveLesson] = useState(0);

  // Course content
  const lessons = [
    { 
      title: t('coursesPage.advanced.impliedVol.lessons.intro'),
      duration: "20 min", 
      type: "lecture"
    },
    { 
      title: t('coursesPage.advanced.impliedVol.lessons.historical'),
      duration: "25 min", 
      type: "lecture"
    },
    { 
      title: t('coursesPage.advanced.impliedVol.lessons.surface'),
      duration: "35 min", 
      type: "lecture"
    },
    { 
      title: t('coursesPage.advanced.impliedVol.lessons.smile'),
      duration: "30 min", 
      type: "lecture"
    },
    { 
      title: t('coursesPage.advanced.impliedVol.topics.calibration'),
      duration: "40 min", 
      type: "lecture"
    },
    { 
      title: t('coursesPage.advanced.impliedVol.lessons.exercise'),
      duration: "50 min", 
      type: "exercise"
    },
    { 
      title: t('coursesPage.advanced.impliedVol.lessons.notebook'),
      duration: "60 min", 
      type: "notebook"
    },
    { 
      title: t('coursesPage.advanced.impliedVol.lessons.quiz'),
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
            <Link to="/courses" className="hover:text-finance-accent">
              {t('navbar.courses')}
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <Link to="/courses" className="hover:text-finance-accent">
              {t('courses.advanced')}
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-finance-offwhite">{t('coursesPage.advanced.impliedVol.title')}</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="finance-card p-6 mb-6">
                <h2 className="text-xl font-medium mb-4">{t('coursesPage.advanced.impliedVol.title')}</h2>
                <p className="text-finance-lightgray text-sm mb-6">
                  {t('coursesPage.advanced.impliedVol.description')}
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
                      <span className="text-finance-offwhite font-medium">{t('coursesPage.level')}</span>
                    </div>
                    <Badge variant="achievement">{t('coursesPage.levels.intermediate')}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-finance-accent mr-2" />
                      <span className="text-finance-offwhite font-medium">{t('coursesPage.duration')}</span>
                    </div>
                    <span className="text-finance-lightgray">{t('coursesPage.advanced.impliedVol.duration')}</span>
                  </div>
                </div>
              </div>
              
              <div className="finance-card p-6">
                <h3 className="text-lg font-medium mb-4">{t('coursesPage.unlock')}</h3>
                <p className="text-finance-lightgray text-sm mb-6">
                  {t('coursesPage.premiumDescription')}
                </p>
                <Link to="/signup" className="finance-button w-full flex items-center justify-center">
                  {t('coursesPage.subscribe')} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <p className="mt-4 text-xs text-finance-lightgray text-center">
                  {t('coursesPage.alreadySubscribed')} <Link to="/login" className="text-finance-accent hover:underline">{t('navbar.login')}</Link>
                </p>
              </div>
            </div>
            
            {/* Main content */}
            <div className="lg:col-span-2">
              <div className="finance-card overflow-hidden">
                <div className="aspect-video bg-finance-charcoal relative">
                  <div className="bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71')] bg-cover bg-center w-full h-full opacity-30"></div>
                  <div className="absolute inset-0 flex items-center justify-center bg-finance-dark/50">
                    <div className="text-center">
                      <div className="p-3 rounded-full bg-finance-burgundy/20 inline-flex items-center justify-center mb-4">
                        <Lock className="h-8 w-8 text-finance-accent" />
                      </div>
                      <h2 className="terminal-text text-2xl mb-4">{t('coursesPage.advanced.impliedVol.title')}</h2>
                      <Link to="/signup" className="finance-button inline-flex items-center">
                        <Play className="mr-2 h-4 w-4" /> {t('coursesPage.unlockContent')}
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
                    <h3 className="text-lg font-medium mb-2">{t('coursesPage.premiumContent')}</h3>
                    <p className="text-finance-lightgray mb-6 max-w-md mx-auto">
                      {t('coursesPage.impliedVolPremiumDesc')}
                    </p>
                    <div className="space-y-3">
                      <Link to="/signup" className="finance-button block w-full sm:w-auto sm:inline-block">
                        {t('coursesPage.unlockNow')}
                      </Link>
                      <Link to="/courses" className="block w-full sm:w-auto sm:inline-block text-finance-lightgray hover:text-finance-offwhite mt-3">
                        {t('coursesPage.discoverOther')}
                      </Link>
                    </div>
                  </div>
                  
                  <div className="finance-card p-4 mb-6 bg-finance-steel/10">
                    <h4 className="flex items-center text-finance-offwhite font-medium mb-2">
                      <BookOpen className="h-4 w-4 mr-2 text-finance-accent" />
                      {t('coursesPage.coursePreview')}
                    </h4>
                    <p className="text-sm text-finance-lightgray">
                      {t('coursesPage.advanced.impliedVol.preview')}
                    </p>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-finance-steel/10">
                    <h3 className="text-lg font-medium mb-4">{t('coursesPage.skillsAcquired')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-start p-3 bg-finance-steel/10 rounded-md">
                        <div className="p-1.5 rounded-full bg-finance-burgundy/20 mr-3">
                          <Check className="h-3.5 w-3.5 text-finance-accent" />
                        </div>
                        <span className="text-sm text-finance-lightgray">{t('coursesPage.advanced.impliedVol.skills.analysis')}</span>
                      </div>
                      <div className="flex items-start p-3 bg-finance-steel/10 rounded-md">
                        <div className="p-1.5 rounded-full bg-finance-burgundy/20 mr-3">
                          <Check className="h-3.5 w-3.5 text-finance-accent" />
                        </div>
                        <span className="text-sm text-finance-lightgray">{t('coursesPage.advanced.impliedVol.skills.skews')}</span>
                      </div>
                      <div className="flex items-start p-3 bg-finance-steel/10 rounded-md">
                        <div className="p-1.5 rounded-full bg-finance-burgundy/20 mr-3">
                          <Check className="h-3.5 w-3.5 text-finance-accent" />
                        </div>
                        <span className="text-sm text-finance-lightgray">{t('coursesPage.advanced.impliedVol.skills.calibration')}</span>
                      </div>
                      <div className="flex items-start p-3 bg-finance-steel/10 rounded-md">
                        <div className="p-1.5 rounded-full bg-finance-burgundy/20 mr-3">
                          <Check className="h-3.5 w-3.5 text-finance-accent" />
                        </div>
                        <span className="text-sm text-finance-lightgray">{t('coursesPage.advanced.impliedVol.skills.pricing')}</span>
                      </div>
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

export default ImpliedVolCourse;
