'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from '@sureground/icons';
import { saveAuthSession } from '@/lib/authStorage';
import { ROUTES, getDashboardRoute, resolvePrimaryRoleId } from '@/lib/constants/auth';
import { authService } from '@/services/authService';
import { safeNextPath } from '@/lib/nextPath';
import { Logo } from '@/components/ui/Logo';

function MagicLinkVerifyContent() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    // The token is single-use: read it once, then take it out of the address bar and history.
    if (started.current) return;
    started.current = true;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const redirectTo = params.get('redirectTo');
    if (window.location.search) window.history.replaceState(null, '', window.location.pathname);

    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('This sign-in link is invalid. Please request a new one.');
      return;
    }

    const verify = async () => {
      const response = await authService.verifyMagicLink(token);
      const data = response.success ? response.data : undefined;
      if (data && 'requiresTwoFactor' in data) {
        // The link replaces the password only; the authenticator code is still owed.
        window.location.replace(
          `/oauth/callback#${new URLSearchParams({ challenge_token: data.challengeToken })}`
        );
        return;
      }
      if (data) {
        const { accessToken, ...user } = data;
        const primaryRoleId = resolvePrimaryRoleId(user.roles);

        // Session-only: the refresh token is an httpOnly session cookie, as with "Remember me" unchecked.
        saveAuthSession(
          {
            accessToken,
            user: { ...user, fullName: user.legalName, role: primaryRoleId },
          },
          false
        );

        router.replace(safeNextPath(redirectTo) ?? getDashboardRoute(primaryRoleId));
      } else {
        setError(response.message || 'This sign-in link is invalid or has expired.');
      }
    };

    void verify();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="mb-8">
        <Logo size="lg" />
      </div>
      <div className="bg-card rounded-2xl border border-border p-8 max-w-sm w-full text-center shadow-lg">
        {error ? (
          <>
            <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
            <h1 className="text-lg font-semibold text-foreground">Link invalid or expired</h1>
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
            <h1 className="text-lg font-semibold text-foreground">Signing you in…</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Verifying your secure sign-in link.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MagicLinkVerifyPage() {
  return (
    <Suspense fallback={null}>
      <MagicLinkVerifyContent />
    </Suspense>
  );
}
