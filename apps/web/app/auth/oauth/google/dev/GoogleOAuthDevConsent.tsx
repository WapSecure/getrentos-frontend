'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Chrome } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { ROUTES } from '@/lib/constants/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function ConsentScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  const handleConsent = () => {
    setSubmitting(true);
    const state = searchParams.get('state');
    const params = new URLSearchParams({ code: 'dev-google-code' });
    if (state) params.set('state', state);
    router.push(`${API_BASE_URL}/auth/oauth/google/callback?${params.toString()}`);
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
          <p>This local-only screen creates a test account so the OAuth flow can be verified.</p>
        </div>
        <div className="space-y-3">
          <Button
            variant="outline"
            size="lg"
            rounded="lg"
            fullWidth
            onClick={handleConsent}
            isLoading={submitting}
            loadingText="Continuing…"
            icon={<Chrome className="w-4 h-4 text-primary" />}
          >
            Continue as test user
          </Button>
          <a
            href={ROUTES.LOGIN}
            className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel and go back
          </a>
        </div>
      </div>
    </div>
  );
}

export function GoogleOAuthDevConsent() {
  return (
    <Suspense fallback={null}>
      <ConsentScreen />
    </Suspense>
  );
}
