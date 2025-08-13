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
      // Using upsert to handle potential duplicates gracefully
      const { error } = await supabase
        .from('newsletter_subscriptions' as any)
        .upsert([{ email: email.toLowerCase().trim() }], { 
          onConflict: 'email',
          ignoreDuplicates: true 
        });

      if (error) {
        console.error('Newsletter subscription error:', error);
        // Still show success to avoid revealing user info about existing emails
        toast.success(t('newsletter.success', 'Merci de vous être inscrit à The Pricing Letter !'));
      } else {
        toast.success(t('newsletter.success', 'Merci de vous être inscrit à The Pricing Letter !'));
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
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Content Section */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="text-2xl flex-shrink-0 mt-1">📈</div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-foreground mb-1">
                {t('newsletter.title', 'Rejoignez The Pricing Letter')}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {t('newsletter.description', 'Recevez chaque semaine des analyses, stratégies et outils sur les produits structurés et dérivés — directement dans votre boîte mail.')}
              </p>
              <p className="text-xs text-muted-foreground/80">
                {t('newsletter.privacy', 'Pas de spam, vous pouvez vous désinscrire à tout moment.')}
              </p>
            </div>
          </div>
          
          {/* Form Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-shrink-0 w-full lg:w-auto">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Input
                type="email"
                placeholder={t('newsletter.emailPlaceholder', 'Votre email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full sm:w-64 h-10 text-sm"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                size="default" 
                disabled={isLoading}
                className="whitespace-nowrap font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 hover:scale-105"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('common.loading', 'Chargement...')}
                  </>
                ) : (
                  <>
                    📩 {t('newsletter.subscribe', "Je m'inscris gratuitement")}
                  </>
                )}
              </Button>
            </form>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="p-2 h-8 w-8 flex-shrink-0 hover:bg-muted/50 self-start sm:self-center"
              title={t('newsletter.close', 'Fermer')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsletterBanner;