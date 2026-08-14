'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Chrome } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Dev-simulated Google consent screen. Real OAuth credentials are not
 * configured in development, so the backend points the browser here to
 * mimic the provider's consent step; the button "signs in" with a fake
 * Google code so the full OAuth journey is still exercised end-to-end.
 */
export default function GoogleOAuthDevConsent() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleConsent = () => {
    setSubmitting(true);
    router.push(`${API_BASE_URL}/auth/oauth/google/callback?code=dev-google-code`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="bg-card rounded-2xl border border-border p-8 max-w-sm w-full shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-center gap-2 mb-5">
          <Chrome className="w-7 h-7 text-primary" />
          <span className="text-xl font-semibold text-foreground">Sign in with Google</span>
        </div>

        <div className="rounded-xl bg-accent/60 border border-primary/15 p-4 text-sm text-muted-foreground mb-6">
          <p className="font-medium text-foreground mb-1">Development mode</p>
          <p>
            No real Google credentials are configured, so this screen simulates Google&apos;s
            consent page. Signing in creates a demo OAuth account to verify the flow end-to-end.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleConsent}
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-card border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-60"
          >
            <Chrome className="w-4 h-4 text-primary" />
            {submitting ? 'Continuing…' : 'Continue as OAuth Dev User'}
          </button>
          <a
            href="/login"
            className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel and go back
          </a>
        </div>
      </div>
    </div>
  );
}
