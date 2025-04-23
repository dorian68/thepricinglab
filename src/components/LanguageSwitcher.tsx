
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { safeTranslate } from '../utils/translationUtils';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const st = (key: string, defaultValue: string) => safeTranslate(t, key, defaultValue);

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    // Force reload translations after language change
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={st('languageSwitcher.switchLanguage', 'Switch Language')}>
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => changeLanguage('en')}>
          {st('languageSwitcher.en', 'English')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => changeLanguage('fr')}>
          {st('languageSwitcher.fr', 'Français')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
