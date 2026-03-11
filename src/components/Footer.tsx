
import React from 'react';
import { useTranslation } from 'react-i18next';
import { safeTranslate } from '../utils/translationUtils';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-finance-charcoal border-t border-border py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-medium text-finance-accent mb-4">{safeTranslate(t, 'app.title', 'The Pricing Library')}</h3>
            <p className="text-muted-foreground">
              {safeTranslate(t, 'app.subtitle', 'The reference for options theory and quantitative pricing.')}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">{safeTranslate(t, 'footer.products', 'Platform')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/courses" className="text-muted-foreground hover:text-finance-accent transition-colors">{safeTranslate(t, 'navbar.courses', 'Courses')}</Link></li>
              <li><Link to="/exercices" className="text-muted-foreground hover:text-finance-accent transition-colors">{safeTranslate(t, 'navbar.exercises', 'Exercises')}</Link></li>
              <li><Link to="/tools" className="text-muted-foreground hover:text-finance-accent transition-colors">{safeTranslate(t, 'navbar.tools', 'Tools')}</Link></li>
              <li><Link to="/community" className="text-muted-foreground hover:text-finance-accent transition-colors">{safeTranslate(t, 'navbar.community', 'Community')}</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">{safeTranslate(t, 'footer.resources', 'Resources')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/blog" className="text-muted-foreground hover:text-finance-accent transition-colors">{safeTranslate(t, 'navbar.blog', 'Blog')}</Link></li>
              <li><Link to="/mentoring" className="text-muted-foreground hover:text-finance-accent transition-colors">{safeTranslate(t, 'navbar.mentoring', 'Mentoring')}</Link></li>
              <li><Link to="/bug-report" className="text-muted-foreground hover:text-finance-accent transition-colors">{safeTranslate(t, 'footer.bugReport', 'Bug Report')}</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-6 text-center text-muted-foreground text-sm">
          <p>© {currentYear} The Pricing Library.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
