
import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, GraduationCap, Trophy, Rocket, Star, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { safeTranslate } from "../utils/translationUtils";

interface PricingDialogProps {
  trigger: React.ReactNode;
}

const PricingDialog = ({ trigger }: PricingDialogProps) => {
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="bg-[#1A1F2C] text-white border-[#2A2F3C] max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{st('pricing.title', 'Pricing Plans')}</DialogTitle>
          <DialogDescription className="text-[#8E9196]">
            {st('pricing.subtitle', 'Choose the plan that best fits your learning goals')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          {pricingTiers.map((tier) => (
            <div 
              key={tier.id} 
              className={`bg-[#141821] p-6 rounded-lg border ${
                tier.recommended ? 'border-finance-accent' : 'border-[#2A2F3C]'
              } relative flex flex-col h-full`}
            >
              {tier.recommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-finance-accent text-xs font-bold uppercase py-1 px-3 rounded-full">
                  {st('pricing.recommended', 'Most Popular')}
                </div>
              )}
              
              {tier.badge && (
                <Badge variant="outline" className="absolute top-3 right-3 bg-[#1A1F2C]/50">
                  {tier.badge}
                </Badge>
              )}
              
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-full bg-[#1A1F2C] mr-3">
                  {tier.icon}
                </div>
                <h3 className="text-xl font-medium text-finance-offwhite">{tier.name}</h3>
              </div>
              
              <div className="mb-4">
                <div className="text-2xl font-bold text-finance-accent">
                  {tier.price} 
                  {tier.id !== "freemium" && (
                    <span className="text-sm text-[#8E9196] font-normal ml-1">{st('pricing.monthly', 'Monthly')}</span>
                  )}
                </div>
                <p className="text-[#8E9196] text-sm mt-1">{tier.description}</p>
              </div>
              
              <ul className="space-y-3 mb-6 flex-grow">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-finance-offwhite">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                variant={tier.id === "freemium" ? "financeOutline" : "finance"} 
                className="w-full" 
                asChild
              >
                <Link to={tier.href}>
                  {tier.cta}
                </Link>
              </Button>
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-center text-[#8E9196] text-sm">
          {st('pricing.guarantee', '14-day money-back guarantee, no questions asked')}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PricingDialog;
