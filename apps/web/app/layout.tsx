import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { Manrope } from 'next/font/google';
import { ThemeProvider } from '@sureground/ui/providers/ThemeProvider';
import { QueryProvider } from '@sureground/ui/providers/QueryProvider';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { StepUpDialog } from '@/components/shared/security/StepUpDialog';
import {
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_URL,
  SITE_OG_IMAGE,
  SITE_TWITTER_HANDLE,
} from '@/lib/site';
import './globals.css';

// Self-hosted at build time; @sureground/ui reads --font-manrope into --font-ui.
const manrope = Manrope({ subsets: ['latin'], display: 'swap', variable: '--font-manrope' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Trust-Driven Property Operating System`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'rent property',
    'property marketplace',
    'shortlet',
    'land marketplace',
    'renters',
    'landlords',
    'real estate Nigeria',
    'protected payments',
    'property verification',
  ],
  alternates: {
    canonical: '/',
    // Both locales (en + Nigerian Pidgin) share the same URL: the language
    // switch is a client-side preference, so only the default is advertised.
    languages: {
      'x-default': '/',
      en: '/',
    },
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Trust-Driven Property Operating System`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: SITE_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    site: SITE_TWITTER_HANDLE,
    title: `${SITE_NAME} - Trust-Driven Property Operating System`,
    description: SITE_DESCRIPTION,
    images: [SITE_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
};

/**
 * This layout reads one request header: the Content-Security-Policy nonce the
 * proxy (proxy.ts) generates per request, for the theme script. That makes
 * every page render dynamically, per visitor: unavoidable with a nonce-based
 * CSP, since a prerendered page would carry no nonce and its scripts would be
 * blocked. Keep it to that one header; the saved language is still restored in
 * the browser by LanguageProvider.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <html lang="en" className={manrope.variable} suppressHydrationWarning>
      <body className="bg-background antialiased">
        <ThemeProvider nonce={nonce}>
          <QueryProvider>
            <LanguageProvider>
              {children}
              <StepUpDialog />
            </LanguageProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
