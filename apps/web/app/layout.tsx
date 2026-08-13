import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'GetRentos - Trust-Driven Property Operating System',
  description: 'One workspace for renters, landlords, owners, buyers, realtors and agents.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background">
        <ThemeProvider>
          <QueryProvider>
            <LanguageProvider>{children}</LanguageProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
