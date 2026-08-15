'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { saveAuthSession } from '@/lib/authStorage';
import { getDashboardRoute, BACKEND_ROLE_TO_ID } from '@/lib/constants/auth';
import { apiFetch } from '@/lib/apiClient';

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

  useEffect(() => {
    // The backend delivers the access token in the URL and the refresh token
    // in an httpOnly cookie (not visible here).
    const accessToken = searchParams.get('access_token');

    if (!accessToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('OAuth sign-in failed: missing token. Please try again.');
      return;
    }

    const complete = async () => {
      try {
        // Fetch the authenticated profile so the session has the full user.
        const me = await apiFetch<MeResponse>('/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const primaryRoleId = BACKEND_ROLE_TO_ID[me.roles[0]] || 'renter';

        // Session-only by default (refresh token is an httpOnly session cookie)
        // — consistent with an unchecked "Remember me" checkbox.
        saveAuthSession(
          {
            accessToken,
            user: {
              ...me,
              fullName: me.legalName,
              role: primaryRoleId,
              roles: me.roles,
            },
          },
          false
        );

        router.replace(getDashboardRoute(primaryRoleId));
      } catch {
        setError('Could not complete OAuth sign-in. Please try again.');
      }
    };

    void complete();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="bg-card rounded-2xl border border-border p-8 max-w-sm w-full text-center shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
        {error ? (
          <>
            <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
            <h1 className="text-lg font-semibold text-foreground">Sign-in failed</h1>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <a
              href="/login"
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
