
import React from "react";
import { useTranslation } from "react-i18next";
import { safeTranslate } from "../../utils/translationUtils";

const PricingFAQ = () => {
  const { t } = useTranslation();
  const st = (key: string, defaultValue: string) =>
    safeTranslate(t, key, defaultValue);

  return (
    <section className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center">{st('pricing.faq.title', 'Frequently Asked Questions')}</h2>
        <div className="space-y-6">
          <div className="finance-card p-6">
            <h3 className="text-xl font-medium mb-3">{st('pricing.faq.question1', 'What happens after I subscribe?')}</h3>
            <p className="text-[#8E9196]">{st('pricing.faq.answer1', "After subscribing, you'll get immediate access to all the content included in your plan. You can start learning right away.")}</p>
          </div>
          <div className="finance-card p-6">
            <h3 className="text-xl font-medium mb-3">{st('pricing.faq.question2', 'Can I switch plans later?')}</h3>
            <p className="text-[#8E9196]">{st('pricing.faq.answer2', "Yes, you can upgrade or downgrade your plan at any time. If you upgrade, you'll be charged the prorated difference. If you downgrade, you'll receive credit towards your next billing cycle.")}</p>
          </div>
          <div className="finance-card p-6">
            <h3 className="text-xl font-medium mb-3">{st('pricing.faq.question3', 'Is there a free trial?')}</h3>
            <p className="text-[#8E9196]">{st('pricing.faq.answer3', 'Yes, our Free plan gives you access to core content so you can experience our platform before subscribing.')}</p>
          </div>
          <div className="finance-card p-6">
            <h3 className="text-xl font-medium mb-3">{st('pricing.faq.question4', 'How do refunds work?')}</h3>
            <p className="text-[#8E9196]">{st('pricing.faq.answer4', "If you're not satisfied with your subscription, contact us within 14 days of purchase for a full refund.")}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingFAQ;
