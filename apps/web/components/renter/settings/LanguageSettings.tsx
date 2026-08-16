'use client';

import { Globe, Check } from 'lucide-react';
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

      <div className="space-y-2">
        {languages.map((lang) => {
          const isSelected = language === lang.id;
          return (
            <button
              key={lang.id}
              onClick={() => setLanguage(lang.id as 'en' | 'pcm')}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                isSelected ? 'border-primary bg-accent' : 'border-border hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Globe className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-gray-400'}`} />
                <div className="text-left">
                  <p
                    className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}
                  >
                    {lang.label}
                  </p>
                  <p className="text-xs text-gray-500">{lang.native}</p>
                </div>
              </div>
              {isSelected && <Check className="w-4 h-4 text-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
