
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description = "Plateforme interactive pour maîtriser les fondamentaux du pricing financier. Exercices pratiques, challenges, et simulateurs pour apprendre par la pratique.",
  keywords = "finance quantitative, option pricing, black-scholes, produits dérivés, formation finance, trading, volatilité, greeks",
  canonical,
  ogImage = "https://thepricinglibrary.com/og-image.jpg",
  ogType = "website",
  noIndex = false
}) => {
  const fullTitle = title.includes('The Pricing Library') ? title : `${title} | The Pricing Library`;
  const currentUrl = canonical || (typeof window !== 'undefined' ? window.location.href : 'https://thepricinglibrary.com');

  return (
    <Helmet>
      {/* Title */}
      <title>{fullTitle}</title>
      
      {/* Meta tags */}
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="The Pricing Library" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content="The Pricing Library" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Language */}
      <meta httpEquiv="content-language" content="fr-FR" />
      <link rel="alternate" hrefLang="fr" href={currentUrl} />
      <link rel="alternate" hrefLang="en" href={currentUrl.replace('fr/', 'en/')} />
      
      {/* Robots */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      )}
      
      {/* Google Analytics 4 */}
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-P1XNR9H40B"></script>
      <script>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-P1XNR9H40B');
        `}
      </script>
      
      {/* Schema.org structured data for Educational Organization */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "name": "The Pricing Library",
          "description": "Plateforme interactive pour maîtriser les fondamentaux du pricing financier",
          "url": "https://thepricinglibrary.com",
          "logo": "https://thepricinglibrary.com/logo.png",
          "sameAs": [
            "https://github.com/thepricinglibrary",
            "https://linkedin.com/company/thepricinglibrary"
          ],
          "offers": {
            "@type": "Course",
            "name": "Formation Finance Quantitative",
            "description": "Cours interactifs de finance quantitative et pricing d'options",
            "provider": {
              "@type": "Organization",
              "name": "The Pricing Library"
            }
          }
        })}
      </script>
    </Helmet>
  );
};

export default SEOHead;
