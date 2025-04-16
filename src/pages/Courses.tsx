import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Clock, BarChart, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

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
}: CourseModuleProps) => {
  const { t } = useTranslation();
  
  return (
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
        
        <Link 
          to={path}
          className={`flex justify-between items-center p-3 rounded ${
            locked 
              ? 'bg-finance-steel/10 text-finance-lightgray cursor-not-allowed' 
              : 'bg-finance-burgundy/10 text-finance-accent hover:bg-finance-burgundy/20 transition-colors duration-300'
          }`}
        >
          <span className="text-sm font-medium">
            {locked ? t('coursesPage.locked') : t('coursesPage.access')}
          </span>
          <ArrowRight className={`h-4 w-4 ${!locked && 'group-hover:translate-x-1 transition-transform duration-300'}`} />
        </Link>
      </div>
    </div>
  );
};

const Courses = () => {
  const { t } = useTranslation();
  
  const fundamentalsCourses = [
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
      path: "/courses/fundamentals/black-scholes"
    },
    {
      title: t('coursesPage.fundamentals.yieldCurves.title'),
      level: t('coursesPage.fundamentals.level'),
      duration: t('coursesPage.fundamentals.yieldCurves.duration'),
      description: t('coursesPage.fundamentals.yieldCurves.description'),
      topics: [
        t('coursesPage.fundamentals.yieldCurves.topics.zeroCoupon'),
        t('coursesPage.fundamentals.yieldCurves.topics.interpolation'),
        t('coursesPage.fundamentals.yieldCurves.topics.bootstrapping'),
        t('coursesPage.fundamentals.yieldCurves.topics.discounting')
      ],
      image: "https://images.unsplash.com/photo-1543286386-713bdd548da4",
      path: "/courses/fundamentals/yield-curves"
    },
    {
      title: t('coursesPage.fundamentals.greeks.title'),
      level: t('coursesPage.fundamentals.level'),
      duration: t('coursesPage.fundamentals.greeks.duration'),
      description: t('coursesPage.fundamentals.greeks.description'),
      topics: [
        "Delta", "Gamma", "Vega", "Theta", 
        t('coursesPage.fundamentals.greeks.topics.hedging')
      ],
      image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e",
      path: "/courses/fundamentals/greeks"
    }
  ];
  
  const advancedCourses = [
    {
      title: t('coursesPage.advanced.impliedVol.title'),
      level: t('coursesPage.advanced.level'),
      duration: t('coursesPage.advanced.impliedVol.duration'),
      description: t('coursesPage.advanced.impliedVol.description'),
      topics: ["Smile", "Skew", t('coursesPage.advanced.impliedVol.topics.calibration'), "Forward Vol"],
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71",
      path: "/courses/advanced/implied-vol",
      locked: true
    },
    {
      title: t('coursesPage.advanced.volProducts.title'),
      level: t('coursesPage.advanced.level'),
      duration: t('coursesPage.advanced.volProducts.duration'),
      description: t('coursesPage.advanced.volProducts.description'),
      topics: ["VIX", t('coursesPage.advanced.volProducts.topics.varianceSwaps'), t('coursesPage.advanced.volProducts.topics.volSwaps'), t('coursesPage.advanced.volProducts.topics.volTargeting')],
      image: "https://images.unsplash.com/photo-1535320903710-d993d3d77d29",
      path: "/courses/advanced/vol-products",
      locked: true
    }
  ];
  
  const complexCourses = [
    {
      title: t('coursesPage.complex.exotic.title'),
      level: t('coursesPage.complex.level'),
      duration: t('coursesPage.complex.exotic.duration'),
      description: t('coursesPage.complex.exotic.description'),
      topics: [
        t('coursesPage.complex.exotic.topics.knockInOut'), 
        t('coursesPage.complex.exotic.topics.touch'), 
        t('coursesPage.complex.exotic.topics.digitals'), 
        t('coursesPage.complex.exotic.topics.corridors')
      ],
      image: "https://images.unsplash.com/photo-1605792657660-596af9009e82",
      path: "/courses/complex/exotic-options",
      locked: true
    },
    {
      title: t('coursesPage.complex.monteCarlo.title'),
      level: t('coursesPage.complex.level'),
      duration: t('coursesPage.complex.monteCarlo.duration'),
      description: t('coursesPage.complex.monteCarlo.description'),
      topics: [
        t('coursesPage.complex.monteCarlo.topics.asian'), 
        t('coursesPage.complex.monteCarlo.topics.lookback'), 
        t('coursesPage.complex.monteCarlo.topics.simulation'), 
        t('coursesPage.complex.monteCarlo.topics.varianceReduction')
      ],
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
                {t('coursesPage.title')}
              </h1>
              <p className="text-finance-lightgray text-lg mb-8">
                {t('coursesPage.subtitle')}
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 text-finance-accent mr-2" />
                  <span className="text-finance-lightgray text-sm">{t('coursesPage.stats.modules')}</span>
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
            <a href="#advanced" className="flex-shrink-0 px-6 py-4 border-b-2 border-transparent hover:border-finance-accent/50 text-finance-lightgray hover:text-finance-offwhite transition-colors duration-300">
              {t('courses.advanced')}
            </a>
            <a href="#complex" className="flex-shrink-0 px-6 py-4 border-b-2 border-transparent hover:border-finance-accent/50 text-finance-lightgray hover:text-finance-offwhite transition-colors duration-300">
              {t('courses.complex')}
            </a>
            <a href="#bonus" className="flex-shrink-0 px-6 py-4 border-b-2 border-transparent hover:border-finance-accent/50 text-finance-lightgray hover:text-finance-offwhite transition-colors duration-300">
              {t('courses.bonus')}
            </a>
          </nav>
        </div>
      </div>
      
      {/* Fundamentals Section */}
      <section id="fundamentals" className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 terminal-text">{t('courses.fundamentals')}</h2>
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
      
      {/* Advanced Section */}
      <section id="advanced" className="py-16 px-6 bg-finance-charcoal/20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 terminal-text">{t('courses.advanced')}</h2>
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
            <Link to="/signup" className="finance-button inline-flex items-center">
              {t('coursesPage.unlockModules')} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <p className="mt-3 text-finance-lightgray text-sm">
              {t('coursesPage.subscriptionAccess')}
            </p>
          </div>
        </div>
      </section>
      
      {/* Complex Products Section */}
      <section id="complex" className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 terminal-text">{t('courses.complex')}</h2>
            <p className="text-finance-lightgray">
              {t('coursesPage.complex.description')}
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
          <h2 className="text-2xl font-bold mb-4 terminal-text">{t('coursesPage.cta.title')}</h2>
          <p className="text-finance-lightgray mb-8">
            {t('coursesPage.cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="finance-button text-center">
              {t('home.cta.subscribe')}
            </Link>
            <Link to="/" className="finance-button-outline text-center">
              {t('coursesPage.cta.learnMore')}
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Courses;
