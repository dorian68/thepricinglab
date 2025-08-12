import React, { useState, useEffect } from 'react';
import { X, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const NewsletterBanner: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if banner was dismissed
    const dismissed = localStorage.getItem('newsletter-banner-dismissed');
    const lastDismissed = localStorage.getItem('newsletter-banner-last-dismissed');
    
    // Show banner if never dismissed or dismissed more than 7 days ago
    if (!dismissed || (lastDismissed && Date.now() - parseInt(lastDismissed) > 7 * 24 * 60 * 60 * 1000)) {
      setIsVisible(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error(t('newsletter.invalidEmail', 'Please enter a valid email address'));
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .insert([{ email: email.toLowerCase().trim() }]);

      if (error) {
        // If email already exists, still show success to avoid revealing user info
        if (error.code === '23505') {
          toast.success(t('newsletter.successAlready', 'You\'re already subscribed to our newsletter!'));
        } else {
          throw error;
        }
      } else {
        toast.success(t('newsletter.success', 'Thank you for subscribing to our newsletter!'));
      }
      
      setEmail('');
      setIsVisible(false);
      localStorage.setItem('newsletter-banner-dismissed', 'true');
      localStorage.setItem('newsletter-banner-last-dismissed', Date.now().toString());
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error(t('newsletter.error', 'An error occurred. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('newsletter-banner-dismissed', 'true');
    localStorage.setItem('newsletter-banner-last-dismissed', Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Mail className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {t('newsletter.title', 'Stay updated with the latest in quantitative finance')}
              </p>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {t('newsletter.description', 'Get our weekly insights, new tools, and trading strategies directly in your inbox.')}
              </p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-shrink-0">
            <Input
              type="email"
              placeholder={t('newsletter.emailPlaceholder', 'Enter your email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-48 h-9 text-sm"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              size="sm" 
              disabled={isLoading}
              className="whitespace-nowrap"
            >
              {isLoading ? t('common.loading', 'Loading...') : t('newsletter.subscribe', 'Subscribe')}
            </Button>
          </form>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="p-1 h-6 w-6 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewsletterBanner;