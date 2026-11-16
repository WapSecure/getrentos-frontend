import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AuthMotion } from '@/components/auth/AuthMotion';

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthMotion>{children}</AuthMotion>;
}
