'use client';

import { useState } from 'react';
import { ThemeToggle } from '@sureground/ui';
import { AuthAside } from '@/components/auth/AuthAside';
import { SignInRightContent } from '@/components/auth/SignIn/SignInRightContent';

export type SignInMethod = 'email' | 'phone' | 'magic-link';

export default function SignInPage() {
  const [method, setMethod] = useState<SignInMethod>('email');

  return (
    <main className="relative flex min-h-screen bg-background">
      <div className="fixed right-4 top-4 z-30 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <AuthAside variant="signin" />
      <SignInRightContent method={method} setMethod={setMethod} />
    </main>
  );
}
