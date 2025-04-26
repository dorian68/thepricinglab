
import React from 'react';
import { useTranslation } from 'react-i18next';
import { safeTranslate } from '../utils/translationUtils';

/**
 * Footer component for the application
 */
const Footer: React.FC = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-finance-charcoal border-t border-finance-steel/20 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-medium text-finance-accent mb-4">The Pricing Lab</h3>
            <p className="text-finance-lightgray">
              {safeTranslate(t, 'app.subtitle', 'La référence pour la théorie des options et le pricing quantitatif.')}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-finance-offwhite mb-3">{safeTranslate(t, 'footer.products', 'Produits')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/courses" className="text-finance-lightgray hover:text-finance-accent">{safeTranslate(t, 'navbar.courses', 'Cours')}</a></li>
              <li><a href="/exercises" className="text-finance-lightgray hover:text-finance-accent">{safeTranslate(t, 'navbar.exercises', 'Exercices')}</a></li>
              <li><a href="/tools" className="text-finance-lightgray hover:text-finance-accent">{safeTranslate(t, 'navbar.tools', 'Outils')}</a></li>
              <li><a href="/community" className="text-finance-lightgray hover:text-finance-accent">{safeTranslate(t, 'navbar.community', 'Communauté')}</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-finance-offwhite mb-3">{safeTranslate(t, 'footer.company', 'Entreprise')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/about" className="text-finance-lightgray hover:text-finance-accent">{safeTranslate(t, 'footer.about', 'À propos')}</a></li>
              <li><a href="/blog" className="text-finance-lightgray hover:text-finance-accent">{safeTranslate(t, 'navbar.blog', 'Blog')}</a></li>
              <li><a href="/mentoring" className="text-finance-lightgray hover:text-finance-accent">{safeTranslate(t, 'navbar.mentoring', 'Mentorat')}</a></li>
              <li><a href="/contact" className="text-finance-lightgray hover:text-finance-accent">{safeTranslate(t, 'contact', 'Contact')}</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-finance-offwhite mb-3">{safeTranslate(t, 'footer.legal', 'Légal')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/terms" className="text-finance-lightgray hover:text-finance-accent">{safeTranslate(t, 'footer.terms', 'CGU')}</a></li>
              <li><a href="/privacy" className="text-finance-lightgray hover:text-finance-accent">{safeTranslate(t, 'footer.privacy', 'Confidentialité')}</a></li>
              <li><a href="/cookies" className="text-finance-lightgray hover:text-finance-accent">{safeTranslate(t, 'footer.cookies', 'Cookies')}</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-finance-steel/10 mt-8 pt-6 text-center text-finance-lightgray text-sm">
          <p>© {currentYear} The Pricing Lab.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
