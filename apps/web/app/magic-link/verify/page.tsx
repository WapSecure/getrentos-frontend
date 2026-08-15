'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { saveAuthSession } from '@/lib/authStorage';
import { ROUTES, getDashboardRoute, BACKEND_ROLE_TO_ID } from '@/lib/constants/auth';
import { authService } from '@/services/authService';

function MagicLinkVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const redirectTo = searchParams.get('redirectTo');

    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('This sign-in link is invalid. Please request a new one.');
      return;
    }

    const verify = async () => {
      const response = await authService.verifyMagicLink(token);
      if (response.success && response.data) {
        const { accessToken, ...user } = response.data;
        const primaryRoleId = BACKEND_ROLE_TO_ID[user.roles[0]] || 'renter';

        // Magic-link sign-in is session-only by default (the refresh token is
        // an httpOnly session cookie) — consistent with an unchecked
        // "Remember me" checkbox.
        saveAuthSession(
          {
            accessToken,
            user: { ...user, fullName: user.legalName, role: primaryRoleId },
          },
          false
        );

        router.replace(
          redirectTo && redirectTo.startsWith('/') ? redirectTo : getDashboardRoute(primaryRoleId)
        );
      } else {
        setError(response.message || 'This sign-in link is invalid or has expired.');
      }
    };

    void verify();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="bg-card rounded-2xl border border-border p-8 max-w-sm w-full text-center shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
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
          <>
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
            <h1 className="text-lg font-semibold text-foreground">Signing you in…</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Verifying your secure sign-in link.
            </p>
          </>
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
