
import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CheckCircle2, GraduationCap, Trophy, Rocket, Star, Lock, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { safeTranslate } from "../utils/translationUtils";

const PricingPage = () => {
  const { t } = useTranslation();
  const st = (key: string, defaultValue: string) => safeTranslate(t, key, defaultValue);
  
  const pricingTiers = [
    {
      id: "freemium",
      name: st('pricing.freemium.title', 'Free'),
      price: st('pricing.freemium.price', '0€'),
      description: st('pricing.freemium.description', 'Basic access to get you started'),
      icon: <Star className="h-5 w-5 text-yellow-400" />,
      features: [
        st('pricing.freemium.features.access', 'Access to core lectures'),
        st('pricing.freemium.features.fundamentals', 'Basic option pricing models'),
        st('pricing.freemium.features.exercises', '5 practice exercises'),
        st('pricing.freemium.features.community', 'Community forum access')
      ],
      cta: st('pricing.freemium.cta', 'Start Free'),
      href: "/signup?plan=freemium",
      recommended: false,
      badge: st('pricing.freemium.badge', 'Free')
    },
    {
      id: "student",
      name: st('pricing.student.title', 'Student'),
      price: "19€",
      description: st('pricing.student.description', 'Perfect for learning and practice'),
      icon: <GraduationCap className="h-5 w-5 text-blue-400" />,
      features: [
        st('pricing.student.features.access', 'Everything in Free plan'),
        st('pricing.student.features.advanced', 'Advanced options pricing models'),
        st('pricing.student.features.exercises', 'Unlimited practice exercises'),
        st('pricing.student.features.quizzes', 'Access to all quizzes'),
        st('pricing.student.features.notebooks', 'Interactive notebooks')
      ],
      cta: st('pricing.student.cta', 'Choose Student Plan'),
      href: "/signup?plan=student",
      recommended: true,
      badge: st('pricing.student.badge', 'Student')
    },
    {
      id: "pro",
      name: st('pricing.pro.title', 'Professional'),
      price: "49€",
      description: st('pricing.pro.description', 'For serious quants and traders'),
      icon: <Rocket className="h-5 w-5 text-finance-accent" />,
      features: [
        st('pricing.pro.features.access', 'Everything in Student plan'),
        st('pricing.pro.features.exclusive', 'Exclusive content for professionals'),
        st('pricing.pro.features.advanced', 'Advanced volatility modeling'),
        st('pricing.pro.features.exotic', 'Exotic derivatives pricing'),
        st('pricing.pro.features.workshops', 'Monthly live workshops'),
        st('pricing.pro.features.certification', 'Course completion certificates'),
        st('pricing.pro.features.community', '1-on-1 expert sessions')
      ],
      cta: st('pricing.pro.cta', 'Choose Pro Plan'),
      href: "/signup?plan=pro",
      recommended: false,
      badge: st('pricing.pro.badge', 'Pro')
    }
  ];

  const featureComparison = [
    {
      category: st('pricing.comparison.category1', 'Content Access'),
      features: [
        {
          name: st('pricing.comparison.fundamentals', 'Fundamentals Content'),
          freemium: true,
          student: true,
          pro: true
        },
        {
          name: st('pricing.comparison.intermediate', 'Intermediate Content'),
          freemium: false,
          student: true,
          pro: true
        },
        {
          name: st('pricing.comparison.advanced', 'Advanced Content'),
          freemium: false,
          student: false,
          pro: true
        }
      ]
    },
    {
      category: st('pricing.comparison.category2', 'Learning Tools'),
      features: [
        {
          name: st('pricing.comparison.basicExercises', 'Basic Exercises'),
          freemium: true,
          student: true,
          pro: true
        },
        {
          name: st('pricing.comparison.intermediateExercises', 'Intermediate Exercises'),
          freemium: false,
          student: true,
          pro: true
        },
        {
          name: st('pricing.comparison.advancedExercises', 'Advanced Exercises'),
          freemium: false,
          student: false,
          pro: true
        },
        {
          name: st('pricing.comparison.survivalMode', 'Survival Mode'),
          freemium: 'limited',
          student: true,
          pro: true
        }
      ]
    },
    {
      category: st('pricing.comparison.category3', 'Trading Tools'),
      features: [
        {
          name: st('pricing.comparison.basicTools', 'Basic Trading Tools'),
          freemium: true,
          student: true,
          pro: true
        },
        {
          name: st('pricing.comparison.advancedTools', 'Advanced Trading Tools'),
          freemium: false,
          student: true,
          pro: true
        },
        {
          name: st('pricing.comparison.notebooks', 'Interactive Notebooks'),
          freemium: false,
          student: true,
          pro: true
        }
      ]
    },
    {
      category: st('pricing.comparison.category4', 'Professional Features'),
      features: [
        {
          name: st('pricing.comparison.certificates', 'Course Certificates'),
          freemium: false,
          student: 'basic',
          pro: true
        },
        {
          name: st('pricing.comparison.linkedinIntegration', 'LinkedIn Integration'),
          freemium: false,
          student: false,
          pro: true
        },
        {
          name: st('pricing.comparison.performanceReports', 'Performance Reports'),
          freemium: false,
          student: true,
          pro: true
        },
        {
          name: st('pricing.comparison.projectChallenges', 'Project Challenges'),
          freemium: false,
          student: false,
          pro: true
        },
        {
          name: st('pricing.comparison.gptAssistant', 'AI Assistant'),
          freemium: false,
          student: false,
          pro: true
        }
      ]
    }
  ];

  const renderFeatureAvailability = (available: boolean | string) => {
    if (available === true) {
      return <Check className="h-5 w-5 text-green-500" />;
    } else if (available === false) {
      return <X className="h-5 w-5 text-gray-400" />;
    } else if (available === 'limited') {
      return <span className="text-xs text-yellow-400">Limited</span>;
    } else if (available === 'basic') {
      return <span className="text-xs text-blue-400">Basic</span>;
    }
    return available;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#1A1F2C] text-white">
      <Navbar />
      
      <section className="py-20 px-6">
        <div className="max-w-[1400px] mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {st('pricing.hero.title', 'Plans & Pricing')} <span className="text-finance-accent">{st('pricing.hero.highlight', 'for Everyone')}</span>
          </h1>
          <p className="text-[#8E9196] text-lg max-w-3xl mx-auto mb-12">
            {st('pricing.hero.description', 'Choose the plan that fits your learning journey. All plans include access to our core platform features.')}
          </p>
          
          <Tabs defaultValue="monthly" className="max-w-[1400px] mx-auto">
            <TabsList className="grid grid-cols-2 w-64 mx-auto mb-8">
              <TabsTrigger value="monthly">{st('pricing.monthly', 'Monthly')}</TabsTrigger>
              <TabsTrigger value="annual">{st('pricing.annual', 'Annual')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="monthly">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {pricingTiers.map((tier) => (
                  <div 
                    key={tier.id} 
                    className={`bg-[#141821] p-8 rounded-lg border min-w-[340px] ${
                      tier.recommended ? 'border-finance-accent' : 'border-[#2A2F3C]'
                    } relative flex flex-col h-full`}
                  >
                    {tier.recommended && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-finance-accent text-xs font-bold uppercase py-1 px-3 rounded-full">
                        {st('pricing.recommended', 'Most Popular')}
                      </div>
                    )}
                    
                    {tier.badge && (
                      <Badge variant="outline" className="absolute top-4 right-4 bg-[#1A1F2C]/50">
                        {tier.badge}
                      </Badge>
                    )}
                    
                    <div className="flex items-center mb-6">
                      <div className="p-2 rounded-full bg-[#1A1F2C] mr-3">
                        {tier.icon}
                      </div>
                      <h3 className="text-xl font-medium text-finance-offwhite">{tier.name}</h3>
                    </div>
                    
                    <div className="mb-6">
                      <div className="text-3xl font-bold text-finance-accent">
                        {tier.price} 
                        {tier.id !== "freemium" && (
                          <span className="text-sm text-[#8E9196] font-normal ml-1">{st('pricing.monthly', 'Monthly')}</span>
                        )}
                      </div>
                      <p className="text-[#8E9196] text-sm mt-2">{tier.description}</p>
                    </div>
                    
                    <ul className="space-y-4 mb-8 flex-grow">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle2 className="h-5 w-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-finance-offwhite whitespace-nowrap overflow-hidden text-ellipsis">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      variant={tier.id === "freemium" ? "financeOutline" : "finance"} 
                      className="w-full mt-auto" 
                      size="lg"
                      asChild
                    >
                      <Link to={tier.href}>
                        {tier.cta}
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="annual">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {pricingTiers.map((tier) => {
                  const annualPrice = tier.id === "freemium" 
                    ? tier.price 
                    : `${Math.round(parseInt(tier.price) * 12 * 0.8)}€`;
                  
                  return (
                    <div 
                      key={tier.id} 
                      className={`bg-[#141821] p-8 rounded-lg border min-w-[340px] ${
                        tier.recommended ? 'border-finance-accent' : 'border-[#2A2F3C]'
                      } relative flex flex-col h-full`}
                    >
                      {tier.recommended && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-finance-accent text-xs font-bold uppercase py-1 px-3 rounded-full">
                          {st('pricing.recommended', 'Most Popular')}
                        </div>
                      )}
                      
                      {tier.id !== "freemium" && (
                        <div className="absolute -top-3 right-3 bg-green-500 text-white text-xs font-bold uppercase py-1 px-3 rounded-full">
                          -20%
                        </div>
                      )}
                      
                      {tier.badge && (
                        <Badge variant="outline" className="absolute top-4 right-4 bg-[#1A1F2C]/50">
                          {tier.badge}
                        </Badge>
                      )}
                      
                      <div className="flex items-center mb-6">
                        <div className="p-2 rounded-full bg-[#1A1F2C] mr-3">
                          {tier.icon}
                        </div>
                        <h3 className="text-xl font-medium text-finance-offwhite">{tier.name}</h3>
                      </div>
                      
                      <div className="mb-6">
                        <div className="text-3xl font-bold text-finance-accent">
                          {annualPrice} 
                          {tier.id !== "freemium" && (
                            <span className="text-sm text-[#8E9196] font-normal ml-1">{st('pricing.annual', 'Annual')}</span>
                          )}
                        </div>
                        {tier.id !== "freemium" && (
                          <div className="text-sm text-green-400 mt-2">
                            {st('pricing.annualSavings', 'Save 20% with annual billing')}
                          </div>
                        )}
                        <p className="text-[#8E9196] text-sm mt-2">{tier.description}</p>
                      </div>
                      
                      <ul className="space-y-4 mb-8 flex-grow">
                        {tier.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-finance-offwhite whitespace-nowrap overflow-hidden text-ellipsis">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <Button 
                        variant={tier.id === "freemium" ? "financeOutline" : "finance"} 
                        className="w-full mt-auto"
                        size="lg" 
                        asChild
                      >
                        <Link to={`${tier.href}&billing=annual`}>
                          {tier.cta}
                        </Link>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
      
      <section className="py-16 px-6 bg-[#141821]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">
            {st('pricing.comparison.title', 'Feature Comparison')}
          </h2>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#2A2F3C]">
                  <TableHead className="text-left py-4 px-4 w-1/3 text-finance-offwhite">{st('pricing.comparison.feature', 'Feature')}</TableHead>
                  <TableHead className="text-center py-4 px-4 w-1/5 text-finance-offwhite">
                    <div className="flex flex-col items-center">
                      <Star className="h-5 w-5 text-yellow-400 mb-2" />
                      {st('pricing.freemium.title', 'Free')}
                      <span className="text-[#8E9196] text-sm">{st('pricing.freemium.price', '0€')}</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-center py-4 px-4 w-1/5 text-finance-offwhite">
                    <div className="flex flex-col items-center">
                      <GraduationCap className="h-5 w-5 text-blue-400 mb-2" />
                      {st('pricing.student.title', 'Student')}
                      <span className="text-finance-accent text-sm">19€ / {st('pricing.monthly', 'Monthly')}</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-center py-4 px-4 w-1/5 text-finance-offwhite">
                    <div className="flex flex-col items-center">
                      <Rocket className="h-5 w-5 text-finance-accent mb-2" />
                      {st('pricing.pro.title', 'Professional')}
                      <span className="text-finance-accent text-sm">49€ / {st('pricing.monthly', 'Monthly')}</span>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featureComparison.map((category, categoryIndex) => (
                  <React.Fragment key={categoryIndex}>
                    <TableRow className="bg-[#1A1F2C]/30">
                      <TableCell colSpan={4} className="py-3 px-4 font-medium text-finance-offwhite">{category.category}</TableCell>
                    </TableRow>
                    {category.features.map((feature, featureIndex) => (
                      <TableRow 
                        key={`${categoryIndex}-${featureIndex}`} 
                        className="border-b border-[#2A2F3C]/30"
                      >
                        <TableCell className="py-3 px-4 text-[#8E9196]">{feature.name}</TableCell>
                        <TableCell className="py-3 px-4 text-center">{renderFeatureAvailability(feature.freemium)}</TableCell>
                        <TableCell className="py-3 px-4 text-center">{renderFeatureAvailability(feature.student)}</TableCell>
                        <TableCell className="py-3 px-4 text-center">{renderFeatureAvailability(feature.pro)}</TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
      
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">{st('pricing.faq.title', 'Frequently Asked Questions')}</h2>
          
          <div className="space-y-6">
            <div className="finance-card p-6">
              <h3 className="text-xl font-medium mb-3">{st('pricing.faq.question1', 'What happens after I subscribe?')}</h3>
              <p className="text-[#8E9196]">{st('pricing.faq.answer1', 'After subscribing, you'll get immediate access to all the content included in your plan. You can start learning right away.')}</p>
            </div>
            
            <div className="finance-card p-6">
              <h3 className="text-xl font-medium mb-3">{st('pricing.faq.question2', 'Can I switch plans later?')}</h3>
              <p className="text-[#8E9196]">{st('pricing.faq.answer2', 'Yes, you can upgrade or downgrade your plan at any time. If you upgrade, you'll be charged the prorated difference. If you downgrade, you'll receive credit towards your next billing cycle.')}</p>
            </div>
            
            <div className="finance-card p-6">
              <h3 className="text-xl font-medium mb-3">{st('pricing.faq.question3', 'Is there a free trial?')}</h3>
              <p className="text-[#8E9196]">{st('pricing.faq.answer3', 'Yes, our Free plan gives you access to core content so you can experience our platform before subscribing.')}</p>
            </div>
            
            <div className="finance-card p-6">
              <h3 className="text-xl font-medium mb-3">{st('pricing.faq.question4', 'How do refunds work?')}</h3>
              <p className="text-[#8E9196]">{st('pricing.faq.answer4', 'If you're not satisfied with your subscription, contact us within 14 days of purchase for a full refund.')}</p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-16 px-6 bg-[#141821]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            {st('pricing.cta.title', 'Start Your Learning Journey')} <span className="text-finance-accent">{st('pricing.cta.highlight', 'Today')}</span>
          </h2>
          <p className="text-[#8E9196] text-lg mb-8">
            {st('pricing.cta.description', 'Join thousands of professionals mastering quantitative finance.')}
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button variant="finance" size="lg" asChild>
              <Link to="/signup">
                {st('pricing.cta.start', 'Get Started')}
              </Link>
            </Button>
            <Button variant="financeOutline" size="lg" asChild>
              <Link to="/courses/fundamentals/black-scholes">
                {st('pricing.cta.try', 'Try Free Demo')}
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default PricingPage;
