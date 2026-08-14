'use client';

import { Chrome } from 'lucide-react';
import { authService } from '@/services/authService';

/**
 * OAuth sign-in entry point. Redirects the browser to the backend, which
 * performs the provider flow (real Google when credentials exist, or the
 * dev-simulated consent screen otherwise) and finally redirects to
 * /oauth/callback with fresh tokens.
 */
export const OAuthSignIn = () => {
  const handleGoogle = () => {
    window.location.href = authService.oauthUrl('google');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          or continue with
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        onClick={handleGoogle}
        className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-all hover:border-foreground/25 hover:bg-secondary focus:outline-none focus:ring-4 focus:ring-primary/12"
      >
        <Chrome className="w-5 h-5" />
        Continue with Google
      </button>

      <p className="text-xs text-muted-foreground text-center">
        By continuing you agree to our Terms & Privacy Policy.
      </p>
    </div>
  );
};
