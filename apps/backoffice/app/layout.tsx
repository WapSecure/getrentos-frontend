import type { Metadata } from 'next';
import { ThemeProvider, QueryProvider } from '@getrentos/ui';
import './globals.css';

export const metadata: Metadata = {
  title: 'GetRentos Backoffice',
  description: 'Internal operations console for GetRentos staff.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background">
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
