import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { Geist } from 'next/font/google';
import { ThemeProvider, QueryProvider } from '@getrentos/ui';
import { LanguageProvider, LANGUAGE_COOKIE_KEY } from '@/lib/i18n/LanguageContext';
import type { Language } from '@/lib/i18n/translations';
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read the language cookie server-side so pcm users get localized copy on
  // first paint instead of an English flash (client-side localStorage sync is
  // handled inside LanguageProvider).
  const cookieStore = await cookies();
  const cookieLanguage = cookieStore.get(LANGUAGE_COOKIE_KEY)?.value;
  const initialLanguage: Language = cookieLanguage === 'pcm' ? 'pcm' : 'en';

  return (
    <html lang={initialLanguage} suppressHydrationWarning className={geist.variable}>
      <body className="bg-background antialiased">
        <ThemeProvider>
          <QueryProvider>
            <LanguageProvider initialLanguage={initialLanguage}>{children}</LanguageProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
