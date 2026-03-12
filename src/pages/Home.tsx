import { Link } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import { ArrowRight, BarChart, BookOpen, Users, Award, LucideIcon, TrendingUp, Calculator, Brain } from "lucide-react";
import { useTranslation } from "react-i18next";
import { safeTranslate } from "../utils/translationUtils";

const Feature = ({ icon: Icon, title, description }: { icon: LucideIcon, title: string, description: string }) => (
  <div className="flex flex-col items-start p-5 md:p-6 finance-card group">
    <div className="rounded-md p-2.5 mb-4 bg-primary/8 border border-primary/10 group-hover:border-primary/25 transition-colors">
      <Icon className="h-5 w-5 text-primary" />
    </div>
    <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
  </div>
);

const ModulePreview = ({ title, level, description, to }: { title: string, level: string, description: string, to: string }) => (
  <Link to={to} className="finance-card p-5 md:p-6 group block focus:outline-none focus:ring-2 focus:ring-ring">
    <div className="flex justify-between items-start mb-3">
      <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">{title}</h3>
      <span className="text-[10px] px-2 py-0.5 bg-secondary rounded text-muted-foreground terminal-text ml-2 flex-shrink-0 uppercase tracking-wider font-medium">
        {level}
      </span>
    </div>
    <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{description}</p>
    <div className="flex justify-end">
      <span className="text-primary flex items-center text-xs font-medium group-hover:translate-x-1 transition-transform duration-200">
        Explore <ArrowRight className="ml-1 h-3.5 w-3.5" />
      </span>
    </div>
  </Link>
);

const StatItem = ({ value, label }: { value: string; label: string }) => (
  <div className="text-center">
    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary terminal-text">{value}</div>
    <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{label}</div>
  </div>
);

const Home = () => {
  const { t } = useTranslation();
  const st = (key: string, defaultValue: string) => safeTranslate(t, key, defaultValue);
  
  return (
    <div className="flex flex-col min-h-screen">
      <SEOHead
        title="The Pricing Library – Learn Quantitative Finance & Option Pricing"
        description="Interactive platform to master option pricing, Black-Scholes, Monte Carlo, Greeks, and volatility. Hands-on exercises, simulators, and real-world quant skills."
        keywords="quantitative finance, option pricing, black-scholes, derivatives, finance training, trading, volatility, greeks, monte carlo"
        canonical="https://thepricinglibrary.com"
      />
      
      {/* Hero */}
      <section className="relative py-14 sm:py-20 md:py-28 px-4 sm:px-6 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col">
              <p className="terminal-text text-xs tracking-[0.2em] uppercase mb-4 font-medium">
                {st('home.hero.tagline', 'The open platform for quant finance')}
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-5 leading-[1.1] text-foreground terminal-text">
                {st('home.hero.title1', 'Master Option Pricing')}<br />
                <span className="finance-gradient text-transparent bg-clip-text">
                  {st('home.hero.title2', 'From Theory to Code')}
                </span>
              </h1>
              
              <p className="text-muted-foreground text-base sm:text-lg md:text-xl mb-8 max-w-2xl leading-relaxed">
                {st('home.hero.description', 'Learn to price derivatives, simulate risk, and build quant models — with interactive courses, Python exercises, and professional-grade tools.')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/courses" className="finance-button text-center text-sm sm:text-base px-6 py-3 w-full sm:w-auto">
                  {st('home.hero.startCourse', 'Start Learning — Free')}
                </Link>
                <Link to="/tools" className="finance-button-outline text-center text-sm sm:text-base px-6 py-3 w-full sm:w-auto">
                  {st('home.hero.exploreTools', 'Explore Tools')}
                </Link>
              </div>
            </div>
            
            <div className="relative aspect-[4/3] bg-background/60 rounded-lg overflow-hidden border border-border">
              <div 
                className="bg-[url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3')] 
                bg-cover bg-center w-full h-full 
                opacity-80 filter brightness-75 contrast-125"
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-background/70 px-6 py-3 rounded-lg border border-primary/30 tracking-wider uppercase text-sm terminal-text text-primary shadow-lg">
                  TRADING TERMINAL ACTIVATED
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 sm:py-10 px-4 sm:px-6 border-b border-border bg-card/50">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <StatItem value="7+" label={st('home.stats.courses', 'In-depth courses')} />
          <StatItem value="50+" label={st('home.stats.exercises', 'Hands-on exercises')} />
          <StatItem value="6" label={st('home.stats.tools', 'Professional tools')} />
          <StatItem value="100%" label={st('home.stats.free', 'Free to start')} />
        </div>
      </section>
      
      {/* Features */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 terminal-text">
              {st('home.approach.title', 'Built for Aspiring Quants')}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              {st('home.approach.description', 'Bridge the gap between textbook theory and real-world quant skills with hands-on tools and exercises.')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Feature 
              icon={BookOpen} 
              title={st('home.features.pragmatic.title', 'Interactive Courses')} 
              description={st('home.features.pragmatic.description', 'Step-by-step lessons with embedded Python code, math rendering, and real-world examples.')}
            />
            <Feature 
              icon={Calculator} 
              title={st('home.features.tech.title', 'Professional Simulators')} 
              description={st('home.features.tech.description', 'Black-Scholes, Monte Carlo, Greeks, and volatility calculators — ready to use in your browser.')}
            />
            <Feature 
              icon={Brain} 
              title={st('home.features.job.title', 'Quant Interview Prep')} 
              description={st('home.features.job.description', 'Survival mode challenges, quizzes, and exercises designed around real interview questions.')}
            />
            <Feature 
              icon={TrendingUp} 
              title={st('home.features.certified.title', 'Strategy Lab')} 
              description={st('home.features.certified.description', 'Build, backtest, and visualize option strategies with payoff diagrams and Greeks analysis.')}
            />
          </div>
        </div>
      </section>
      
      {/* Curriculum */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 terminal-text">
                {st('home.curriculum.title', 'Comprehensive Curriculum')}
              </h2>
              <p className="text-muted-foreground max-w-xl text-sm sm:text-base leading-relaxed">
                {st('home.curriculum.description', 'From foundational models to advanced simulation techniques — everything you need to think like a quant.')}
              </p>
            </div>
            <Link to="/courses" className="finance-button flex items-center flex-shrink-0 text-sm">
              {st('home.curriculum.allModules', 'All Courses')} 
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ModulePreview 
              to="/courses/fundamentals/black-scholes"
              title={st('home.modules.blackScholes.title', 'Black-Scholes Model')} 
              level={st('home.modules.blackScholes.level', 'Fundamental')} 
              description={st('home.modules.blackScholes.description', 'Master the cornerstone option pricing model that revolutionized financial markets.')}
            />
            <ModulePreview 
              to="/courses/advanced/implied-vol"
              title={st('home.modules.volatility.title', 'Volatility Surface')} 
              level={st('home.modules.volatility.level', 'Intermediate')} 
              description={st('home.modules.volatility.description', 'Understand volatility smiles, skews, and term structures across option markets.')}
            />
            <ModulePreview 
              to="/courses/complex/exotic-options"
              title={st('home.modules.exotic.title', 'Exotic Options')} 
              level={st('home.modules.exotic.level', 'Advanced')} 
              description={st('home.modules.exotic.description', 'Price and hedge complex derivatives like barriers, Asians, and lookbacks.')}
            />
            <ModulePreview 
              to="/courses/fundamentals/greeks"
              title={st('home.modules.greeks.title', 'Option Greeks')} 
              level={st('home.modules.greeks.level', 'Intermediate')} 
              description={st('home.modules.greeks.description', 'Master delta, gamma, vega, theta, and their role in risk management.')}
            />
            <ModulePreview 
              to="/courses/complex/monte-carlo"
              title={st('home.modules.monteCarlo.title', 'Monte Carlo Methods')} 
              level={st('home.modules.monteCarlo.level', 'Advanced')} 
              description={st('home.modules.monteCarlo.description', 'Implement simulation techniques for pricing path-dependent options.')}
            />
            <ModulePreview 
              to="/courses/fundamentals/yield-curves"
              title={st('home.modules.stressTesting.title', 'Yield Curves')} 
              level={st('home.modules.stressTesting.level', 'Fundamental')} 
              description={st('home.modules.stressTesting.description', 'Understand interest rate term structures and bond pricing fundamentals.')}
            />
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-card/50 border-y border-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 terminal-text">
            {st('home.cta.title', 'Start Building Your Quant Skills Today')}
          </h2>
          <p className="text-muted-foreground mb-6 text-sm sm:text-base leading-relaxed">
            {st('home.cta.description', 'Free courses, professional tools, and a growing community of quant finance learners.')}
          </p>
          <Link to="/courses" className="finance-button text-center inline-block text-sm sm:text-base px-8 py-3">
            {st('home.cta.subscribe', 'Get Started — Free')}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
