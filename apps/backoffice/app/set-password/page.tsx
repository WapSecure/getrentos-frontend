import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ThemeToggle } from '@sureground/ui';
import { SetStaffPasswordForm } from '@/components/auth/SetStaffPasswordForm';

export const metadata: Metadata = {
  title: 'Set your password',
  robots: { index: false, follow: false },
};

export default function SetStaffPasswordPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="fixed top-6 right-6 z-20">
        <ThemeToggle />
      </div>
      {/* useSearchParams (the link's token) needs a Suspense boundary. */}
      <Suspense fallback={null}>
        <SetStaffPasswordForm />
      </Suspense>
    </div>
  );
}
