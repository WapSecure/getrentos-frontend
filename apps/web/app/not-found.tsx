'use client';

import { useState, useEffect } from 'react';
import { Home, ArrowLeft, Compass } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { AnimatedParticles } from '@/components/ui/AnimatedParticles';
import { ROUTES, isAuthenticated, getUserRole, getDashboardRoute } from '@/lib/constants/auth';

export default function NotFound() {
  const [primaryHref, setPrimaryHref] = useState<string>(ROUTES.HOME);
  const [primaryLabel, setPrimaryLabel] = useState('Back to Home');

  useEffect(() => {
    if (isAuthenticated()) {
      const role = getUserRole();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrimaryHref(getDashboardRoute(role || 'renter'));
      setPrimaryLabel('Back to Dashboard');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-[#0a1a1f] dark:to-[#0d2a2f] flex flex-col items-center justify-center relative px-6">
      <AnimatedParticles />

      <div className="relative z-10 mb-8">
        <Logo size="lg" />
      </div>

      <div className="relative z-10 text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#c4a747]/10 mb-6">
          <Compass className="w-8 h-8 text-[#c4a747]" />
        </div>

        <p className="text-7xl font-bold bg-gradient-to-r from-[#c4a747] to-[#e8d5a3] bg-clip-text text-transparent tracking-tight">
          404
        </p>
        <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">Page not found</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button href={primaryHref} variant="primary" className="gap-2 w-full sm:w-auto">
            <Home className="w-4 h-4" />
            {primaryLabel}
          </Button>
          <Button
            variant="outline"
            className="gap-2 w-full sm:w-auto"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
