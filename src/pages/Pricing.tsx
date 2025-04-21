
import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PricingTiers from "../components/pricing/PricingTiers";
import FeatureComparisonTable from "../components/pricing/FeatureComparisonTable";
import PricingFAQ from "../components/pricing/PricingFAQ";
import PricingCTA from "../components/pricing/PricingCTA";
import { useTranslation } from "react-i18next";
import { safeTranslate } from "../utils/translationUtils";

const PricingPage = () => {
  const { t } = useTranslation();
  const st = (key: string, defaultValue: string) => safeTranslate(t, key, defaultValue);

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
          <PricingTiers />
        </div>
      </section>
      <section className="py-16 px-6 bg-[#141821]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">
            {st('pricing.comparison.title', 'Feature Comparison')}
          </h2>
          <FeatureComparisonTable />
        </div>
      </section>
      <PricingFAQ />
      <PricingCTA />
      <Footer />
    </div>
  );
};

export default PricingPage;
