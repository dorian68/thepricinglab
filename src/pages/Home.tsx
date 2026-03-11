import { Link } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import { ArrowRight, BarChart, BookOpen, Users, Award, LucideIcon, TrendingUp, Calculator, Brain } from "lucide-react";
import { useTranslation } from "react-i18next";
import { safeTranslate } from "../utils/translationUtils";

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
    <p className="text-muted-foreground text-sm">{description}</p>
  </div>
);

// Module Preview Component — now a real link
const ModulePreview = ({ title, level, description, to }: { title: string, level: string, description: string, to: string }) => (
  <Link to={to} className="finance-card p-6 hover:border-finance-accent transition-colors duration-300 group block focus:outline-none focus:ring-2 focus:ring-ring">
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-lg font-medium text-finance-offwhite">{title}</h3>
      <span className="text-xs px-2 py-1 bg-secondary rounded text-muted-foreground terminal-text">
        {level}
      </span>
    </div>
    <p className="text-muted-foreground text-sm mb-4">{description}</p>
    <div className="flex justify-end">
      <span className="text-finance-accent flex items-center text-sm font-medium group-hover:translate-x-1 transition-transform duration-300">
        Explore <ArrowRight className="ml-1 h-4 w-4" />
      </span>
    </div>
  </Link>
);

// Social proof stat
const StatItem = ({ value, label }: { value: string; label: string }) => (
  <div className="text-center">
    <div className="text-2xl md:text-3xl font-bold text-finance-accent terminal-text">{value}</div>
    <div className="text-sm text-muted-foreground mt-1">{label}</div>
  </div>
);

const Home = () => {
  const { t } = useTranslation();
  const st = (key: string, defaultValue: string) => safeTranslate(t, key, defaultValue);
  
  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite">
      <SEOHead
        title="The Pricing Library – Learn Quantitative Finance & Option Pricing"
        description="Interactive platform to master option pricing, Black-Scholes, Monte Carlo, Greeks, and volatility. Hands-on exercises, simulators, and real-world quant skills."
        keywords="quantitative finance, option pricing, black-scholes, derivatives, finance training, trading, volatility, greeks, monte carlo"
        canonical="https://thepricinglibrary.com"
      />
      
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 px-6 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <p className="terminal-text text-sm tracking-widest uppercase mb-4 text-finance-accent">
              {st('home.hero.tagline', 'The open platform for quant finance')}
            </p>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-finance-offwhite terminal-text">
              {st('home.hero.title1', 'Master Option Pricing')}<br />
              <span className="finance-gradient text-transparent bg-clip-text">
                {st('home.hero.title2', 'From Theory to Code')}
              </span>
            </h1>
            
            <p className="text-muted-foreground text-lg md:text-xl mb-8 max-w-2xl">
              {st('home.hero.description', 'Learn to price derivatives, simulate risk, and build quant models — with interactive courses, Python exercises, and professional-grade tools.')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/courses" className="finance-button text-center text-lg px-8 py-3">
                {st('home.hero.startCourse', 'Start Learning — Free')}
              </Link>
              <Link to="/tools" className="finance-button-outline text-center text-lg px-8 py-3">
                {st('home.hero.exploreTools', 'Explore Tools')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Stats Bar */}
      <section className="py-10 px-6 border-b border-border bg-finance-charcoal/40">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatItem value="7+" label={st('home.stats.courses', 'In-depth courses')} />
          <StatItem value="50+" label={st('home.stats.exercises', 'Hands-on exercises')} />
          <StatItem value="6" label={st('home.stats.tools', 'Professional tools')} />
          <StatItem value="100%" label={st('home.stats.free', 'Free to start')} />
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 md:py-24 px-6 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 terminal-text">
              {st('home.approach.title', 'Built for Aspiring Quants')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {st('home.approach.description', 'Bridge the gap between textbook theory and real-world quant skills with hands-on tools and exercises.')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      
      {/* Modules Preview Section */}
      <section className="py-16 md:py-24 px-6 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-4 terminal-text">
                {st('home.curriculum.title', 'Comprehensive Curriculum')}
              </h2>
              <p className="text-muted-foreground max-w-2xl">
                {st('home.curriculum.description', 'From foundational models to advanced simulation techniques — everything you need to think like a quant.')}
              </p>
            </div>
            <Link to="/courses" className="mt-4 md:mt-0 finance-button flex items-center">
              {st('home.curriculum.allModules', 'All Courses')} 
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      <section className="py-16 px-6 bg-finance-charcoal/50 border-y border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4 terminal-text">
            {st('home.cta.title', 'Start Building Your Quant Skills Today')}
          </h2>
          <p className="text-muted-foreground mb-8">
            {st('home.cta.description', 'Free courses, professional tools, and a growing community of quant finance learners.')}
          </p>
          <Link to="/courses" className="finance-button text-center inline-block text-lg px-10 py-3">
            {st('home.cta.subscribe', 'Get Started — Free')}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
