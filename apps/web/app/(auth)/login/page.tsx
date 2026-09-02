'use client';

import { useState } from 'react';
import { ThemeToggle } from '@getrentos/ui';
import { SignInLeftContent } from '@/components/auth/SignIn/SignInLeftContent';
import { SignInRightContent } from '@/components/auth/SignIn/SignInRightContent';

export type SignInMethod = 'email' | 'phone' | 'magic-link';

export default function SignInPage() {
  const [method, setMethod] = useState<SignInMethod>('email');

  return (
    <div className="relative flex min-h-screen bg-background">
      {/* Ambient canvas: soft radial glows (form side stays clean + airy). */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(70%_50%_at_100%_0%,rgba(0,113,227,0.1),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(50%_40%_at_0%_100%,rgba(0,113,227,0.05),transparent_60%)]" />
      </div>
      <div className="fixed top-6 right-6 z-20">
        <ThemeToggle />
      </div>
      <SignInLeftContent />
      <SignInRightContent method={method} setMethod={setMethod} />
    </div>
  );
}
