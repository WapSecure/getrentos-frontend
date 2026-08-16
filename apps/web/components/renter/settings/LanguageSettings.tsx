'use client';

import { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { Button } from '@getrentos/ui';

export const LanguageSettings = () => {
  const [language, setLanguage] = useState('en');

  const languages = [
    { id: 'en', label: 'English', native: 'English' },
    { id: 'es', label: 'Spanish', native: 'Español' },
    { id: 'fr', label: 'French', native: 'Français' },
    { id: 'de', label: 'German', native: 'Deutsch' },
    { id: 'pt', label: 'Portuguese', native: 'Português' },
    { id: 'zh', label: 'Chinese', native: '中文' },
    { id: 'ja', label: 'Japanese', native: '日本語' },
    { id: 'ar', label: 'Arabic', native: 'العربية' },
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
              onClick={() => setLanguage(lang.id)}
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

      <Button variant="primary" className="mt-4">
        Save Language
      </Button>
    </div>
  );
};
