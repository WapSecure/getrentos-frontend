import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import { ThemeProvider } from '@getrentos/ui/providers/ThemeProvider';
import { QueryProvider } from '@getrentos/ui/providers/QueryProvider';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import {
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_URL,
  SITE_OG_IMAGE,
  SITE_TWITTER_HANDLE,
} from '@/lib/site';
import './globals.css';

// The shared UI theme resolves typography through the `--font-ui` CSS variable
// (see packages/ui/src/styles/index.css), so next/font is wired directly to it
// — no duplicate font stacks, no layout shift from late-loaded fonts.
const geist = Geist({
  subsets: ['latin'],
  variable: '--font-ui',
  display: 'swap',
});

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
    'escrow payments',
    'property verification',
  ],
  alternates: {
    canonical: '/',
    // Both locales (en + Nigerian Pidgin) share the same URL — the language
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
 * This layout must not read request data (cookies, headers). Doing so makes every
 * page in the app dynamic — rendered per visitor, sent `no-store`, and impossible
 * to serve from a CDN — including the public marketing and marketplace pages.
 * The saved language is therefore restored in the browser by LanguageProvider.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={geist.variable}>
      <body className="bg-background antialiased">
        <ThemeProvider>
          <QueryProvider>
            <LanguageProvider>{children}</LanguageProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
