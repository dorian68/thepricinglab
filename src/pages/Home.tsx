
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MarketVisuals from "../components/MarketVisuals";
import { ArrowRight, BarChart, BookOpen, Users, Award, LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

// Testimonial Component
const Testimonial = ({ quote, author, position }: { quote: string, author: string, position: string }) => (
  <div className="finance-card p-6 flex flex-col justify-between h-full">
    <div>
      <p className="text-finance-lightgray italic mb-4">{quote}</p>
    </div>
    <div>
      <p className="text-finance-offwhite font-medium">{author}</p>
      <p className="text-finance-lightgray text-sm">{position}</p>
    </div>
  </div>
);

// Feature Component
const Feature = ({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: LucideIcon, 
  title: string, 
  description: string 
}) => (
  <div className="flex flex-col items-start p-6 finance-card">
    <div className="bg-finance-burgundy/20 rounded-full p-3 mb-4">
      <Icon className="h-6 w-6 text-finance-accent" />
    </div>
    <h3 className="text-lg font-medium text-finance-offwhite mb-2">{title}</h3>
    <p className="text-finance-lightgray text-sm">{description}</p>
  </div>
);

// Module Preview Component
const ModulePreview = ({ title, level, description }: { title: string, level: string, description: string }) => (
  <div className="finance-card p-6 hover:border-finance-accent transition-colors duration-300 cursor-pointer group">
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-lg font-medium text-finance-offwhite">{title}</h3>
      <span className="text-xs px-2 py-1 bg-finance-steel/20 rounded text-finance-lightgray terminal-text">
        {level}
      </span>
    </div>
    <p className="text-finance-lightgray text-sm mb-4">{description}</p>
    <div className="flex justify-end">
      <span className="text-finance-accent flex items-center text-sm font-medium group-hover:translate-x-1 transition-transform duration-300">
        <ArrowRight className="ml-1 h-4 w-4" />
      </span>
    </div>
  </div>
);

const Home = () => {
  const { t, i18n, ready } = useTranslation();
  
  // Safe translation function that provides fallbacks
  const safeTranslate = (key: string, defaultValue?: string) => {
    if (!ready) return defaultValue || key.split('.').pop();
    
    const result = t(key);
    // If the result is the same as the key, it means the translation is missing
    if (result === key) {
      console.warn(`Missing translation: ${key} in ${i18n.language}`);
      return defaultValue || key.split('.').pop() || key;
    }
    return result;
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite">
      <Navbar />
      
      {/* Animated background canvas */}
      <MarketVisuals />
      
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 px-6 border-b border-finance-steel/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col">
              <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight text-finance-offwhite terminal-text">
                {safeTranslate('home.hero.title1', 'Master Quantitative Finance')}<br />
                <span className="finance-gradient text-transparent bg-clip-text">
                  {safeTranslate('home.hero.title2', 'Like a Trading Pro')}
                </span>
              </h1>
              
              <p className="text-finance-lightgray text-lg mb-8">
                {safeTranslate('home.hero.description', 'Learn to price complex financial derivatives, understand volatility surfaces, and implement cutting-edge models with our hands-on platform.')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/courses/fundamentals/black-scholes" className="finance-button text-center">
                  {safeTranslate('home.hero.startCourse', 'Start Learning')}
                </Link>
                <Link to="/signup" className="finance-button-outline text-center">
                  {safeTranslate('home.hero.signUp', 'Sign Up')}
                </Link>
              </div>
              
              <div className="mt-12 flex items-center">
                <span className="terminal-text uppercase tracking-wider text-sm text-finance-accent font-semibold mr-8">
                  {safeTranslate('home.hero.tagline', 'FROM FUNDAMENTALS TO ADVANCED MODELS')}
                </span>
              </div>
            </div>
            
            <div className="relative aspect-[4/3] bg-finance-charcoal rounded-lg overflow-hidden">
              <div className="bg-[url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3')] bg-cover bg-center w-full h-full opacity-60 mix-blend-overlay"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="terminal-text text-finance-accent bg-finance-charcoal/80 px-4 py-3 border border-finance-burgundy/30 rounded text-sm tracking-wider">
                  {safeTranslate('home.hero.terminal', 'TRADING TERMINAL ACTIVATED')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 md:py-24 px-6 border-b border-finance-steel/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 terminal-text">
              {safeTranslate('home.approach.title', 'Our Innovative Approach')}
            </h2>
            <p className="text-finance-lightgray max-w-2xl mx-auto">
              {safeTranslate('home.approach.description', 'Our platform combines theoretical knowledge with practical applications to help you master complex financial models and valuation techniques.')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Feature 
              icon={BookOpen} 
              title={safeTranslate('home.features.pragmatic.title', 'Practical Learning')} 
              description={safeTranslate('home.features.pragmatic.description', 'Hands-on exercises and real-world problems to bridge the gap between theory and practice.')}
            />
            <Feature 
              icon={BarChart} 
              title={safeTranslate('home.features.tech.title', 'Technical Excellence')} 
              description={safeTranslate('home.features.tech.description', 'Focus on computational methods and implementing models using industry-standard techniques.')}
            />
            <Feature 
              icon={Users} 
              title={safeTranslate('home.features.job.title', 'Career Relevant')} 
              description={safeTranslate('home.features.job.description', 'Skills directly applicable to quantitative finance roles in investment banks and trading firms.')}
            />
            <Feature 
              icon={Award} 
              title={safeTranslate('home.features.certified.title', 'Industry Relevance')} 
              description={safeTranslate('home.features.certified.description', 'Curriculum designed in partnership with quantitative analysts from top investment banks.')}
            />
          </div>
        </div>
      </section>
      
      {/* Modules Preview Section */}
      <section className="py-16 md:py-24 px-6 border-b border-finance-steel/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-4 terminal-text">
                {safeTranslate('home.curriculum.title', 'Comprehensive Curriculum')}
              </h2>
              <p className="text-finance-lightgray max-w-2xl">
                {safeTranslate('home.curriculum.description', 'Our platform offers a wide range of modules covering all aspects of financial modeling and trading strategies.')}
              </p>
            </div>
            <Link to="/courses" className="mt-4 md:mt-0 finance-button flex items-center">
              {safeTranslate('home.curriculum.allModules', 'All Modules')} 
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ModulePreview 
              title={safeTranslate('home.modules.blackScholes.title', 'Black-Scholes Model')} 
              level={safeTranslate('home.modules.blackScholes.level', 'Fundamental')} 
              description={safeTranslate('home.modules.blackScholes.description', 'Master the cornerstone option pricing model that revolutionized financial markets.')}
            />
            <ModulePreview 
              title={safeTranslate('home.modules.volatility.title', 'Volatility Surface')} 
              level={safeTranslate('home.modules.volatility.level', 'Intermediate')} 
              description={safeTranslate('home.modules.volatility.description', 'Understand volatility smiles, skews, and term structures across option markets.')}
            />
            <ModulePreview 
              title={safeTranslate('home.modules.exotic.title', 'Exotic Options')} 
              level={safeTranslate('home.modules.exotic.level', 'Advanced')} 
              description={safeTranslate('home.modules.exotic.description', 'Price and hedge complex derivatives like barriers, Asians, and lookbacks.')}
            />
            <ModulePreview 
              title={safeTranslate('home.modules.greeks.title', 'Option Greeks')} 
              level={safeTranslate('home.modules.greeks.level', 'Intermediate')} 
              description={safeTranslate('home.modules.greeks.description', 'Master delta, gamma, vega, theta, and their role in risk management.')}
            />
            <ModulePreview 
              title={safeTranslate('home.modules.monteCarlo.title', 'Monte Carlo Methods')} 
              level={safeTranslate('home.modules.monteCarlo.level', 'Advanced')} 
              description={safeTranslate('home.modules.monteCarlo.description', 'Implement simulation techniques for pricing path-dependent options.')}
            />
            <ModulePreview 
              title={safeTranslate('home.modules.stressTesting.title', 'Stress Testing')} 
              level={safeTranslate('home.modules.stressTesting.level', 'Advanced')} 
              description={safeTranslate('home.modules.stressTesting.description', 'Analyze option portfolios under extreme market scenarios.')}
            />
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-16 md:py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 terminal-text">
              {safeTranslate('home.testimonials.title', 'What Our Users Say')}
            </h2>
            <p className="text-finance-lightgray max-w-2xl mx-auto">
              {safeTranslate('home.testimonials.description', 'Hear from professionals and students who have transformed their quantitative finance skills with our platform.')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Testimonial 
              quote={safeTranslate('home.testimonials.alexandre.quote', 'The practical approach to option pricing models helped me ace my interviews for a quant role at a major investment bank.')}
              author={safeTranslate('home.testimonials.alexandre.author', 'Alexandre D.')}
              position={safeTranslate('home.testimonials.alexandre.position', 'Derivatives Trader, Paris')}
            />
            <Testimonial 
              quote={safeTranslate('home.testimonials.sarah.quote', 'Finally a platform that explains volatility surfaces in a way that made sense to me. The interactive tools are game-changing.')}
              author={safeTranslate('home.testimonials.sarah.author', 'Sarah M.')}
              position={safeTranslate('home.testimonials.sarah.position', 'Risk Manager, London')}
            />
            <Testimonial 
              quote={safeTranslate('home.testimonials.thomas.quote', 'As someone transitioning from academia to finance, this platform bridged the gap between mathematical theory and actual implementation.')}
              author={safeTranslate('home.testimonials.thomas.author', 'Thomas K.')}
              position={safeTranslate('home.testimonials.thomas.position', 'PhD Student, ETH Zurich')}
            />
          </div>
          
          <div className="mt-12 text-center">
            <Link to="/signup" className="finance-button inline-flex items-center">
              {safeTranslate('home.testimonials.joinCta', 'Join Our Community')} 
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* Subscription CTA */}
      <section className="py-16 px-6 bg-finance-charcoal/50 border-y border-finance-steel/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4 terminal-text">
            {safeTranslate('home.cta.title', 'Ready to Become a Quant Master?')}
          </h2>
          <p className="text-finance-lightgray mb-8">
            {safeTranslate('home.cta.description', 'Join thousands of professionals and students who are leveling up their quantitative finance skills.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="finance-button text-center">
              {safeTranslate('home.cta.subscribe', 'Choose a Plan')}
            </Link>
            <Link to="/courses" className="finance-button-outline text-center">
              {safeTranslate('home.cta.explore', 'Explore Courses')}
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Home;
