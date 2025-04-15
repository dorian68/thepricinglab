
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
  const { t } = useTranslation();
  
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
                {t('home.hero.title1')}<br />
                <span className="finance-gradient text-transparent bg-clip-text">{t('home.hero.title2')}</span>
              </h1>
              
              <p className="text-finance-lightgray text-lg mb-8">
                {t('home.hero.description')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/courses/fundamentals" className="finance-button text-center">
                  {t('home.hero.startCourse')}
                </Link>
                <Link to="/signup" className="finance-button-outline text-center">
                  {t('home.hero.signUp')}
                </Link>
              </div>
              
              <div className="mt-12 flex items-center">
                <span className="terminal-text uppercase tracking-wider text-sm text-finance-accent font-semibold mr-8">
                  {t('home.hero.tagline')}
                </span>
              </div>
            </div>
            
            <div className="relative aspect-[4/3] bg-finance-charcoal rounded-lg overflow-hidden">
              <div className="bg-[url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3')] bg-cover bg-center w-full h-full opacity-60 mix-blend-overlay"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="terminal-text text-finance-accent bg-finance-charcoal/80 px-4 py-3 border border-finance-burgundy/30 rounded text-sm tracking-wider">
                  {t('home.hero.terminal')}
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
            <h2 className="text-3xl font-bold mb-4 terminal-text">{t('home.approach.title')}</h2>
            <p className="text-finance-lightgray max-w-2xl mx-auto">
              {t('home.approach.description')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Feature 
              icon={BookOpen} 
              title={t('home.features.pragmatic.title')} 
              description={t('home.features.pragmatic.description')}
            />
            <Feature 
              icon={BarChart} 
              title={t('home.features.tech.title')} 
              description={t('home.features.tech.description')}
            />
            <Feature 
              icon={Users} 
              title={t('home.features.job.title')} 
              description={t('home.features.job.description')}
            />
            <Feature 
              icon={Award} 
              title={t('home.features.certified.title')} 
              description={t('home.features.certified.description')}
            />
          </div>
        </div>
      </section>
      
      {/* Modules Preview Section */}
      <section className="py-16 md:py-24 px-6 border-b border-finance-steel/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-4 terminal-text">{t('home.curriculum.title')}</h2>
              <p className="text-finance-lightgray max-w-2xl">
                {t('home.curriculum.description')}
              </p>
            </div>
            <Link to="/courses" className="mt-4 md:mt-0 finance-button flex items-center">
              {t('home.curriculum.allModules')} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ModulePreview 
              title={t('home.modules.blackScholes.title')} 
              level={t('home.modules.blackScholes.level')} 
              description={t('home.modules.blackScholes.description')}
            />
            <ModulePreview 
              title={t('home.modules.volatility.title')} 
              level={t('home.modules.volatility.level')} 
              description={t('home.modules.volatility.description')}
            />
            <ModulePreview 
              title={t('home.modules.exotic.title')} 
              level={t('home.modules.exotic.level')} 
              description={t('home.modules.exotic.description')}
            />
            <ModulePreview 
              title={t('home.modules.greeks.title')} 
              level={t('home.modules.greeks.level')} 
              description={t('home.modules.greeks.description')}
            />
            <ModulePreview 
              title={t('home.modules.monteCarlo.title')} 
              level={t('home.modules.monteCarlo.level')} 
              description={t('home.modules.monteCarlo.description')}
            />
            <ModulePreview 
              title={t('home.modules.stressTesting.title')} 
              level={t('home.modules.stressTesting.level')} 
              description={t('home.modules.stressTesting.description')}
            />
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-16 md:py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 terminal-text">{t('home.testimonials.title')}</h2>
            <p className="text-finance-lightgray max-w-2xl mx-auto">
              {t('home.testimonials.description')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Testimonial 
              quote={t('home.testimonials.alexandre.quote')}
              author={t('home.testimonials.alexandre.author')}
              position={t('home.testimonials.alexandre.position')}
            />
            <Testimonial 
              quote={t('home.testimonials.sarah.quote')}
              author={t('home.testimonials.sarah.author')}
              position={t('home.testimonials.sarah.position')}
            />
            <Testimonial 
              quote={t('home.testimonials.thomas.quote')}
              author={t('home.testimonials.thomas.author')}
              position={t('home.testimonials.thomas.position')}
            />
          </div>
          
          <div className="mt-12 text-center">
            <Link to="/signup" className="finance-button inline-flex items-center">
              {t('home.testimonials.joinCta')} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* Subscription CTA */}
      <section className="py-16 px-6 bg-finance-charcoal/50 border-y border-finance-steel/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4 terminal-text">{t('home.cta.title')}</h2>
          <p className="text-finance-lightgray mb-8">
            {t('home.cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="finance-button text-center">
              {t('home.cta.subscribe')}
            </Link>
            <Link to="/courses" className="finance-button-outline text-center">
              {t('home.cta.explore')}
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Home;
