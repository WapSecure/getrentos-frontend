'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button, Field, NumberInput } from '@sureground/ui';
import { saveAuthSession } from '@/lib/authStorage';
import { ROUTES, getDashboardRoute, resolvePrimaryRoleId } from '@/lib/constants/auth';
import { apiFetch } from '@/lib/apiClient';
import { authService } from '@/services/authService';

interface MeResponse {
  id: string;
  email?: string;
  phone?: string;
  legalName: string;
  isVerified: boolean;
  roles: string[];
  trustScore: number;
}

function OAuthCallbackContent() {
  const router = useRouter();
  const query = useSearchParams();
  // Read the fragment once, then drop it from the address bar and history.
  const [searchParams] = useState(() => {
    const merged = new URLSearchParams(query.toString());
    if (typeof window !== 'undefined' && window.location.hash.length > 1) {
      new URLSearchParams(window.location.hash.slice(1)).forEach((value, key) =>
        merged.set(key, value)
      );
    }
    return merged;
  });
  useEffect(() => {
    if (window.location.hash || window.location.search) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);
  const [error, setError] = useState<string | null>(null);
  const challenge = searchParams.get('challenge_token');
  const refusal = searchParams.get('error');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const openSession = (accessToken: string, me: MeResponse) => {
    const primaryRoleId = resolvePrimaryRoleId(me.roles);
    // Session-only: the refresh token is an httpOnly session cookie, as with "Remember me" unchecked.
    saveAuthSession(
      {
        accessToken,
        user: { ...me, fullName: me.legalName, role: primaryRoleId, roles: me.roles },
      },
      false
    );
    router.replace(getDashboardRoute(primaryRoleId));
  };

  const verifyCode = async () => {
    if (!challenge || code.length !== 6) return;
    setVerifying(true);
    setError(null);
    const response = await authService.completeTwoFactorLogin(challenge, code);
    if (response.success && response.data) {
      openSession(response.data.accessToken, response.data);
      return;
    }
    setCode('');
    setVerifying(false);
    setError(response.message || 'That code is invalid or has expired. Try again.');
  };

  useEffect(() => {
    if (refusal) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(refusal);
      return;
    }
    if (challenge) return;

    // The refresh token arrives as an httpOnly cookie, not visible here.
    const accessToken = searchParams.get('access_token');

    if (!accessToken) {
      setError('OAuth sign-in failed: missing token. Please try again.');
      return;
    }

    const complete = async () => {
      try {
        const me = await apiFetch<MeResponse>('/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        openSession(accessToken, me);
      } catch {
        setError('Could not complete OAuth sign-in. Please try again.');
      }
    };

    void complete();
    // openSession only reads stable values; the effect runs per URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, searchParams, challenge, refusal]);

  if (challenge && !refusal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void verifyCode();
          }}
          className="bg-card rounded-2xl border border-border p-8 max-w-sm w-full shadow-lg space-y-4"
        >
          <div className="text-center">
            <ShieldCheck className="w-8 h-8 text-primary mx-auto mb-3" />
            <h1 className="text-lg font-semibold text-foreground">Two-factor authentication</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter the 6-digit code from your authenticator app to finish signing in.
            </p>
          </div>
          <Field label="Authentication code" error={error || undefined}>
            <NumberInput
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              value={code}
              onValueChange={(value) => setCode(value.slice(0, 6))}
              inputClassName="text-center font-mono text-lg tracking-[0.5em]"
              placeholder="••••••"
            />
          </Field>
          <Button
            type="submit"
            disabled={code.length !== 6}
            isLoading={verifying}
            loadingText="Verifying…"
            fullWidth
            size="lg"
            rounded="lg"
          >
            Verify & sign in
          </Button>
          <a
            href={ROUTES.LOGIN}
            className="block text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Back to sign in
          </a>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="bg-card rounded-2xl border border-border p-8 max-w-sm w-full text-center shadow-lg">
        {error ? (
          <>
            <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
            <h1 className="text-lg font-semibold text-foreground">Sign-in failed</h1>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <a
              href={ROUTES.LOGIN}
              className="inline-block mt-4 text-sm font-medium text-primary hover:text-primary-hover"
            >
              Back to sign in
            </a>
          </>
        ) : (
          <div role="status" aria-live="polite">
            <Loader2 className="w-8 h-8 text-primary animate-spin motion-reduce:animate-none mx-auto mb-3" />
            <h1 className="text-lg font-semibold text-foreground">Completing sign-in…</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Securely signing you into Sureground.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <OAuthCallbackContent />
    </Suspense>
  );
}
