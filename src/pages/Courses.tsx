import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Clock, BarChart, Lock, Check, AlertCircle, Star, GraduationCap, Rocket } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CourseModuleProps {
  title: string;
  level: string;
  duration: string;
  description: string;
  topics: string[];
  image: string;
  locked?: boolean;
  path: string;
  requiredPlan: 'freemium' | 'student' | 'pro';
}

const CourseModule = ({ 
  title, 
  level, 
  duration, 
  description, 
  topics, 
  image, 
  locked = false,
  path,
  requiredPlan = 'freemium'
}: CourseModuleProps) => {
  const { t } = useTranslation();
  
  // Simulating user's current plan - in a real implementation, this would come from a user context or API
  const userPlan = 'freemium'; // Options: 'freemium', 'student', 'pro'
  
  // Check if user has access based on their plan
  const hasAccess = () => {
    if (userPlan === 'pro') return true;
    if (userPlan === 'student' && (requiredPlan === 'student' || requiredPlan === 'freemium')) return true;
    if (userPlan === 'freemium' && requiredPlan === 'freemium') return true;
    return false;
  };
  
  // Determine if course is locked
  const isLocked = locked || !hasAccess();
  
  // Get upgrade path based on required plan
  const getUpgradePath = () => {
    if (requiredPlan === 'student') return '/pricing?recommended=student';
    if (requiredPlan === 'pro') return '/pricing?recommended=pro';
    return '/pricing';
  };
  
  return (
    <div className="finance-card overflow-hidden group">
      <div className="relative aspect-video bg-finance-charcoal">
        <div className={`bg-cover bg-center w-full h-full ${isLocked ? 'opacity-30' : 'opacity-50'}`} style={{ backgroundImage: `url(${image})` }}></div>
        
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-finance-dark/40">
            <div className="p-3 rounded-full bg-finance-dark/60 border border-finance-steel/30">
              <Lock className="h-6 w-6 text-finance-accent" />
            </div>
          </div>
        )}
        
        <div className="absolute top-4 left-4 flex space-x-2">
          <span className="terminal-text text-xs px-2 py-1 bg-finance-burgundy/80 rounded text-finance-offwhite">
            {level}
          </span>
          
          {requiredPlan !== 'freemium' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`terminal-text text-xs px-2 py-1 rounded text-finance-offwhite ${
                  requiredPlan === 'student' ? 'bg-blue-500/80' : 'bg-purple-500/80'
                }`}>
                  {requiredPlan === 'student' ? t('pricing.student.badge') : t('pricing.pro.badge')}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('coursesPage.requiredPlan', { plan: requiredPlan === 'student' ? t('pricing.student.title') : t('pricing.pro.title') })}</p>
              </TooltipContent>
            </Tooltip>
          )}
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
          <h4 className="text-sm font-medium text-finance-offwhite mb-2">{t('coursesPage.topics')}:</h4>
          <ul className="grid grid-cols-2 gap-2">
            {topics.map((topic, index) => (
              <li key={index} className="flex items-center text-xs text-finance-lightgray">
                <span className="h-1 w-1 rounded-full bg-finance-accent mr-2"></span>
                {topic}
              </li>
            ))}
          </ul>
        </div>
        
        {isLocked ? (
          <Link 
            to={getUpgradePath()}
            className="flex justify-between items-center p-3 rounded bg-finance-burgundy/10 text-finance-accent hover:bg-finance-burgundy/20 transition-colors duration-300"
          >
            <span className="text-sm font-medium">
              {t('coursesPage.upgrade')}
            </span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link 
            to={path}
            className="flex justify-between items-center p-3 rounded bg-finance-burgundy/10 text-finance-accent hover:bg-finance-burgundy/20 transition-colors duration-300"
          >
            <span className="text-sm font-medium">
              {t('coursesPage.access')}
            </span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        )}
      </div>
    </div>
  );
};

const Courses = () => {
  const { t } = useTranslation();
  
  const fundamentalsCourses = [
    {
      title: t('coursesPage.fundamentals.timeValue.title'),
      level: t('coursesPage.fundamentals.level'),
      duration: t('coursesPage.fundamentals.timeValue.duration'),
      description: t('coursesPage.fundamentals.timeValue.description'),
      topics: [
        t('coursesPage.fundamentals.timeValue.topics.compound'),
        t('coursesPage.fundamentals.timeValue.topics.present'),
        t('coursesPage.fundamentals.timeValue.topics.future'),
        t('coursesPage.fundamentals.timeValue.topics.rates')
      ],
      image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3",
      path: "/courses/fundamentals/time-value",
      requiredPlan: 'freemium' as const
    },
    {
      title: t('coursesPage.fundamentals.blackScholes.title'),
      level: t('coursesPage.fundamentals.level'),
      duration: t('coursesPage.fundamentals.blackScholes.duration'),
      description: t('coursesPage.fundamentals.blackScholes.description'),
      topics: [
        t('coursesPage.fundamentals.blackScholes.topics.probabilities'),
        t('coursesPage.fundamentals.blackScholes.topics.brownian'),
        t('coursesPage.fundamentals.blackScholes.topics.derivation'),
        t('coursesPage.fundamentals.blackScholes.topics.putCall')
      ],
      image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f",
      path: "/courses/fundamentals/black-scholes",
      requiredPlan: 'freemium' as const
    },
    {
      title: t('coursesPage.fundamentals.vanillaOptions.title'),
      level: t('coursesPage.fundamentals.level'),
      duration: t('coursesPage.fundamentals.vanillaOptions.duration'),
      description: t('coursesPage.fundamentals.vanillaOptions.description'),
      topics: [
        t('coursesPage.fundamentals.vanillaOptions.topics.calls'),
        t('coursesPage.fundamentals.vanillaOptions.topics.puts'),
        t('coursesPage.fundamentals.vanillaOptions.topics.payoffs'),
        t('coursesPage.fundamentals.vanillaOptions.topics.strategies')
      ],
      image: "https://images.unsplash.com/photo-1642104704074-907c0698cbd9",
      path: "/courses/fundamentals/vanilla-options",
      requiredPlan: 'freemium' as const
    },
    {
      title: t('coursesPage.fundamentals.impliedVol.title'),
      level: t('coursesPage.fundamentals.level'),
      duration: t('coursesPage.fundamentals.impliedVol.duration'),
      description: t('coursesPage.fundamentals.impliedVol.description'),
      topics: [
        t('coursesPage.fundamentals.impliedVol.topics.definition'),
        t('coursesPage.fundamentals.impliedVol.topics.calculation'),
        t('coursesPage.fundamentals.impliedVol.topics.historical'),
        t('coursesPage.fundamentals.impliedVol.topics.trading')
      ],
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71",
      path: "/courses/fundamentals/implied-vol-basics",
      requiredPlan: 'freemium' as const
    },
    {
      title: t('coursesPage.fundamentals.deltaHedging.title'),
      level: t('coursesPage.fundamentals.level'),
      duration: t('coursesPage.fundamentals.deltaHedging.duration'),
      description: t('coursesPage.fundamentals.deltaHedging.description'),
      topics: [
        t('coursesPage.fundamentals.deltaHedging.topics.definition'),
        t('coursesPage.fundamentals.deltaHedging.topics.implementation'),
        t('coursesPage.fundamentals.deltaHedging.topics.rebalancing'),
        t('coursesPage.fundamentals.deltaHedging.topics.costs')
      ],
      image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3",
      path: "/courses/fundamentals/delta-hedging",
      requiredPlan: 'freemium' as const
    }
  ];
  
  const intermediateCourses = [
    {
      title: t('coursesPage.intermediate.binomialTrees.title'),
      level: t('coursesPage.intermediate.level'),
      duration: t('coursesPage.intermediate.binomialTrees.duration'),
      description: t('coursesPage.intermediate.binomialTrees.description'),
      topics: [
        t('coursesPage.intermediate.binomialTrees.topics.oneStep'),
        t('coursesPage.intermediate.binomialTrees.topics.multiStep'),
        t('coursesPage.intermediate.binomialTrees.topics.convergence'),
        t('coursesPage.intermediate.binomialTrees.topics.american')
      ],
      image: "https://images.unsplash.com/photo-1543286386-713bdd548da4",
      path: "/courses/intermediate/binomial-trees",
      requiredPlan: 'student' as const
    },
    {
      title: t('coursesPage.intermediate.americanOptions.title'),
      level: t('coursesPage.intermediate.level'),
      duration: t('coursesPage.intermediate.americanOptions.duration'),
      description: t('coursesPage.intermediate.americanOptions.description'),
      topics: [
        t('coursesPage.intermediate.americanOptions.topics.earlyExercise'),
        t('coursesPage.intermediate.americanOptions.topics.boundary'),
        t('coursesPage.intermediate.americanOptions.topics.trees'),
        t('coursesPage.intermediate.americanOptions.topics.numerical')
      ],
      image: "https://images.unsplash.com/photo-1535320903710-d993d3d77d29",
      path: "/courses/intermediate/american-options",
      requiredPlan: 'student' as const
    },
    {
      title: t('coursesPage.intermediate.localVol.title'),
      level: t('coursesPage.intermediate.level'),
      duration: t('coursesPage.intermediate.localVol.duration'),
      description: t('coursesPage.intermediate.localVol.description'),
      topics: [
        t('coursesPage.intermediate.localVol.topics.surfaces'),
        t('coursesPage.intermediate.localVol.topics.modeling'),
        t('coursesPage.intermediate.localVol.topics.fitting'),
        t('coursesPage.intermediate.localVol.topics.limitations')
      ],
      image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e",
      path: "/courses/intermediate/local-volatility",
      requiredPlan: 'student' as const
    },
    {
      title: t('coursesPage.intermediate.greeks.title'),
      level: t('coursesPage.intermediate.level'),
      duration: t('coursesPage.intermediate.greeks.duration'),
      description: t('coursesPage.intermediate.greeks.description'),
      topics: [
        "Delta", "Gamma", "Vega", "Theta", "Rho"
      ],
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71",
      path: "/courses/fundamentals/greeks",
      requiredPlan: 'student' as const
    },
    {
      title: t('coursesPage.intermediate.monteCarlo.title'),
      level: t('coursesPage.intermediate.level'),
      duration: t('coursesPage.intermediate.monteCarlo.duration'),
      description: t('coursesPage.intermediate.monteCarlo.description'),
      topics: [
        t('coursesPage.intermediate.monteCarlo.topics.basics'),
        t('coursesPage.intermediate.monteCarlo.topics.pathGeneration'),
        t('coursesPage.intermediate.monteCarlo.topics.varianceReduction'),
        t('coursesPage.intermediate.monteCarlo.topics.implementation')
      ],
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
      path: "/courses/intermediate/monte-carlo",
      requiredPlan: 'student' as const
    }
  ];
  
  const advancedCourses = [
    {
      title: t('coursesPage.advanced.exoticOptions.title'),
      level: t('coursesPage.advanced.level'),
      duration: t('coursesPage.advanced.exoticOptions.duration'),
      description: t('coursesPage.advanced.exoticOptions.description'),
      topics: [
        t('coursesPage.advanced.exoticOptions.topics.barrier'),
        t('coursesPage.advanced.exoticOptions.topics.asian'),
        t('coursesPage.advanced.exoticOptions.topics.lookback'),
        t('coursesPage.advanced.exoticOptions.topics.quanto')
      ],
      image: "https://images.unsplash.com/photo-1605792657660-596af9009e82",
      path: "/courses/complex/exotic-options",
      requiredPlan: 'pro' as const
    },
    {
      title: t('coursesPage.advanced.structuredProducts.title'),
      level: t('coursesPage.advanced.level'),
      duration: t('coursesPage.advanced.structuredProducts.duration'),
      description: t('coursesPage.advanced.structuredProducts.description'),
      topics: [
        t('coursesPage.advanced.structuredProducts.topics.autocall'),
        t('coursesPage.advanced.structuredProducts.topics.reverseConvertible'),
        t('coursesPage.advanced.structuredProducts.topics.capital'),
        t('coursesPage.advanced.structuredProducts.topics.structures')
      ],
      image: "https://images.unsplash.com/photo-1642104704074-907c0698cbd9",
      path: "/courses/advanced/structured-products",
      requiredPlan: 'pro' as const
    },
    {
      title: t('coursesPage.advanced.stochasticModels.title'),
      level: t('coursesPage.advanced.level'),
      duration: t('coursesPage.advanced.stochasticModels.duration'),
      description: t('coursesPage.advanced.stochasticModels.description'),
      topics: [
        "Heston", "SABR", "Hull-White", 
        t('coursesPage.advanced.stochasticModels.topics.calibration')
      ],
      image: "https://images.unsplash.com/photo-1511797013134-17f1e8c093bd",
      path: "/courses/advanced/stochastic-models",
      requiredPlan: 'pro' as const
    },
    {
      title: t('coursesPage.advanced.smileSkew.title'),
      level: t('coursesPage.advanced.level'),
      duration: t('coursesPage.advanced.smileSkew.duration'),
      description: t('coursesPage.advanced.smileSkew.description'),
      topics: [
        t('coursesPage.advanced.smileSkew.topics.patterns'),
        t('coursesPage.advanced.smileSkew.topics.modeling'),
        t('coursesPage.advanced.smileSkew.topics.trading'),
        t('coursesPage.advanced.smileSkew.topics.risk')
      ],
      image: "https://images.unsplash.com/photo-1569025743873-ea3a9ade89f9",
      path: "/courses/advanced/smile-skew",
      requiredPlan: 'pro' as const
    },
    {
      title: t('coursesPage.advanced.xva.title'),
      level: t('coursesPage.advanced.level'),
      duration: t('coursesPage.advanced.xva.duration'),
      description: t('coursesPage.advanced.xva.description'),
      topics: [
        "CVA", "DVA", "FVA", 
        t('coursesPage.advanced.xva.topics.calculation')
      ],
      image: "https://images.unsplash.com/photo-1534951009808-766178b47a4f",
      path: "/courses/advanced/xva",
      requiredPlan: 'pro' as const
    },
    {
      title: t('coursesPage.advanced.stochasticRates.title'),
      level: t('coursesPage.advanced.level'),
      duration: t('coursesPage.advanced.stochasticRates.duration'),
      description: t('coursesPage.advanced.stochasticRates.description'),
      topics: [
        t('coursesPage.advanced.stochasticRates.topics.shortRate'),
        t('coursesPage.advanced.stochasticRates.topics.hjm'),
        t('coursesPage.advanced.stochasticRates.topics.calibration'),
        t('coursesPage.advanced.stochasticRates.topics.applications')
      ],
      image: "https://images.unsplash.com/photo-1620266757065-5813121e5157",
      path: "/courses/advanced/stochastic-rates",
      requiredPlan: 'pro' as const
    },
    {
      title: t('coursesPage.advanced.mlPricing.title'),
      level: t('coursesPage.advanced.level'),
      duration: t('coursesPage.advanced.mlPricing.duration'),
      description: t('coursesPage.advanced.mlPricing.description'),
      topics: [
        t('coursesPage.advanced.mlPricing.topics.regression'),
        t('coursesPage.advanced.mlPricing.topics.boosting'),
        t('coursesPage.advanced.mlPricing.topics.calibration'),
        t('coursesPage.advanced.mlPricing.topics.comparison')
      ],
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71",
      path: "/courses/advanced/ml-pricing",
      requiredPlan: 'pro' as const
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
                {t('coursesPage.title')}
              </h1>
              <p className="text-finance-lightgray text-lg mb-8">
                {t('coursesPage.subtitle')}
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 text-finance-accent mr-2" />
                  <span className="text-finance-lightgray text-sm">{t('coursesPage.stats.modules', { count: fundamentalsCourses.length + intermediateCourses.length + advancedCourses.length })}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-finance-accent mr-2" />
                  <span className="text-finance-lightgray text-sm">{t('coursesPage.stats.hours')}</span>
                </div>
                <div className="flex items-center">
                  <BarChart className="h-5 w-5 text-finance-accent mr-2" />
                  <span className="text-finance-lightgray text-sm">{t('coursesPage.stats.exercises')}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 mt-8">
                <Badge variant="outline" className="bg-finance-charcoal border-finance-steel/20 text-finance-offwhite px-3 py-1">
                  <Check className="h-3 w-3 mr-1 text-green-400" /> {t('coursesPage.badges.freemium')}
                </Badge>
                <Badge variant="outline" className="bg-finance-charcoal border-blue-500/20 text-finance-offwhite px-3 py-1">
                  <AlertCircle className="h-3 w-3 mr-1 text-blue-400" /> {t('coursesPage.badges.student')}
                </Badge>
                <Badge variant="outline" className="bg-finance-charcoal border-purple-500/20 text-finance-offwhite px-3 py-1">
                  <Lock className="h-3 w-3 mr-1 text-purple-400" /> {t('coursesPage.badges.pro')}
                </Badge>
              </div>
            </div>
            
            <div className="relative aspect-[4/3] bg-finance-charcoal rounded-lg overflow-hidden hidden lg:block">
              <div className="bg-[url('https://images.unsplash.com/photo-1642104704074-907c0698cbd9')] bg-cover bg-center w-full h-full opacity-50 mix-blend-overlay"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="terminal-text text-finance-accent bg-finance-charcoal/80 px-4 py-3 border border-finance-burgundy/30 rounded text-sm tracking-wider">
                  {t('coursesPage.heroTagline')}
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
              {t('courses.fundamentals')}
            </a>
            <a href="#intermediate" className="flex-shrink-0 px-6 py-4 border-b-2 border-transparent hover:border-finance-accent/50 text-finance-lightgray hover:text-finance-offwhite transition-colors duration-300">
              {t('courses.intermediate')}
            </a>
            <a href="#advanced" className="flex-shrink-0 px-6 py-4 border-b-2 border-transparent hover:border-finance-accent/50 text-finance-lightgray hover:text-finance-offwhite transition-colors duration-300">
              {t('courses.advanced')}
            </a>
            <a href="#subscription" className="flex-shrink-0 px-6 py-4 border-b-2 border-transparent hover:border-finance-accent/50 text-finance-lightgray hover:text-finance-offwhite transition-colors duration-300">
              {t('courses.subscription')}
            </a>
          </nav>
        </div>
      </div>
      
      {/* Fundamentals Section */}
      <section id="fundamentals" className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <div className="flex items-center mb-4">
              <h2 className="text-2xl font-bold terminal-text">{t('courses.fundamentals')}</h2>
              <Badge variant="outline" className="ml-2 bg-finance-charcoal border-green-500/20 text-green-400">
                Freemium
              </Badge>
            </div>
            <p className="text-finance-lightgray">
              {t('coursesPage.fundamentals.description')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fundamentalsCourses.map((course, index) => (
              <CourseModule key={index} {...course} />
            ))}
          </div>
        </div>
      </section>
      
      {/* Intermediate Section */}
      <section id="intermediate" className="py-16 px-6 bg-finance-charcoal/20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <div className="flex items-center mb-4">
              <h2 className="text-2xl font-bold terminal-text">{t('courses.intermediate')}</h2>
              <Badge variant="outline" className="ml-2 bg-finance-charcoal border-blue-500/20 text-blue-400">
                {t('pricing.student.badge')}
              </Badge>
            </div>
            <p className="text-finance-lightgray">
              {t('coursesPage.intermediate.description')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {intermediateCourses.map((course, index) => (
              <CourseModule key={index} {...course} />
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <Link to="/pricing?recommended=student" className="finance-button inline-flex items-center">
              {t('coursesPage.unlockIntermediateModules')} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <p className="mt-3 text-finance-lightgray text-sm">
              {t('coursesPage.studentPlanAccess')}
            </p>
          </div>
        </div>
      </section>
      
      {/* Advanced Section */}
      <section id="advanced" className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <div className="flex items-center mb-4">
              <h2 className="text-2xl font-bold terminal-text">{t('courses.advanced')}</h2>
              <Badge variant="outline" className="ml-2 bg-finance-charcoal border-purple-500/20 text-purple-400">
                {t('pricing.pro.badge')}
              </Badge>
            </div>
            <p className="text-finance-lightgray">
              {t('coursesPage.advanced.description')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advancedCourses.map((course, index) => (
              <CourseModule key={index} {...course} />
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <Link to="/pricing?recommended=pro" className="finance-button inline-flex items-center">
              {t('coursesPage.unlockAdvancedModules')} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <p className="mt-3 text-finance-lightgray text-sm">
              {t('coursesPage.proPlanAccess')}
            </p>
          </div>
        </div>
      </section>
      
      {/* Subscription CTA */}
      <section id="subscription" className="py-16 px-6 bg-finance-charcoal/50 border-y border-finance-steel/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4 terminal-text">{t('coursesPage.subscription.title')}</h2>
          <p className="text-finance-lightgray mb-8">
            {t('coursesPage.subscription.description')}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="finance-card p-4 flex flex-col items-center">
              <div className="p-3 rounded-full bg-finance-burgundy/10 mb-3">
                <Star className="h-6 w-6 text-yellow-400" />
              </div>
              <h3 className="text-lg font-medium mb-1">{t('pricing.freemium.title')}</h3>
              <p className="text-finance-accent font-bold">{t('pricing.freemium.price')}</p>
              <p className="text-finance-lightgray text-sm text-center mt-3">
                {t('coursesPage.subscription.freemium')}
              </p>
            </div>
            
            <div className="finance-card p-4 flex flex-col items-center relative">
              <div className="absolute -top-3 text-xs font-bold bg-blue-500 text-white px-3 py-1 rounded-full">
                {t('pricing.student.badge')}
              </div>
              <div className="p-3 rounded-full bg-finance-burgundy/10 mb-3">
                <GraduationCap className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-medium mb-1">{t('pricing.student.title')}</h3>
              <p className="text-finance-accent font-bold">19€ <span className="text-sm font-normal text-finance-lightgray">{t('pricing.monthly')}</span></p>
              <p className="text-finance-lightgray text-sm text-center mt-3">
                {t('coursesPage.subscription.student')}
              </p>
            </div>
            
            <div className="finance-card p-4 flex flex-col items-center relative">
              <div className="absolute -top-3 text-xs font-bold bg-purple-500 text-white px-3 py-1 rounded-full">
                {t('pricing.pro.badge')}
              </div>
              <div className="p-3 rounded-full bg-finance-burgundy/10 mb-3">
                <Rocket className="h-6 w-6 text-finance-accent" />
              </div>
              <h3 className="text-lg font-medium mb-1">{t('pricing.pro.title')}</h3>
              <p className="text-finance-accent font-bold">49€ <span className="text-sm font-normal text-finance-lightgray">{t('pricing.monthly')}</span></p>
              <p className="text-finance-lightgray text-sm text-center mt-3">
                {t('coursesPage.subscription.pro')}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="finance" size="lg" asChild>
              <Link to="/pricing">
                {t('coursesPage.subscription.viewPlans')}
              </Link>
            </Button>
            <Button variant="financeOutline" size="lg" asChild>
              <Link to="/courses/fundamentals/black-scholes">
                {t('coursesPage.subscription.tryFree')}
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Courses;
