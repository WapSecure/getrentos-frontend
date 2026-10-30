import type { Metadata } from 'next';
import { ThemeProvider, QueryProvider } from '@getrentos/ui';
import { StepUpDialog } from '@/components/security/StepUpDialog';
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
          <QueryProvider loginPath="/admin/login">
            {children}
            <StepUpDialog />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
