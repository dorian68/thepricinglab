
import React from 'react';
import { useTranslation } from 'react-i18next';
import { safeTranslate } from '../utils/translationUtils';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <h3 className="terminal-text text-sm font-bold tracking-wider mb-3">THE PRICING LIBRARY</h3>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              {safeTranslate(t, 'app.subtitle', 'The open platform for quantitative finance education and tooling.')}
            </p>
          </div>
          
          {/* Platform */}
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">{safeTranslate(t, 'footer.products', 'Platform')}</h4>
            <ul className="space-y-2">
              {[
                { to: '/courses', label: safeTranslate(t, 'navbar.courses', 'Courses') },
                { to: '/exercices', label: safeTranslate(t, 'navbar.exercises', 'Exercises') },
                { to: '/tools', label: safeTranslate(t, 'navbar.tools', 'Tools') },
                { to: '/community', label: safeTranslate(t, 'navbar.community', 'Community') },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-muted-foreground hover:text-primary transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">{safeTranslate(t, 'footer.resources', 'Resources')}</h4>
            <ul className="space-y-2">
              {[
                { to: '/blog', label: safeTranslate(t, 'navbar.blog', 'Blog') },
                { to: '/mentoring', label: safeTranslate(t, 'navbar.mentoring', 'Mentoring') },
                { to: '/bug-report', label: safeTranslate(t, 'footer.bugReport', 'Bug Report') },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-muted-foreground hover:text-primary transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tools */}
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Tools</h4>
            <ul className="space-y-2">
              {[
                { to: '/tools/black-scholes', label: 'Black-Scholes' },
                { to: '/tools/volatility-calculator', label: 'Volatility' },
                { to: '/tools/payoff-visualizer', label: 'Payoff' },
                { to: '/tools/model-calibration', label: 'Calibration' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-muted-foreground hover:text-primary transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">© {currentYear} The Pricing Library. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">Built for quantitative finance professionals and learners.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
