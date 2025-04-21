
import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CheckCircle2, GraduationCap, Rocket, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { safeTranslate } from "../../utils/translationUtils";

interface PricingTier {
  id: string;
  name: string;
  price: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  cta: string;
  href: string;
  recommended: boolean;
  badge?: string;
}

const PricingTiers = () => {
  const { t } = useTranslation();
  const st = (key: string, defaultValue: string) =>
    safeTranslate(t, key, defaultValue);

  const pricingTiers: PricingTier[] = [
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

  return (
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
                <div className="p-2 rounded-full bg-[#1A1F2C] mr-3">{tier.icon}</div>
                <h3 className="text-xl font-medium text-finance-offwhite">{tier.name}</h3>
              </div>
              <div className="mb-6">
                <div className="text-3xl font-bold text-finance-accent">
                  {tier.price}
                  {tier.id !== "freemium" && (
                    <span className="text-sm text-[#8E9196] font-normal ml-1">
                      {st('pricing.monthly', 'Monthly')}
                    </span>
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
                <Link to={tier.href}>{tier.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="annual">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {pricingTiers.map((tier) => {
            const annualPrice =
              tier.id === "freemium"
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
                  <div className="p-2 rounded-full bg-[#1A1F2C] mr-3">{tier.icon}</div>
                  <h3 className="text-xl font-medium text-finance-offwhite">{tier.name}</h3>
                </div>
                <div className="mb-6">
                  <div className="text-3xl font-bold text-finance-accent">
                    {annualPrice}
                    {tier.id !== "freemium" && (
                      <span className="text-sm text-[#8E9196] font-normal ml-1">
                        {st('pricing.annual', 'Annual')}
                      </span>
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
                  <Link to={`${tier.href}&billing=annual`}>{tier.cta}</Link>
                </Button>
              </div>
            );
          })}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default PricingTiers;
