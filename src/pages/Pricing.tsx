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

const PricingPage = () => {
  const { t } = useTranslation();
  
  const pricingTiers = [
    {
      id: "freemium",
      name: t('pricing.freemium.title'),
      price: t('pricing.freemium.price'),
      description: t('pricing.freemium.description'),
      icon: <Star className="h-5 w-5 text-yellow-400" />,
      features: [
        t('pricing.freemium.feature1'),
        t('pricing.freemium.feature2'),
        t('pricing.freemium.feature3'),
        t('pricing.freemium.feature4')
      ],
      cta: t('pricing.freemium.cta'),
      href: "/signup?plan=freemium",
      recommended: false,
      badge: t('pricing.freemium.badge')
    },
    {
      id: "student",
      name: t('pricing.student.title'),
      price: "19€",
      description: t('pricing.student.description'),
      icon: <GraduationCap className="h-5 w-5 text-blue-400" />,
      features: [
        t('pricing.student.feature1'),
        t('pricing.student.feature2'),
        t('pricing.student.feature3'),
        t('pricing.student.feature4'),
        t('pricing.student.feature5')
      ],
      cta: t('pricing.student.cta'),
      href: "/signup?plan=student",
      recommended: true,
      badge: t('pricing.student.badge')
    },
    {
      id: "pro",
      name: t('pricing.pro.title'),
      price: "49€",
      description: t('pricing.pro.description'),
      icon: <Rocket className="h-5 w-5 text-finance-accent" />,
      features: [
        t('pricing.pro.feature1'),
        t('pricing.pro.feature2'),
        t('pricing.pro.feature3'),
        t('pricing.pro.feature4'),
        t('pricing.pro.feature5'),
        t('pricing.pro.feature6'),
        t('pricing.pro.feature7'),
        t('pricing.pro.feature8')
      ],
      cta: t('pricing.pro.cta'),
      href: "/signup?plan=pro",
      recommended: false,
      badge: t('pricing.pro.badge')
    }
  ];

  const featureComparison = [
    {
      category: t('pricing.comparison.category1'),
      features: [
        {
          name: t('pricing.comparison.fundamentals'),
          freemium: true,
          student: true,
          pro: true
        },
        {
          name: t('pricing.comparison.intermediate'),
          freemium: false,
          student: true,
          pro: true
        },
        {
          name: t('pricing.comparison.advanced'),
          freemium: false,
          student: false,
          pro: true
        }
      ]
    },
    {
      category: t('pricing.comparison.category2'),
      features: [
        {
          name: t('pricing.comparison.basicExercises'),
          freemium: true,
          student: true,
          pro: true
        },
        {
          name: t('pricing.comparison.intermediateExercises'),
          freemium: false,
          student: true,
          pro: true
        },
        {
          name: t('pricing.comparison.advancedExercises'),
          freemium: false,
          student: false,
          pro: true
        },
        {
          name: t('pricing.comparison.survivalMode'),
          freemium: 'limited',
          student: true,
          pro: true
        }
      ]
    },
    {
      category: t('pricing.comparison.category3'),
      features: [
        {
          name: t('pricing.comparison.basicTools'),
          freemium: true,
          student: true,
          pro: true
        },
        {
          name: t('pricing.comparison.advancedTools'),
          freemium: false,
          student: true,
          pro: true
        },
        {
          name: t('pricing.comparison.notebooks'),
          freemium: false,
          student: true,
          pro: true
        }
      ]
    },
    {
      category: t('pricing.comparison.category4'),
      features: [
        {
          name: t('pricing.comparison.certificates'),
          freemium: false,
          student: 'basic',
          pro: true
        },
        {
          name: t('pricing.comparison.linkedinIntegration'),
          freemium: false,
          student: false,
          pro: true
        },
        {
          name: t('pricing.comparison.performanceReports'),
          freemium: false,
          student: true,
          pro: true
        },
        {
          name: t('pricing.comparison.projectChallenges'),
          freemium: false,
          student: false,
          pro: true
        },
        {
          name: t('pricing.comparison.gptAssistant'),
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
            {t('pricing.hero.title')} <span className="text-finance-accent">{t('pricing.hero.highlight')}</span>
          </h1>
          <p className="text-[#8E9196] text-lg max-w-3xl mx-auto mb-12">
            {t('pricing.hero.description')}
          </p>
          
          <Tabs defaultValue="monthly" className="max-w-[1400px] mx-auto">
            <TabsList className="grid grid-cols-2 w-64 mx-auto mb-8">
              <TabsTrigger value="monthly">{t('pricing.monthly')}</TabsTrigger>
              <TabsTrigger value="annual">{t('pricing.annual')}</TabsTrigger>
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
                        {t('pricing.recommended')}
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
                          <span className="text-sm text-[#8E9196] font-normal ml-1">{t('pricing.monthly')}</span>
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
                          {t('pricing.recommended')}
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
                            <span className="text-sm text-[#8E9196] font-normal ml-1">{t('pricing.annual')}</span>
                          )}
                        </div>
                        {tier.id !== "freemium" && (
                          <div className="text-sm text-green-400 mt-2">
                            {t('pricing.annualSavings')}
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
            {t('pricing.comparison.title')}
          </h2>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#2A2F3C]">
                  <TableHead className="text-left py-4 px-4 w-1/3 text-finance-offwhite">{t('pricing.comparison.feature')}</TableHead>
                  <TableHead className="text-center py-4 px-4 w-1/5 text-finance-offwhite">
                    <div className="flex flex-col items-center">
                      <Star className="h-5 w-5 text-yellow-400 mb-2" />
                      {t('pricing.freemium.title')}
                      <span className="text-[#8E9196] text-sm">{t('pricing.freemium.price')}</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-center py-4 px-4 w-1/5 text-finance-offwhite">
                    <div className="flex flex-col items-center">
                      <GraduationCap className="h-5 w-5 text-blue-400 mb-2" />
                      {t('pricing.student.title')}
                      <span className="text-finance-accent text-sm">19€ / {t('pricing.monthly')}</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-center py-4 px-4 w-1/5 text-finance-offwhite">
                    <div className="flex flex-col items-center">
                      <Rocket className="h-5 w-5 text-finance-accent mb-2" />
                      {t('pricing.pro.title')}
                      <span className="text-finance-accent text-sm">49€ / {t('pricing.monthly')}</span>
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
          <h2 className="text-3xl font-bold mb-8 text-center">{t('pricing.faq.title')}</h2>
          
          <div className="space-y-6">
            <div className="finance-card p-6">
              <h3 className="text-xl font-medium mb-3">{t('pricing.faq.question1')}</h3>
              <p className="text-[#8E9196]">{t('pricing.faq.answer1')}</p>
            </div>
            
            <div className="finance-card p-6">
              <h3 className="text-xl font-medium mb-3">{t('pricing.faq.question2')}</h3>
              <p className="text-[#8E9196]">{t('pricing.faq.answer2')}</p>
            </div>
            
            <div className="finance-card p-6">
              <h3 className="text-xl font-medium mb-3">{t('pricing.faq.question3')}</h3>
              <p className="text-[#8E9196]">{t('pricing.faq.answer3')}</p>
            </div>
            
            <div className="finance-card p-6">
              <h3 className="text-xl font-medium mb-3">{t('pricing.faq.question4')}</h3>
              <p className="text-[#8E9196]">{t('pricing.faq.answer4')}</p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-16 px-6 bg-[#141821]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            {t('pricing.cta.title')} <span className="text-finance-accent">{t('pricing.cta.highlight')}</span>
          </h2>
          <p className="text-[#8E9196] text-lg mb-8">
            {t('pricing.cta.description')}
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button variant="finance" size="lg" asChild>
              <Link to="/signup">
                {t('pricing.cta.start')}
              </Link>
            </Button>
            <Button variant="financeOutline" size="lg" asChild>
              <Link to="/courses/fundamentals/black-scholes">
                {t('pricing.cta.try')}
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
