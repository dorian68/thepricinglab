
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
  LineChart
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import YieldCurveVisualizer from "@/components/tools/YieldCurveVisualizer";

const YieldCurvesCourse = () => {
  const { t } = useTranslation();
  const [activeLesson, setActiveLesson] = useState(0);

  // Course content
  const lessons = [
    { 
      title: t('coursesPage.fundamentals.yieldCurves.topics.zeroCoupon'),
      duration: "20 min", 
      type: "lecture",
      completed: true
    },
    { 
      title: t('coursesPage.fundamentals.yieldCurves.topics.interpolation'),
      duration: "25 min", 
      type: "lecture",
      completed: false
    },
    { 
      title: t('coursesPage.fundamentals.yieldCurves.topics.bootstrapping'),
      duration: "40 min", 
      type: "lecture",
      completed: false 
    },
    { 
      title: t('coursesPage.fundamentals.yieldCurves.topics.discounting'),
      duration: "30 min", 
      type: "lecture",
      completed: false
    },
    { 
      title: "Exercise: Curve Building",
      duration: "45 min", 
      type: "exercise",
      completed: false
    },
    { 
      title: "Notebook: Forward Rates",
      duration: "60 min", 
      type: "notebook",
      completed: false
    },
    { 
      title: "Quiz: Yield Curve Construction",
      duration: "15 min", 
      type: "quiz",
      completed: false
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

  // Calculate course progress
  const progress = Math.round((lessons.filter(lesson => lesson.completed).length / lessons.length) * 100);
  
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
              {t('courses.fundamentals')}
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-finance-offwhite">Yield Curves</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="finance-card p-6 mb-6">
                <h2 className="text-xl font-medium mb-4">{t('coursesPage.fundamentals.yieldCurves.title')}</h2>
                <p className="text-finance-lightgray text-sm mb-6">
                  {t('coursesPage.fundamentals.yieldCurves.description')}
                </p>
                
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-finance-lightgray">Course Progress</span>
                    <span className="text-sm text-finance-accent">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2 bg-finance-steel/20" />
                </div>
                
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
                          {lesson.completed && (
                            <div className="w-5 h-5 rounded-full bg-finance-accent/20 flex items-center justify-center mr-3">
                              <Check className="h-3 w-3 text-finance-accent" />
                            </div>
                          )}
                          <span className={activeLesson === index ? 'text-finance-accent' : 'text-finance-offwhite'}>
                            {lesson.title}
                          </span>
                        </div>
                        <div className="flex items-center text-xs text-finance-lightgray">
                          <Clock className="h-3 w-3 mr-1" />
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
                    <Badge variant="achievement">{t('coursesPage.levels.beginner')}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-finance-accent mr-2" />
                      <span className="text-finance-offwhite font-medium">Durée estimée</span>
                    </div>
                    <span className="text-finance-lightgray">{t('coursesPage.fundamentals.yieldCurves.duration')}</span>
                  </div>
                </div>
              </div>
              
              <div className="finance-card p-6">
                <h3 className="text-lg font-medium mb-4">Resources</h3>
                <div className="space-y-3">
                  <Link to="/tools" className="flex items-center p-3 rounded bg-finance-steel/10 hover:bg-finance-steel/20 transition-colors">
                    <LineChart className="h-5 w-5 text-finance-accent mr-3" />
                    <div>
                      <span className="text-finance-offwhite block">Yield Curve Visualizer</span>
                      <span className="text-xs text-finance-lightgray">Interactive tool</span>
                    </div>
                  </Link>
                  
                  <button className="w-full flex items-center p-3 rounded bg-finance-steel/10 hover:bg-finance-steel/20 transition-colors">
                    <Download className="h-5 w-5 text-finance-accent mr-3" />
                    <div>
                      <span className="text-finance-offwhite block">Lecture Slides</span>
                      <span className="text-xs text-finance-lightgray">PDF, 1.8 MB</span>
                    </div>
                  </button>
                  
                  <button className="w-full flex items-center p-3 rounded bg-finance-steel/10 hover:bg-finance-steel/20 transition-colors">
                    <Code className="h-5 w-5 text-finance-accent mr-3" />
                    <div>
                      <span className="text-finance-offwhite block">Code Examples</span>
                      <span className="text-xs text-finance-lightgray">Python implementation</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Main content */}
            <div className="lg:col-span-2">
              <div className="finance-card overflow-hidden">
                <Tabs defaultValue="content" className="w-full">
                  <div className="border-b border-finance-steel/10">
                    <TabsList className="p-0 bg-transparent">
                      <TabsTrigger 
                        value="content" 
                        className="py-4 px-6 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-finance-accent rounded-none data-[state=active]:shadow-none"
                      >
                        Content
                      </TabsTrigger>
                      <TabsTrigger 
                        value="visualizer" 
                        className="py-4 px-6 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-finance-accent rounded-none data-[state=active]:shadow-none"
                      >
                        Yield Curve Visualizer
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="content" className="m-0">
                    <div className="aspect-video bg-finance-charcoal relative">
                      <div className="bg-[url('https://images.unsplash.com/photo-1543286386-713bdd548da4')] bg-cover bg-center w-full h-full opacity-20"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button className="p-4 rounded-full bg-finance-burgundy/40 text-finance-accent hover:bg-finance-burgundy/60 transition-colors">
                          <Play className="h-8 w-8" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <h2 className="text-xl font-medium mb-2">{lessons[activeLesson].title}</h2>
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
                      </div>
                      
                      {activeLesson === 0 && (
                        <>
                          <h3 className="text-lg font-medium mb-3">Zero-Coupon Bonds and Yield Curves</h3>
                          <p className="text-finance-lightgray mb-4">
                            Zero-coupon bonds are fundamental instruments for constructing yield curves. They pay no coupons and are issued at a discount to face value.
                          </p>
                          
                          <ul className="space-y-3 text-finance-lightgray mb-6">
                            <li className="flex items-start">
                              <span className="h-1.5 w-1.5 rounded-full bg-finance-accent mt-2 mr-2"></span>
                              <span>
                                <strong className="text-finance-offwhite">Definition:</strong> A zero-coupon bond makes a single payment at maturity and has no intermediate payments.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="h-1.5 w-1.5 rounded-full bg-finance-accent mt-2 mr-2"></span>
                              <span>
                                <strong className="text-finance-offwhite">Pricing:</strong> The price of a zero-coupon bond is calculated by discounting the face value by the appropriate discount factor.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="h-1.5 w-1.5 rounded-full bg-finance-accent mt-2 mr-2"></span>
                              <span>
                                <strong className="text-finance-offwhite">Yield to Maturity:</strong> The YTM of a zero-coupon bond is the discount rate that makes the present value equal to the market price.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="h-1.5 w-1.5 rounded-full bg-finance-accent mt-2 mr-2"></span>
                              <span>
                                <strong className="text-finance-offwhite">Yield Curve Construction:</strong> The zero-coupon yield curve is constructed from the yields of zero-coupon bonds of different maturities.
                              </span>
                            </li>
                          </ul>
                          
                          <div className="bg-finance-charcoal/30 p-4 rounded-md font-mono text-sm my-6 overflow-x-auto">
                            <code className="text-finance-offwhite">
                              Price = FaceValue / (1 + YTM)^T
                            </code>
                          </div>
                          
                          <div className="finance-card p-4 mb-6 bg-finance-burgundy/10">
                            <h4 className="text-finance-offwhite font-medium mb-2">Key Insight</h4>
                            <p className="text-sm text-finance-lightgray">
                              Zero-coupon bonds provide the cleanest measure of interest rates for specific time periods, making them the building blocks for understanding the term structure of interest rates.
                            </p>
                          </div>
                        </>
                      )}
                      
                      {activeLesson === 2 && (
                        <>
                          <h3 className="text-lg font-medium mb-3">Bootstrapping Techniques</h3>
                          <p className="text-finance-lightgray mb-4">
                            Bootstrapping is a technique used to derive zero-coupon yields from observable market instruments like coupon-bearing bonds or swaps.
                          </p>
                          
                          <p className="text-finance-lightgray mb-4">
                            The bootstrapping process follows these steps:
                          </p>
                          
                          <ol className="space-y-3 text-finance-lightgray mb-6 list-decimal pl-5">
                            <li>
                              <span className="text-finance-offwhite">Start with short-term instruments</span> like T-bills to get the first few zero rates.
                            </li>
                            <li>
                              <span className="text-finance-offwhite">Move to longer-term instruments</span> and use the already calculated zero rates to strip out the present values of interim cash flows.
                            </li>
                            <li>
                              <span className="text-finance-offwhite">Solve for the unknown zero rate</span> that makes the theoretical price equal to the market price.
                            </li>
                            <li>
                              <span className="text-finance-offwhite">Repeat the process</span> for successively longer maturities.
                            </li>
                          </ol>
                          
                          <div className="finance-card p-4 mb-6 bg-finance-burgundy/10">
                            <h4 className="text-finance-offwhite font-medium mb-2">Practical Application</h4>
                            <p className="text-sm text-finance-lightgray">
                              Bootstrapping allows traders and risk managers to value a wide range of fixed-income instruments and derivatives by providing a consistent set of discount factors across all maturities.
                            </p>
                          </div>
                        </>
                      )}
                      
                      <div className="flex justify-between items-center pt-6 mt-6 border-t border-finance-steel/10">
                        <button 
                          onClick={() => setActiveLesson(Math.max(0, activeLesson - 1))}
                          className="text-finance-lightgray hover:text-finance-offwhite flex items-center"
                          disabled={activeLesson === 0}
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Previous
                        </button>
                        <button 
                          onClick={() => setActiveLesson(Math.min(lessons.length - 1, activeLesson + 1))}
                          className="finance-button flex items-center"
                        >
                          Next <ArrowRight className="ml-2 h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="visualizer" className="m-0 p-6">
                    <h2 className="text-xl font-medium mb-6">Interactive Yield Curve Visualizer</h2>
                    <YieldCurveVisualizer />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </main>
      
    </div>
  );
};

export default YieldCurvesCourse;
