import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { Manrope, Newsreader } from 'next/font/google';
import { ThemeProvider } from '@sureground/ui/providers/ThemeProvider';
import { WebQueryProvider } from '@/components/providers/WebQueryProvider';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { StepUpDialog } from '@/components/shared/security/StepUpDialog';
import { SiteMeasurement } from '@/components/analytics/SiteMeasurement';
import {
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_URL,
  SITE_OG_IMAGE,
  SITE_TWITTER_HANDLE,
} from '@/lib/site';
import './globals.css';

// @sureground/ui reads --font-manrope into --font-ui and --font-newsreader into --font-serif.
const manrope = Manrope({ subsets: ['latin'], display: 'swap', variable: '--font-manrope' });
const newsreader = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500'],
  // No italic: nothing sets the serif in italics, and every style is another preloaded file on every page.
  style: ['normal'],
  variable: '--font-newsreader',
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
    'protected payments',
    'property verification',
  ],
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
    { media: '(prefers-color-scheme: light)', color: '#f8f7f5' },
    { media: '(prefers-color-scheme: dark)', color: '#111216' },
  ],
  width: 'device-width',
  initialScale: 1,
};

// Reads only the CSP nonce header, which makes every page dynamic: unavoidable with a nonce-based CSP.
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${newsreader.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-background antialiased">
        <ThemeProvider nonce={nonce}>
          <WebQueryProvider>
            <LanguageProvider>
              {children}
              <StepUpDialog />
              <SiteMeasurement />
            </LanguageProvider>
          </WebQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
