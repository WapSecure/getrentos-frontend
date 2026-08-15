'use client';

import { ROUTES } from '@/lib/constants/auth';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#f5f7fa] dark:bg-background">
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6">
            <span className="text-2xl font-bold text-background">!</span>
          </div>

          <p className="text-6xl font-bold text-primary">500</p>
          <h1 className="mt-3 text-2xl font-bold text-foreground">Something went wrong</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
            GetRentos hit an unexpected error and couldn&apos;t load this page.
          </p>

          {error.digest && (
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-600 font-mono">
              Error reference: {error.digest}
            </p>
          )}

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={reset}
              className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:bg-primary-hover transition-colors"
            >
              Try Again
            </button>
            {/* global-error replaces the root layout, so next/link's router context can't be relied on here */}
            <a
              href={ROUTES.HOME}
              className="px-6 py-2.5 rounded-full border-2 border-gray-300 dark:border-white/30 text-foreground font-medium text-sm hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
