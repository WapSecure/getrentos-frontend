'use client';

import { AnimatedParticles } from '@getrentos/ui';
import { ThemeToggle } from '@getrentos/ui';
import { AdminSignInForm } from '@/components/auth/AdminSignIn/AdminSignInForm';

// The customer app is a separate origin (its own app in the monorepo), so this
// is a cross-origin link rather than a Next.js <Link>.
const WEB_APP_URL = process.env.NEXT_PUBLIC_WEB_APP_URL || 'http://localhost:3000';

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
          <a href={`${WEB_APP_URL}/login`} className="text-primary hover:underline">
            Use the user sign-in
          </a>
        </p>
      </div>
    </div>
  );
}
