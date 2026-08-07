'use client';

import { useState } from 'react';
import { Palette, Moon, Sun, Monitor, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const ThemeSettings = () => {
  const [theme, setTheme] = useState('system');

  const themes = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Theme Settings</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
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
                isSelected
                  ? 'border-[#c4a747] bg-[#c4a747]/10'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Icon className={`w-6 h-6 ${isSelected ? 'text-[#c4a747]' : 'text-gray-500'}`} />
                <span
                  className={`text-sm font-medium ${isSelected ? 'text-[#c4a747]' : 'text-gray-700 dark:text-gray-300'}`}
                >
                  {themeOption.label}
                </span>
                {isSelected && <Check className="w-4 h-4 text-[#c4a747]" />}
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
