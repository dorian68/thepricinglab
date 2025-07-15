import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MarketVisuals from "../components/MarketVisuals";
import SEOHead from "../components/SEOHead";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Code, Trophy, Users, BarChart3, Zap, ArrowRight, GraduationCap, Rocket, Star } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import PricingDialog from "../components/PricingDialog";

const Index = () => {
  const { t, i18n, ready } = useTranslation();
  
  const safeTranslate = (key: string, defaultValue?: string) => {
    if (!ready) return defaultValue || key.split('.').pop();
    
    const result = t(key);
    if (result === key) {
      //console.warn(`Missing translation: ${key} in ${i18n.language}`);
      return defaultValue || key.split('.').pop() || key;
    }
    return result;
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-[#1A1F2C] text-white">
      <SEOHead
        title="The Pricing Library – Formation Finance Quantitative Interactive"
        description="Maîtrisez la finance quantitative avec nos simulateurs interactifs, cours pratiques et challenges. Black-Scholes, Monte Carlo, Greeks et plus encore."
        keywords="finance quantitative, formation finance, black-scholes, monte carlo, option pricing, volatilité implicite, greeks, produits dérivés"
        canonical="https://thepricinglibrary.com"
      />
      
      <MarketVisuals />
      
      <section className="relative py-20 md:py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                {safeTranslate('home.hero.title1', 'Master Quantitative Finance')}<br />
                <span className="text-[#ea384c]">
                  {safeTranslate('home.hero.title2', 'Like a Trading Pro')}
                </span>
              </h1>
              
              <p className="text-[#8E9196] text-lg mt-6 mb-8">
                {safeTranslate('home.hero.description', 'Learn to price complex financial derivatives, understand volatility surfaces, and implement cutting-edge models with our hands-on platform.')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="finance" asChild>
                  <Link to="/courses">
                    {safeTranslate('home.hero.startCourse', 'Start Course')}
                  </Link>
                </Button>
                <Button variant="financeOutline" asChild>
                  <Link to="/signup">
                    {safeTranslate('home.hero.signUp', 'Sign Up')}
                  </Link>
                </Button>
              </div>
              
              <div className="mt-8">
                <span className="font-mono text-[#ea384c] tracking-wider text-sm font-medium">
                  {safeTranslate('home.hero.tagline', 'FROM FUNDAMENTALS TO ADVANCED MODELS')}
                </span>
              </div>
            </div>
            
            <div className="relative aspect-[4/3] bg-black/60 rounded-lg overflow-hidden">
              <div 
                className="bg-[url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3')] 
                bg-cover bg-center w-full h-full 
                opacity-80 filter brightness-75 contrast-125"
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/70 px-6 py-3 rounded-lg border border-[#ea384c]/30 tracking-wider uppercase text-sm font-mono text-[#ea384c] shadow-lg">
                  TRADING TERMINAL ACTIVATED
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              {safeTranslate('home.approach.title', 'Our Approach')} 
              <span className="text-[#ea384c]">
                {safeTranslate('home.mission.highlight', 'Innovative')}
              </span>
            </h2>
            <p className="text-[#8E9196] max-w-2xl mx-auto">
              {safeTranslate('home.approach.description', 'Our platform combines theoretical knowledge with practical applications to help you master complex financial models and valuation techniques.')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#1A1F2C] p-6 rounded-lg border border-[#2A2F3C] hover:border-[#ea384c] transition-colors">
              <div className="mb-4 text-[#ea384c]">
                <BookOpen size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{safeTranslate('home.features.pragmatic.title', 'Pragmatic Approach')}</h3>
              <p className="text-[#8E9196]">
                {safeTranslate('home.features.pragmatic.description', 'Learn through practical examples and real-world applications.')}
              </p>
            </div>
            
            <div className="bg-[#1A1F2C] p-6 rounded-lg border border-[#2A2F3C] hover:border-[#ea384c] transition-colors">
              <div className="mb-4 text-[#ea384c]">
                <Code size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{safeTranslate('home.features.tech.title', 'Technical Skills')}</h3>
              <p className="text-[#8E9196]">
                {safeTranslate('home.features.tech.description', 'Master advanced technical analysis and trading strategies.')}
              </p>
            </div>
            
            <div className="bg-[#1A1F2C] p-6 rounded-lg border border-[#2A2F3C] hover:border-[#ea384c] transition-colors">
              <div className="mb-4 text-[#ea384c]">
                <Trophy size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{safeTranslate('home.features.certified.title', 'Certified Expert')}</h3>
              <p className="text-[#8E9196]">
                {safeTranslate('home.features.certified.description', 'Gain the expertise to trade with confidence.')}
              </p>
            </div>
          </div>
        </div>
      </section>


      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{safeTranslate('home.curriculum.title', 'Curriculum')} <span className="text-[#ea384c]">{safeTranslate('home.modules.highlight', 'Explore Our Modules')}</span></h2>
            <p className="text-[#8E9196] max-w-2xl mx-auto">
              {safeTranslate('home.curriculum.description', 'Discover our comprehensive curriculum and learn at your own pace.')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-[#1A1F2C] border-[#2A2F3C] hover:border-[#ea384c] transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="mr-2 text-[#ea384c]" /> {safeTranslate('coursesPage.fundamentals.level', 'Fundamentals')}
                </CardTitle>
                <CardDescription className="text-[#8E9196]">
                  {safeTranslate('coursesPage.fundamentals.description', 'Learn the basics of financial derivatives and valuation.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-[#8E9196]">
                {safeTranslate('home.modules.fundamentals.description', 'Explore the theory and practice of financial derivatives.')}
              </CardContent>
              <CardFooter>
                <Link to="/courses#fundamentals" className="text-[#ea384c] hover:text-red-400 flex items-center">
                  {safeTranslate('home.modules.fundamentals.cta', 'Start Course')} <ArrowRight size={16} className="ml-2" />
                </Link>
              </CardFooter>
            </Card>
            
            <Card className="bg-[#1A1F2C] border-[#2A2F3C] hover:border-[#ea384c] transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="mr-2 text-[#ea384c]" /> {safeTranslate('home.modules.survival.title', 'Survival Mode')}
                </CardTitle>
                <CardDescription className="text-[#8E9196]">
                  {safeTranslate('home.modules.survival.subtitle', 'Improve your trading skills with our survival mode.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-[#8E9196]">
                {safeTranslate('home.modules.survival.description', 'Practice trading strategies and improve your skills.')}
              </CardContent>
              <CardFooter>
                <Link to="/survival-mode" className="text-[#ea384c] hover:text-red-400 flex items-center">
                  {safeTranslate('home.modules.survival.cta', 'Start Survival Mode')} <ArrowRight size={16} className="ml-2" />
                </Link>
              </CardFooter>
            </Card>
            
            <Card className="bg-[#1A1F2C] border-[#2A2F3C] hover:border-[#ea384c] transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 text-[#ea384c]" /> {safeTranslate('exercises.title', 'Exercises')}
                </CardTitle>
                <CardDescription className="text-[#8E9196]">
                  {safeTranslate('exercises.subtitle', 'Test your knowledge with our exercises.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-[#8E9196]">
                {safeTranslate('home.modules.exercises.description', 'Practice trading strategies and improve your skills.')}
              </CardContent>
              <CardFooter>
                <Link to="/exercises" className="text-[#ea384c] hover:text-red-400 flex items-center">
                  {safeTranslate('home.modules.exercises.cta', 'Start Exercises')} <ArrowRight size={16} className="ml-2" />
                </Link>
              </CardFooter>
            </Card>

            <Card className="bg-[#1A1F2C] border-[#2A2F3C] hover:border-[#ea384c] transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 text-[#ea384c]" /> {safeTranslate('community.title', 'Community')}
                </CardTitle>
                <CardDescription className="text-[#8E9196]">
                  {safeTranslate('community.subtitle', 'Connect with other traders and learn from their experiences.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-[#8E9196]">
                {safeTranslate('home.modules.community.description', 'Join our community and connect with other traders.')}
              </CardContent>
              <CardFooter>
                <Link to="/community" className="text-[#ea384c] hover:text-red-400 flex items-center">
                  {safeTranslate('home.modules.community.cta', 'Join Community')} <ArrowRight size={16} className="ml-2" />
                </Link>
              </CardFooter>
            </Card>

            <Card className="bg-[#1A1F2C] border-[#2A2F3C] hover:border-[#ea384c] transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Code className="mr-2 text-[#ea384c]" /> {safeTranslate('navbar.tools', 'Tools')}
                </CardTitle>
                <CardDescription className="text-[#8E9196]">
                  {safeTranslate('home.modules.tools.subtitle', 'Access our trading tools and resources.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-[#8E9196]">
                {safeTranslate('home.modules.tools.description', 'Explore our trading tools and resources.')}
              </CardContent>
              <CardFooter>
                <Link to="/tools" className="text-[#ea384c] hover:text-red-400 flex items-center">
                  {safeTranslate('home.modules.tools.cta', 'Access Tools')} <ArrowRight size={16} className="ml-2" />
                </Link>
              </CardFooter>
            </Card>

            <Card className="bg-[#1A1F2C] border-[#2A2F3C] hover:border-[#ea384c] transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 text-[#ea384c]" /> {safeTranslate('leaderboard.title', 'Leaderboard')}
                </CardTitle>
                <CardDescription className="text-[#8E9196]">
                  {safeTranslate('leaderboard.subtitle', 'Track your progress and compete with other traders.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-[#8E9196]">
                {safeTranslate('home.modules.leaderboard.description', 'Track your progress and compete with other traders.')}
              </CardContent>
              <CardFooter>
                <Link to="/leaderboard" className="text-[#ea384c] hover:text-red-400 flex items-center">
                  {safeTranslate('home.modules.leaderboard.cta', 'View Leaderboard')} <ArrowRight size={16} className="ml-2" />
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">{safeTranslate('home.cta.title', 'Call to Action')} <span className="text-[#ea384c]">{safeTranslate('home.cta.highlight', 'Join Our Community')}</span></h2>
          <p className="text-[#8E9196] mb-8">
            {safeTranslate('home.cta.description', 'Connect with other traders and learn from their experiences.')}
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <PricingDialog 
              trigger={
                <Button variant="finance">
                  {safeTranslate('pricing.title', 'Pricing')}
                </Button>
              }
            />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="financeOutline" asChild>
                  <Link to="/courses/fundamentals/black-scholes">
                    {safeTranslate('home.cta.freeCourse', 'Free Course')}
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-[#1A1F2C] border-[#2A2F3C] text-white">
                <p>{safeTranslate('home.cta.tooltip', 'Learn the basics of financial derivatives.')}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
