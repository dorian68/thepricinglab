
import { Mail, Linkedin, Github, Twitter } from "lucide-react";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-finance-charcoal border-t border-finance-steel/20 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 terminal-text text-finance-accent">THE PRICING LAB</h3>
            <p className="text-finance-lightgray text-sm">
              {t('footer.description')}
            </p>
          </div>
          
          <div>
            <h4 className="text-md font-medium mb-3 text-finance-offwhite">{t('footer.navigation')}</h4>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-finance-lightgray hover:text-finance-accent text-sm">
                  {t('nav.home')}
                </a>
              </li>
              <li>
                <a href="/courses/fundamentals" className="text-finance-lightgray hover:text-finance-accent text-sm">
                  {t('nav.courses')}
                </a>
              </li>
              <li>
                <a href="/dashboard" className="text-finance-lightgray hover:text-finance-accent text-sm">
                  {t('nav.dashboard')}
                </a>
              </li>
              <li>
                <a href="/projects" className="text-finance-lightgray hover:text-finance-accent text-sm">
                  {t('nav.projects')}
                </a>
              </li>
              <li>
                <a href="/tools" className="text-finance-lightgray hover:text-finance-accent text-sm">
                  {t('nav.tools')}
                </a>
              </li>
              <li>
                <a href="/mentoring" className="text-finance-lightgray hover:text-finance-accent text-sm">
                  {t('nav.mentoring')}
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-md font-medium mb-3 text-finance-offwhite">{t('footer.legal')}</h4>
            <ul className="space-y-2">
              <li>
                <a href="/terms" className="text-finance-lightgray hover:text-finance-accent text-sm">
                  {t('footer.terms')}
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-finance-lightgray hover:text-finance-accent text-sm">
                  {t('footer.privacy')}
                </a>
              </li>
              <li>
                <a href="/cookies" className="text-finance-lightgray hover:text-finance-accent text-sm">
                  {t('footer.cookies')}
                </a>
              </li>
              <li>
                <a href="/refund" className="text-finance-lightgray hover:text-finance-accent text-sm">
                  {t('footer.refund')}
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-md font-medium mb-3 text-finance-offwhite">{t('footer.contact')}</h4>
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
            &copy; {new Date().getFullYear()} The Pricing Lab. {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
