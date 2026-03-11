import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MethodologySection, { type MethodologyItem } from './MethodologySection';
import RelatedResources, { type RelatedResource } from './RelatedResources';

interface ToolPageLayoutProps {
  /** SEO title — appears in <title> tag */
  title: string;
  /** SEO meta description */
  metaDescription: string;
  /** Main hero headline */
  headline: string;
  /** One-line value proposition under the headline */
  valueProp: string;
  /** Supporting paragraph (2-3 sentences) */
  supportingText: string;
  /** Trust signals shown below the supporting text */
  trustSignals?: string[];
  /** Primary CTA label */
  ctaLabel?: string;
  /** Primary CTA action */
  ctaAction?: () => void;
  /** Methodology items for the collapsible section */
  methodology?: MethodologyItem[];
  /** Related resources for cross-linking */
  relatedResources?: RelatedResource[];
  /** Bottom CTA section config */
  bottomCta?: {
    headline: string;
    description: string;
    primaryLabel: string;
    primaryPath: string;
    secondaryLabel?: string;
    secondaryPath?: string;
  };
  /** Main tool content */
  children: React.ReactNode;
}

const ToolPageLayout: React.FC<ToolPageLayoutProps> = ({
  title,
  metaDescription,
  headline,
  valueProp,
  supportingText,
  trustSignals,
  methodology,
  relatedResources,
  bottomCta,
  children,
}) => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>{title} | The Pricing Library</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={`https://thepricinglibrary.com${window.location.pathname}`} />
      </Helmet>

      {/* Hero */}
      <header className="py-10 md:py-14 px-6 border-b border-border">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl md:text-4xl font-bold terminal-text mb-3">{headline}</h1>
          <p className="text-base md:text-lg text-primary font-medium mb-2">{valueProp}</p>
          <p className="text-sm md:text-base text-muted-foreground max-w-3xl leading-relaxed">{supportingText}</p>

          {trustSignals && trustSignals.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-5">
              {trustSignals.map((signal, i) => (
                <span
                  key={i}
                  className="text-xs px-3 py-1.5 rounded-full bg-secondary text-muted-foreground border border-border font-medium"
                >
                  {signal}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="py-8 px-6">
        <div className="max-w-7xl mx-auto">{children}</div>
      </div>

      {/* Methodology */}
      {methodology && methodology.length > 0 && (
        <section className="py-10 px-6 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <MethodologySection items={methodology} />
          </div>
        </section>
      )}

      {/* Related Resources */}
      {relatedResources && relatedResources.length > 0 && (
        <section className="py-10 px-6 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <RelatedResources resources={relatedResources} />
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      {bottomCta && (
        <section className="py-12 px-6 border-t border-border bg-secondary/30">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-xl md:text-2xl font-bold terminal-text mb-3">{bottomCta.headline}</h2>
            <p className="text-muted-foreground mb-6">{bottomCta.description}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="finance" size="lg" onClick={() => navigate(bottomCta.primaryPath)}>
                {bottomCta.primaryLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {bottomCta.secondaryLabel && bottomCta.secondaryPath && (
                <Button
                  variant="outline"
                  size="lg"
                  className="border-primary text-primary hover:bg-primary/10"
                  onClick={() => navigate(bottomCta.secondaryPath!)}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  {bottomCta.secondaryLabel}
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Disclaimer */}
      <footer className="py-6 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>Disclaimer:</strong> This tool is provided for educational and analytical purposes only. 
            It does not constitute financial advice, investment recommendation, or solicitation. 
            Model outputs depend on input assumptions and may not reflect actual market conditions. 
            Always validate results independently before making financial decisions.
          </p>
        </div>
      </footer>
    </>
  );
};

export default ToolPageLayout;
