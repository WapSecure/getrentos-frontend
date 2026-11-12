import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Manrope, Newsreader } from 'next/font/google';
import { ThemeProvider, QueryProvider } from '@sureground/ui';
import { StepUpDialog } from '@/components/security/StepUpDialog';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sureground Backoffice',
  description: 'Internal operations console for Sureground staff.',
};

const manrope = Manrope({ subsets: ['latin'], display: 'swap', variable: '--font-manrope' });
const newsreader = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500'],
  variable: '--font-newsreader',
});

// Reads the proxy's per-request CSP nonce for the theme script; this makes every page dynamic.
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${newsreader.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-background">
        <ThemeProvider nonce={nonce}>
          <QueryProvider loginPath="/admin/login">
            {children}
            <StepUpDialog />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
