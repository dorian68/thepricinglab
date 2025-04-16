
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MarketVisuals from "../components/MarketVisuals";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Code, Trophy, Users, BarChart3, Zap, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col min-h-screen bg-[#1A1F2C] text-white">
      <Navbar />
      
      {/* Animated background canvas */}
      <MarketVisuals />
      
      {/* Hero Section */}
      <section className="relative py-20 md:py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                {t('home.hero.title1')}<br />
                <span className="text-[#ea384c]">{t('home.hero.title2')}</span>
              </h1>
              
              <p className="text-[#8E9196] text-lg mt-6 mb-8">
                {t('home.hero.description')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="finance" asChild>
                  <Link to="/courses">
                    {t('home.hero.startCourse')}
                  </Link>
                </Button>
                <Button variant="financeOutline" asChild>
                  <Link to="/signup">
                    {t('home.hero.signUp')}
                  </Link>
                </Button>
              </div>
              
              <div className="mt-8">
                <span className="font-mono text-[#ea384c] tracking-wider text-sm font-medium">{t('home.hero.tagline')}</span>
              </div>
            </div>
            
            <div className="relative aspect-[4/3] bg-black/60 rounded-lg overflow-hidden">
              <div 
                className="bg-[url('/lovable-uploads/bf767635-7fdf-4661-88ea-ecfb8f95eb5d.png')] 
                bg-cover bg-center w-full h-full 
                opacity-80 filter brightness-75 contrast-125"
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="font-mono text-[#ea384c] bg-black/80 px-4 py-3 border border-red-900/30 rounded text-sm tracking-wider">
                  TRADING TERMINAL ACTIVATED
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notre Mission */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('home.approach.title')} <span className="text-[#ea384c]">{t('home.mission.highlight')}</span></h2>
            <p className="text-[#8E9196] max-w-2xl mx-auto">
              {t('home.approach.description')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#1A1F2C] p-6 rounded-lg border border-[#2A2F3C] hover:border-[#ea384c] transition-colors">
              <div className="mb-4 text-[#ea384c]">
                <BookOpen size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.features.pragmatic.title')}</h3>
              <p className="text-[#8E9196]">
                {t('home.features.pragmatic.description')}
              </p>
            </div>
            
            <div className="bg-[#1A1F2C] p-6 rounded-lg border border-[#2A2F3C] hover:border-[#ea384c] transition-colors">
              <div className="mb-4 text-[#ea384c]">
                <Code size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.features.tech.title')}</h3>
              <p className="text-[#8E9196]">
                {t('home.features.tech.description')}
              </p>
            </div>
            
            <div className="bg-[#1A1F2C] p-6 rounded-lg border border-[#2A2F3C] hover:border-[#ea384c] transition-colors">
              <div className="mb-4 text-[#ea384c]">
                <Trophy size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.features.certified.title')}</h3>
              <p className="text-[#8E9196]">
                {t('home.features.certified.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="py-16 px-6 bg-[#141821]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('home.curriculum.title')} <span className="text-[#ea384c]">{t('home.modules.highlight')}</span></h2>
            <p className="text-[#8E9196] max-w-2xl mx-auto">
              {t('home.curriculum.description')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-[#1A1F2C] border-[#2A2F3C] hover:border-[#ea384c] transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="mr-2 text-[#ea384c]" /> {t('home.modules.courses.title')}
                </CardTitle>
                <CardDescription className="text-[#8E9196]">
                  {t('home.modules.courses.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-[#8E9196]">
                {t('home.modules.courses.description')}
              </CardContent>
              <CardFooter>
                <Link to="/courses" className="text-[#ea384c] hover:text-red-400 flex items-center">
                  {t('home.modules.courses.cta')} <ArrowRight size={16} className="ml-2" />
                </Link>
              </CardFooter>
            </Card>
            
            <Card className="bg-[#1A1F2C] border-[#2A2F3C] hover:border-[#ea384c] transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="mr-2 text-[#ea384c]" /> {t('home.modules.survival.title')}
                </CardTitle>
                <CardDescription className="text-[#8E9196]">
                  {t('home.modules.survival.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-[#8E9196]">
                {t('home.modules.survival.description')}
              </CardContent>
              <CardFooter>
                <Link to="/survival-mode" className="text-[#ea384c] hover:text-red-400 flex items-center">
                  {t('home.modules.survival.cta')} <ArrowRight size={16} className="ml-2" />
                </Link>
              </CardFooter>
            </Card>
            
            <Card className="bg-[#1A1F2C] border-[#2A2F3C] hover:border-[#ea384c] transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 text-[#ea384c]" /> {t('home.modules.exercises.title')}
                </CardTitle>
                <CardDescription className="text-[#8E9196]">
                  {t('home.modules.exercises.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-[#8E9196]">
                {t('home.modules.exercises.description')}
              </CardContent>
              <CardFooter>
                <Link to="/exercises" className="text-[#ea384c] hover:text-red-400 flex items-center">
                  {t('home.modules.exercises.cta')} <ArrowRight size={16} className="ml-2" />
                </Link>
              </CardFooter>
            </Card>

            <Card className="bg-[#1A1F2C] border-[#2A2F3C] hover:border-[#ea384c] transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 text-[#ea384c]" /> {t('home.modules.community.title')}
                </CardTitle>
                <CardDescription className="text-[#8E9196]">
                  {t('home.modules.community.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-[#8E9196]">
                {t('home.modules.community.description')}
              </CardContent>
              <CardFooter>
                <Link to="/community" className="text-[#ea384c] hover:text-red-400 flex items-center">
                  {t('home.modules.community.cta')} <ArrowRight size={16} className="ml-2" />
                </Link>
              </CardFooter>
            </Card>

            <Card className="bg-[#1A1F2C] border-[#2A2F3C] hover:border-[#ea384c] transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Code className="mr-2 text-[#ea384c]" /> {t('home.modules.tools.title')}
                </CardTitle>
                <CardDescription className="text-[#8E9196]">
                  {t('home.modules.tools.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-[#8E9196]">
                {t('home.modules.tools.description')}
              </CardContent>
              <CardFooter>
                <Link to="/tools" className="text-[#ea384c] hover:text-red-400 flex items-center">
                  {t('home.modules.tools.cta')} <ArrowRight size={16} className="ml-2" />
                </Link>
              </CardFooter>
            </Card>

            <Card className="bg-[#1A1F2C] border-[#2A2F3C] hover:border-[#ea384c] transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 text-[#ea384c]" /> {t('home.modules.leaderboard.title')}
                </CardTitle>
                <CardDescription className="text-[#8E9196]">
                  {t('home.modules.leaderboard.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-[#8E9196]">
                {t('home.modules.leaderboard.description')}
              </CardContent>
              <CardFooter>
                <Link to="/leaderboard" className="text-[#ea384c] hover:text-red-400 flex items-center">
                  {t('home.modules.leaderboard.cta')} <ArrowRight size={16} className="ml-2" />
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">{t('home.cta.title')} <span className="text-[#ea384c]">{t('home.cta.highlight')}</span></h2>
          <p className="text-[#8E9196] mb-8">
            {t('home.cta.description')}
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="finance">
                  {t('home.cta.pricing')}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1A1F2C] text-white border-[#2A2F3C]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">{t('pricing.title')}</DialogTitle>
                  <DialogDescription className="text-[#8E9196]">
                    {t('pricing.subtitle')}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="bg-[#141821] p-6 rounded-lg border border-[#2A2F3C]">
                    <h3 className="text-xl font-bold mb-2">{t('pricing.basic.title')}</h3>
                    <div className="text-2xl font-bold text-[#ea384c] mb-4">29€ <span className="text-sm text-[#8E9196] font-normal">{t('pricing.monthly')}</span></div>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center">
                        <span className="mr-2 text-green-500">✓</span>
                        <span>{t('pricing.basic.feature1')}</span>
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2 text-green-500">✓</span>
                        <span>{t('pricing.basic.feature2')}</span>
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2 text-green-500">✓</span>
                        <span>{t('pricing.basic.feature3')}</span>
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2 text-green-500">✓</span>
                        <span>{t('pricing.basic.feature4')}</span>
                      </li>
                    </ul>
                    <Button variant="finance" className="w-full" asChild>
                      <Link to="/signup?plan=basic">
                        {t('pricing.basic.cta')}
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="bg-[#141821] p-6 rounded-lg border border-[#ea384c]">
                    <div className="bg-[#ea384c] text-white text-xs font-bold uppercase py-1 px-2 rounded absolute -mt-9 ml-4">{t('pricing.pro.recommended')}</div>
                    <h3 className="text-xl font-bold mb-2">{t('pricing.pro.title')}</h3>
                    <div className="text-2xl font-bold text-[#ea384c] mb-4">49€ <span className="text-sm text-[#8E9196] font-normal">{t('pricing.monthly')}</span></div>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center">
                        <span className="mr-2 text-green-500">✓</span>
                        <span>{t('pricing.pro.feature1')}</span>
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2 text-green-500">✓</span>
                        <span>{t('pricing.pro.feature2')}</span>
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2 text-green-500">✓</span>
                        <span>{t('pricing.pro.feature3')}</span>
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2 text-green-500">✓</span>
                        <span>{t('pricing.pro.feature4')}</span>
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2 text-green-500">✓</span>
                        <span>{t('pricing.pro.feature5')}</span>
                      </li>
                    </ul>
                    <Button variant="finance" className="w-full" asChild>
                      <Link to="/signup?plan=pro">
                        {t('pricing.pro.cta')}
                      </Link>
                    </Button>
                  </div>
                </div>
                <div className="mt-6 text-center text-[#8E9196] text-sm">
                  {t('pricing.guarantee')}
                </div>
              </DialogContent>
            </Dialog>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="financeOutline" asChild>
                  <Link to="/courses/fundamentals">
                    {t('home.cta.freeCourse')}
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-[#1A1F2C] border-[#2A2F3C] text-white">
                <p>{t('home.cta.tooltip')}</p>
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
