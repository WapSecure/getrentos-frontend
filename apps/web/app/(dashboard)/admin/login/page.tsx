'use client';

import Link from 'next/link';
import { AnimatedParticles } from '@/components/ui/AnimatedParticles';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AdminSignInForm } from '@/components/auth/AdminSignIn/AdminSignInForm';
import { ROUTES } from '@/lib/constants/auth';

export default function AdminLoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <AnimatedParticles />
      <div className="fixed top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <AdminSignInForm />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Not an administrator?{' '}
          <Link href={ROUTES.LOGIN} className="text-primary hover:underline">
            Use the user sign-in
          </Link>
        </p>
      </div>
    </div>
  );
}
