'use client';

import { LanguageToggle as BaseLanguageToggle } from '@getrentos/ui';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { languageLabels, type Language } from '@/lib/i18n/translations';

const languages: Language[] = ['en', 'pcm'];

export const LanguageToggle = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <BaseLanguageToggle
      language={language}
      languages={languages.map((value) => ({ value, label: languageLabels[value] }))}
      onLanguageChange={(value) => setLanguage(value as Language)}
      ariaLabel={t('language.switch_language')}
    />
  );
};
