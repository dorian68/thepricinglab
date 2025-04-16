
import React from 'react';

/**
 * Footer component for the application
 */
const Footer: React.FC = () => {
  return (
    <footer className="bg-finance-charcoal border-t border-finance-steel/20 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-medium text-finance-accent mb-4">The Pricing Lab</h3>
            <p className="text-finance-lightgray">
              La référence pour la théorie des options et le pricing quantitatif.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-finance-offwhite mb-3">Produits</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/courses" className="text-finance-lightgray hover:text-finance-accent">Cours</a></li>
              <li><a href="/exercises" className="text-finance-lightgray hover:text-finance-accent">Exercices</a></li>
              <li><a href="/tools" className="text-finance-lightgray hover:text-finance-accent">Outils</a></li>
              <li><a href="/community" className="text-finance-lightgray hover:text-finance-accent">Communauté</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-finance-offwhite mb-3">Entreprise</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/about" className="text-finance-lightgray hover:text-finance-accent">À propos</a></li>
              <li><a href="/blog" className="text-finance-lightgray hover:text-finance-accent">Blog</a></li>
              <li><a href="/mentoring" className="text-finance-lightgray hover:text-finance-accent">Mentorat</a></li>
              <li><a href="/contact" className="text-finance-lightgray hover:text-finance-accent">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-finance-offwhite mb-3">Légal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/terms" className="text-finance-lightgray hover:text-finance-accent">CGU</a></li>
              <li><a href="/privacy" className="text-finance-lightgray hover:text-finance-accent">Confidentialité</a></li>
              <li><a href="/cookies" className="text-finance-lightgray hover:text-finance-accent">Cookies</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-finance-steel/10 mt-8 pt-6 text-center text-finance-lightgray text-sm">
          <p>© {new Date().getFullYear()} The Pricing Lab. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
