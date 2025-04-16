
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language?.split('-')[0] || 'en');

  useEffect(() => {
    // Ensure we're using the base language code without regional suffixes
    setCurrentLanguage(i18n.language?.split('-')[0] || 'en');
  }, [i18n.language]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setCurrentLanguage(lng);
    setIsOpen(false);
    
    // Save to localStorage with the correct format
    localStorage.setItem('i18nextLng', lng);
  };

  return (
    <div className="relative">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="flex items-center text-finance-offwhite hover:text-finance-accent"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={t('languageSwitcher.switchLanguage')}
          >
            <Globe className="w-5 h-5" />
            <span className="ml-1 hidden sm:inline">
              {currentLanguage === 'en' ? 'EN' : 'FR'}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent className="bg-[#1A1F2C] border-[#2A2F3C] text-white">
          <p>{t('languageSwitcher.tooltip')}</p>
        </TooltipContent>
      </Tooltip>
      
      {isOpen && (
        <div className="absolute mt-2 right-0 w-32 rounded-md shadow-lg bg-finance-charcoal ring-1 ring-finance-steel/20 z-50">
          <div className="py-1" role="menu">
            <button
              onClick={() => changeLanguage('fr')}
              className={`w-full text-left px-4 py-2 text-sm ${
                currentLanguage === 'fr' ? 'text-finance-accent' : 'text-finance-offwhite'
              } hover:bg-finance-steel/20`}
              role="menuitem"
            >
              {t('languageSwitcher.fr')}
            </button>
            <button
              onClick={() => changeLanguage('en')}
              className={`w-full text-left px-4 py-2 text-sm ${
                currentLanguage === 'en' ? 'text-finance-accent' : 'text-finance-offwhite'
              } hover:bg-finance-steel/20`}
              role="menuitem"
            >
              {t('languageSwitcher.en')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
