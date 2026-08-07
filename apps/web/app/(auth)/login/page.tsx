'use client';

import { useState } from 'react';
import { AnimatedParticles } from '@/components/ui/AnimatedParticles';
import { SignInLeftContent } from '@/components/auth/SignIn/SignInLeftContent';
import { SignInRightContent } from '@/components/auth/SignIn/SignInRightContent';

export type SignInMethod = 'email' | 'phone' | 'magic-link';

export default function SignInPage() {
  const [method, setMethod] = useState<SignInMethod>('email');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-[#0a1a1f] dark:to-[#0d2a2f] flex relative">
      <AnimatedParticles />
      <SignInLeftContent />
      <SignInRightContent method={method} setMethod={setMethod} />
    </div>
  );
}
