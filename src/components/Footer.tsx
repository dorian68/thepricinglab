
import React from 'react';
import { useTranslation } from 'react-i18next';
import { safeTranslate } from '../utils/translationUtils';
import { Link } from 'react-router-dom';

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
              <li><Link to="/courses" className="text-finance-lightgray hover:text-finance-accent">{safeTranslate(t, 'navbar.courses', 'Cours')}</Link></li>
              <li><Link to="/exercises" className="text-finance-lightgray hover:text-finance-accent">{safeTranslate(t, 'navbar.exercises', 'Exercices')}</Link></li>
              <li><Link to="/tools" className="text-finance-lightgray hover:text-finance-accent">{safeTranslate(t, 'navbar.tools', 'Outils')}</Link></li>
              <li><Link to="/community" className="text-finance-lightgray hover:text-finance-accent">{safeTranslate(t, 'navbar.community', 'Communauté')}</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-finance-offwhite mb-3">{safeTranslate(t, 'footer.company', 'Entreprise')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="text-finance-lightgray hover:text-finance-accent">{safeTranslate(t, 'footer.about', 'À propos')}</Link></li>
              <li><Link to="/blog" className="text-finance-lightgray hover:text-finance-accent">{safeTranslate(t, 'navbar.blog', 'Blog')}</Link></li>
              <li><Link to="/mentoring" className="text-finance-lightgray hover:text-finance-accent">{safeTranslate(t, 'navbar.mentoring', 'Mentorat')}</Link></li>
              <li><Link to="/contact" className="text-finance-lightgray hover:text-finance-accent">{safeTranslate(t, 'contact', 'Contact')}</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-finance-offwhite mb-3">{safeTranslate(t, 'footer.legal', 'Légal')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/terms" className="text-finance-lightgray hover:text-finance-accent">{safeTranslate(t, 'footer.terms', 'CGU')}</Link></li>
              <li><Link to="/privacy" className="text-finance-lightgray hover:text-finance-accent">{safeTranslate(t, 'footer.privacy', 'Confidentialité')}</Link></li>
              <li><Link to="/cookies" className="text-finance-lightgray hover:text-finance-accent">{safeTranslate(t, 'footer.cookies', 'Cookies')}</Link></li>
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
