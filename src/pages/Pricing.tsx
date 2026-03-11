
import React from "react";
import { Helmet } from "react-helmet-async";
import PricingTiers from "../components/pricing/PricingTiers";
import FeatureComparisonTable from "../components/pricing/FeatureComparisonTable";
import PricingFAQ from "../components/pricing/PricingFAQ";
import PricingCTA from "../components/pricing/PricingCTA";
import { useTranslation } from "react-i18next";
import { safeTranslate } from "../utils/translationUtils";

const PricingPage = () => {
  const { t } = useTranslation();
  const st = (key: string, defaultValue: string) => safeTranslate(t, key, defaultValue);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": st('pricing.faq.question1', 'What happens after I subscribe?'),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": st('pricing.faq.answer1', "After subscribing, you'll get immediate access to all the content included in your plan.")
        }
      },
      {
        "@type": "Question",
        "name": st('pricing.faq.question2', 'Can I switch plans later?'),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": st('pricing.faq.answer2', "Yes, you can upgrade or downgrade your plan at any time.")
        }
      },
      {
        "@type": "Question",
        "name": st('pricing.faq.question3', 'Is there a free trial?'),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": st('pricing.faq.answer3', 'Yes, our Free plan gives you access to core content so you can experience our platform before subscribing.')
        }
      },
      {
        "@type": "Question",
        "name": st('pricing.faq.question4', 'How do refunds work?'),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": st('pricing.faq.answer4', "If you're not satisfied with your subscription, contact us within 14 days of purchase for a full refund.")
        }
      }
    ]
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Helmet>
        <title>{st('pricing.hero.title', 'Plans & Pricing')} | The Pricing Library</title>
        <meta name="description" content={st('pricing.hero.description', 'Choose the plan that fits your learning journey. All plans include access to our core platform features.')} />
        <link rel="canonical" href="https://thepricinglibrary.com/pricing" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>
      <section className="py-20 px-6">
        <div className="max-w-[1400px] mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {st('pricing.hero.title', 'Plans & Pricing')} <span className="text-finance-accent">{st('pricing.hero.highlight', 'for Everyone')}</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto mb-12">
            {st('pricing.hero.description', 'Choose the plan that fits your learning journey. All plans include access to our core platform features.')}
          </p>
          <PricingTiers />
        </div>
      </section>
      <section className="py-16 px-6 bg-card">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">
            {st('pricing.comparison.title', 'Feature Comparison')}
          </h2>
          <FeatureComparisonTable />
        </div>
      </section>
      <PricingFAQ />
      <PricingCTA />
    </div>
  );
};

export default PricingPage;
