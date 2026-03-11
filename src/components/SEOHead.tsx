
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface SEOHeadProps {
  title: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, unknown>;
}

const BASE_URL = 'https://thepricinglibrary.com';

const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description = "Interactive platform to master option pricing, Black-Scholes, Monte Carlo, Greeks, and volatility. Hands-on exercises, simulators, and real-world quant skills.",
  keywords = "quantitative finance, option pricing, black-scholes, derivatives, financial training, trading, volatility, greeks",
  canonical,
  ogImage = `${BASE_URL}/og-image.png`,
  ogType = "website",
  noIndex = false,
  jsonLd
}) => {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const fullTitle = title.includes('The Pricing Library') ? title : `${title} | The Pricing Library`;
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const canonicalUrl = canonical || `${BASE_URL}${currentPath}`;

  // Default WebSite structured data
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "The Pricing Library",
    "url": BASE_URL,
    "description": "Interactive platform to master quantitative finance and option pricing",
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${BASE_URL}/blog?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "The Pricing Library",
    "description": "Interactive platform to master quantitative finance and option pricing",
    "url": BASE_URL,
    "logo": `${BASE_URL}/lovable-uploads/307d6f9a-03ee-4ecb-bd38-79c3d9752036.png`,
    "sameAs": [
      "https://github.com/thepricinglibrary",
      "https://linkedin.com/company/thepricinglibrary"
    ]
  };

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="The Pricing Library" />
      
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="The Pricing Library" />
      <meta property="og:locale" content={lang === 'fr' ? 'fr_FR' : 'en_US'} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Language */}
      <html lang={lang} />
      
      {/* Robots */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      )}
      
      {/* Structured data: WebSite */}
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
      
      {/* Structured data: Organization */}
      <script type="application/ld+json">
        {JSON.stringify(orgSchema)}
      </script>
      
      {/* Custom JSON-LD */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;
