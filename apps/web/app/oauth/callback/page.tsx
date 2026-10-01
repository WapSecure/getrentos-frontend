'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { saveAuthSession } from '@/lib/authStorage';
import { ROUTES, getDashboardRoute, BACKEND_ROLE_TO_ID } from '@/lib/constants/auth';
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
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  // Google proved who you are, but your account also has an authenticator app:
  // the backend sent a short-lived challenge instead of a session.
  const challenge = searchParams.get('challenge_token');
  const refusal = searchParams.get('error');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const openSession = (accessToken: string, me: MeResponse) => {
    const primaryRoleId = BACKEND_ROLE_TO_ID[me.roles[0]] || 'renter';
    // Session-only by default (refresh token is an httpOnly session cookie)
    //: consistent with an unchecked "Remember me" checkbox.
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
    // Refused (e.g. a suspended account) or waiting on a 2FA code: nothing to exchange.
    if (refusal) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(refusal);
      return;
    }
    if (challenge) return;

    // The backend delivers the access token in the URL and the refresh token
    // in an httpOnly cookie (not visible here).
    const accessToken = searchParams.get('access_token');

    if (!accessToken) {
      setError('OAuth sign-in failed: missing token. Please try again.');
      return;
    }

    const complete = async () => {
      try {
        // Fetch the authenticated profile so the session has the full user.
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
          className="bg-card rounded-2xl border border-border p-8 max-w-sm w-full shadow-[0_16px_40px_rgba(0,0,0,0.08)] space-y-4"
        >
          <div className="text-center">
            <ShieldCheck className="w-8 h-8 text-primary mx-auto mb-3" />
            <h1 className="text-lg font-semibold text-foreground">Two-factor authentication</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter the 6-digit code from your authenticator app to finish signing in.
            </p>
          </div>
          <input
            aria-label="Authentication code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center font-mono text-lg tracking-[0.5em] text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="••••••"
          />
          {error && (
            <p role="alert" className="text-sm text-destructive text-center">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={code.length !== 6 || verifying}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
          >
            {verifying ? 'Verifying…' : 'Verify & sign in'}
          </button>
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
      <div className="bg-card rounded-2xl border border-border p-8 max-w-sm w-full text-center shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
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
          <>
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
            <h1 className="text-lg font-semibold text-foreground">Completing sign-in…</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Securely signing you into GetRentos.
            </p>
          </>
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
