
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
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
              {i18n.language === 'en' ? 'EN' : 'FR'}
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
                i18n.language === 'fr' ? 'text-finance-accent' : 'text-finance-offwhite'
              } hover:bg-finance-steel/20`}
              role="menuitem"
            >
              {t('languageSwitcher.fr')}
            </button>
            <button
              onClick={() => changeLanguage('en')}
              className={`w-full text-left px-4 py-2 text-sm ${
                i18n.language === 'en' ? 'text-finance-accent' : 'text-finance-offwhite'
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
