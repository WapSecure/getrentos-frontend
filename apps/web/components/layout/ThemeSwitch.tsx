'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { IconButton } from '@getrentos/ui';

const className =
  'h-10 w-10 rounded-full border border-border bg-secondary text-foreground backdrop-blur-sm hover:bg-foreground/[0.08] hover:text-foreground';

/**
 * The light/dark switch for the public pages. The shared ThemeToggle animates with
 * framer-motion and renders nothing until it mounts, so the buttons beside it
 * jumped when it appeared. This one keeps its space from the first paint and needs
 * no animation library.
 */
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
