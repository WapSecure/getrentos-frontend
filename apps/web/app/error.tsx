'use client';

import { useEffect } from 'react';
import { RefreshCcw, Home, AlertTriangle } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { AnimatedParticles } from '@/components/ui/AnimatedParticles';
import { ROUTES } from '@/lib/constants/auth';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-[#0a1a1f] dark:to-[#0d2a2f] flex flex-col items-center justify-center relative px-6">
      <AnimatedParticles />

      <div className="relative z-10 mb-8">
        <Logo size="lg" />
      </div>

      <div className="relative z-10 text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>

        <p className="text-7xl font-bold bg-gradient-to-r from-[#c4a747] to-[#e8d5a3] bg-clip-text text-transparent tracking-tight">
          500
        </p>
        <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          An unexpected error occurred on our end. Please try again, and reach out if the problem
          persists.
        </p>

        {error.digest && (
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-600 font-mono">
            Error reference: {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button variant="primary" className="gap-2 w-full sm:w-auto" onClick={reset}>
            <RefreshCcw className="w-4 h-4" />
            Try Again
          </Button>
          <Button href={ROUTES.HOME} variant="outline" className="gap-2 w-full sm:w-auto">
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
