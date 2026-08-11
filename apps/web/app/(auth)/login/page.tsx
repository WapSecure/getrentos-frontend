'use client';

import { useState } from 'react';
import { AnimatedParticles } from '@/components/ui/AnimatedParticles';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SignInLeftContent } from '@/components/auth/SignIn/SignInLeftContent';
import { SignInRightContent } from '@/components/auth/SignIn/SignInRightContent';

export type SignInMethod = 'email' | 'phone' | 'magic-link';

export default function SignInPage() {
  const [method, setMethod] = useState<SignInMethod>('email');

  return (
    <div className="min-h-screen bg-background flex relative">
      <AnimatedParticles />
      <div className="fixed top-6 right-6 z-20">
        <ThemeToggle />
      </div>
      <SignInLeftContent />
      <SignInRightContent method={method} setMethod={setMethod} />
    </div>
  );
}
