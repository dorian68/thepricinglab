
import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { safeTranslate } from "../../utils/translationUtils";

const PricingCTA = () => {
  const { t } = useTranslation();
  const st = (key: string, defaultValue: string) =>
    safeTranslate(t, key, defaultValue);

  return (
    <section className="py-16 px-6 bg-[#141821]">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-6">
          {st('pricing.cta.title', 'Start Your Learning Journey')}{" "}
          <span className="text-finance-accent">{st('pricing.cta.highlight', 'Today')}</span>
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
  );
};

export default PricingCTA;
