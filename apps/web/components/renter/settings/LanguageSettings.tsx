'use client';

import { Globe } from 'lucide-react';
import { RadioGroup } from '@getrentos/ui';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export const LanguageSettings = () => {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { id: 'en', label: 'English', native: 'English' },
    { id: 'pcm', label: 'Nigerian Pidgin', native: 'Pidgin' },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Language Settings</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Choose your preferred language for the application
      </p>

      <RadioGroup
        value={language}
        onValueChange={(value) => setLanguage(value as 'en' | 'pcm')}
        variant="card"
        options={languages.map((lang) => ({
          value: lang.id,
          label: lang.label,
          description: lang.native,
          icon: <Globe className="w-4 h-4" />,
        }))}
      />
    </div>
  );
};
