import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { ThemeProvider, QueryProvider } from '@sureground/ui';
import { StepUpDialog } from '@/components/security/StepUpDialog';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sureground Backoffice',
  description: 'Internal operations console for Sureground staff.',
};

// Reads the proxy's per-request CSP nonce for the theme script; this makes every page dynamic.
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <html lang="en" suppressHydrationWarning>
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
