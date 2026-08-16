'use client';

import { useState } from 'react';
import { Palette, Moon, Sun, Monitor, Check } from 'lucide-react';
import { Button } from '@getrentos/ui';

export const ThemeSettings = () => {
  const [theme, setTheme] = useState('system');

  const themes = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Theme Settings</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Choose your preferred theme for the application
      </p>

      <div className="grid grid-cols-3 gap-4">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isSelected = theme === themeOption.id;
          return (
            <button
              key={themeOption.id}
              onClick={() => setTheme(themeOption.id)}
              className={`p-4 rounded-xl border-2 transition-all ${
                isSelected ? 'border-primary bg-accent' : 'border-border hover:border-gray-300'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Icon className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-gray-500'}`} />
                <span
                  className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}
                >
                  {themeOption.label}
                </span>
                {isSelected && <Check className="w-4 h-4 text-primary" />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          💡 Changes will be applied immediately to your browsing experience.
        </p>
      </div>

      <Button variant="primary" className="mt-4">
        Save Theme
      </Button>
    </div>
  );
};
