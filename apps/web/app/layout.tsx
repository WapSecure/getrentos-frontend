import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GetRentos - Trust-Driven Property Operating System',
  description: 'One workspace for renters, landlords, owners, buyers, realtors and agents.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#f5f7fa] dark:bg-[#0a1a1f]`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
