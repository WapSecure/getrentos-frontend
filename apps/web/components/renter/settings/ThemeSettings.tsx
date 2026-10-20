'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Alert, RadioGroup } from '@getrentos/ui';

export const ThemeSettings = () => {
  const { theme, setTheme } = useTheme();

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

      <RadioGroup
        value={theme ?? ''}
        onValueChange={setTheme}
        variant="card"
        columns={3}
        options={themes.map((themeOption) => {
          const Icon = themeOption.icon;
          return {
            value: themeOption.id,
            label: themeOption.label,
            icon: <Icon className="w-5 h-5" />,
          };
        })}
      />

      <Alert variant="info" className="mt-6">
        Changes will be applied immediately to your browsing experience.
      </Alert>
    </div>
  );
};
