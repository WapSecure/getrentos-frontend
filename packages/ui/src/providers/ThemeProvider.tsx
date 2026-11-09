'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { migrateLegacyBrowserStorage } from '@sureground/shared';

// Runs first, so GetRentos-era storage keys move to their Sureground names before anything reads them.
migrateLegacyBrowserStorage();

// Under the apps' nonce-based CSP, next-themes' inline script only runs with the request's nonce.
export function ThemeProvider({ children, nonce }: { children: React.ReactNode; nonce?: string }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      themes={['light', 'dark', 'system']}
      nonce={nonce}
    >
      {children}
    </NextThemesProvider>
  );
}
