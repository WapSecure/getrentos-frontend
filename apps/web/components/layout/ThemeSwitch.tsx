'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

const className =
  'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-gray-200 backdrop-blur-sm transition-colors duration-200 hover:bg-gray-300 dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/20';

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

  if (!mounted) return <span className={className} aria-hidden="true" />;

  const isDark = (resolvedTheme || theme) === 'dark';
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
      className={className}
    >
      {isDark ? (
        <Moon className="h-4 w-4 text-gray-900 dark:text-white" />
      ) : (
        <Sun className="h-4 w-4 text-gray-900 dark:text-white" />
      )}
    </button>
  );
};
