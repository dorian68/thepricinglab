
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

interface PricingDialogProps {
  trigger: React.ReactNode;
}

const PricingDialog = ({ trigger }: PricingDialogProps) => {
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="bg-[#1A1F2C] text-white border-[#2A2F3C] max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{t('pricing.title')}</DialogTitle>
          <DialogDescription className="text-[#8E9196]">
            {t('pricing.subtitle')}
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
                  {t('pricing.recommended')}
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
                    <span className="text-sm text-[#8E9196] font-normal ml-1">{t('pricing.monthly')}</span>
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
          {t('pricing.guarantee')}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PricingDialog;
