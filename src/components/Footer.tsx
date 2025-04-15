
import { Link } from "react-router-dom";
import { Mail, Linkedin, Github, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-finance-charcoal border-t border-finance-steel/20 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 terminal-text text-finance-accent">THE PRICING LAB</h3>
            <p className="text-finance-lightgray text-sm">
              Formation d'élite pour les futurs professionnels des marchés financiers.
            </p>
          </div>
          
          <div>
            <h4 className="text-md font-medium mb-3 text-finance-offwhite">Navigation</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-finance-lightgray hover:text-finance-accent text-sm">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/courses/fundamentals" className="text-finance-lightgray hover:text-finance-accent text-sm">
                  Cours
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-finance-lightgray hover:text-finance-accent text-sm">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/projects" className="text-finance-lightgray hover:text-finance-accent text-sm">
                  Projets
                </Link>
              </li>
              <li>
                <Link to="/tools" className="text-finance-lightgray hover:text-finance-accent text-sm">
                  Outils
                </Link>
              </li>
              <li>
                <Link to="/mentoring" className="text-finance-lightgray hover:text-finance-accent text-sm">
                  Mentorat
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-md font-medium mb-3 text-finance-offwhite">Légal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-finance-lightgray hover:text-finance-accent text-sm">
                  Conditions d'utilisation
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-finance-lightgray hover:text-finance-accent text-sm">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-finance-lightgray hover:text-finance-accent text-sm">
                  Cookies
                </Link>
              </li>
              <li>
                <Link to="/refund" className="text-finance-lightgray hover:text-finance-accent text-sm">
                  Politique de remboursement
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-md font-medium mb-3 text-finance-offwhite">Contact</h4>
            <div className="flex space-x-4 mb-4">
              <a href="mailto:contact@thepricinglab.com" className="text-finance-lightgray hover:text-finance-accent">
                <Mail size={20} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-finance-lightgray hover:text-finance-accent">
                <Linkedin size={20} />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-finance-lightgray hover:text-finance-accent">
                <Github size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-finance-lightgray hover:text-finance-accent">
                <Twitter size={20} />
              </a>
            </div>
            <p className="text-finance-lightgray text-sm">
              contact@thepricinglab.com
            </p>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-finance-steel/20 text-center">
          <p className="text-finance-lightgray text-xs">
            &copy; {new Date().getFullYear()} The Pricing Lab. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
