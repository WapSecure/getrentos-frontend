'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * `nonce` is the request's Content-Security-Policy nonce: next-themes renders a
 * small inline script that applies the saved theme before paint, and under the
 * apps' nonce-based CSP it only runs when it carries that nonce.
 */
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
