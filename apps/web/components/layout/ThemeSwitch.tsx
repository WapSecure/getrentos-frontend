'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from '@sureground/icons';
import { IconButton } from '@sureground/ui/IconButton';

const className = 'h-10 w-10 rounded-md text-foreground hover:bg-secondary hover:text-foreground';

// Not the shared ThemeToggle: that renders nothing until mounted, so the buttons beside it jumped.
export const ThemeSwitch = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return <span className={`block shrink-0 ${className}`} aria-hidden="true" />;

  const isDark = (resolvedTheme || theme) === 'dark';
  return (
    <IconButton
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      label="Toggle theme"
      className={className}
      icon={isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    />
  );
};
