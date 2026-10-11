'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2, UserPlus } from 'lucide-react';
import { isAuthenticated, getStoredUser } from '@/lib/authStorage';
import { ROUTES, getDashboardRoute, BACKEND_ROLE_TO_ID } from '@/lib/constants/auth';
import { agencyOwnerInviteService } from '@/services/agencyOwnerInviteService';
import { Logo } from '@/components/ui/Logo';

type Phase = 'loading' | 'needs-auth' | 'claiming' | 'done' | 'error';

function dashboardHref(): string {
  try {
    const user = getStoredUser<{ roles?: string[]; role?: string }>();
    const backend = user?.roles?.[0];
    const roleId = (backend && BACKEND_ROLE_TO_ID[backend]) || user?.role || 'renter';
    return getDashboardRoute(roleId);
  } catch {
    return '/';
  }
}

function ClaimContent() {
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>('loading');
  const [firm, setFirm] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const run = async () => {
      const token = searchParams.get('token');
      if (!token) {
        setPhase('error');
        setMessage('This invitation link is invalid.');
        return;
      }
      const info = await agencyOwnerInviteService.claimInfo(token);
      if (!info.success || !info.data) {
        setPhase('error');
        setMessage(info.message || 'This invitation is not valid.');
        return;
      }
      setFirm(info.data.organizationName);
      setEmail(info.data.email);

      if (info.data.status === 'CLAIMED') {
        setPhase('done');
        return;
      }
      if (info.data.status === 'REVOKED') {
        setPhase('error');
        setMessage('This invitation was withdrawn by the firm.');
        return;
      }
      if (info.data.status === 'EXPIRED' || info.data.expired) {
        setPhase('error');
        setMessage('This invitation has expired. Ask the firm to send a new one.');
        return;
      }

      // PENDING
      if (!isAuthenticated()) {
        setPhase('needs-auth');
        return;
      }
      setPhase('claiming');
      const res = await agencyOwnerInviteService.claim(token);
      if (res.success) {
        setPhase('done');
      } else {
        setPhase('error');
        setMessage(res.message || 'We could not accept this invitation.');
      }
    };

    void run();
  }, [searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="mb-8">
        <Logo size="lg" />
      </div>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
        {phase === 'loading' || phase === 'claiming' ? (
          <>
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
            <h1 className="text-lg font-semibold text-foreground">
              {phase === 'claiming' ? 'Accepting…' : 'Loading your invitation…'}
            </h1>
          </>
        ) : phase === 'done' ? (
          <>
            <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-lg font-semibold text-foreground">You’re all set</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              You’ve accepted {firm || 'the firm'}’s invitation. They can now set up management for
              your property.
            </p>
            <a
              href={dashboardHref()}
              className="mt-4 inline-block text-sm font-medium text-primary hover:text-primary-hover"
            >
              Go to your dashboard
            </a>
          </>
        ) : phase === 'needs-auth' ? (
          <>
            <UserPlus className="mx-auto mb-3 h-8 w-8 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">
              {firm} invited you to GetRentos
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create an account or sign in with <strong>{email}</strong> to accept, then open this
              invitation link again.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <a
                href={`${ROUTES.SIGNUP}?email=${encodeURIComponent(email)}`}
                className="inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Create an account
              </a>
              <a
                href={ROUTES.LOGIN}
                className="inline-block text-sm font-medium text-primary hover:text-primary-hover"
              >
                I already have an account
              </a>
            </div>
          </>
        ) : (
          <>
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
            <h1 className="text-lg font-semibold text-foreground">Invitation unavailable</h1>
            <p className="mt-1 text-sm text-muted-foreground">{message}</p>
            <a
              href={ROUTES.LOGIN}
              className="mt-4 inline-block text-sm font-medium text-primary hover:text-primary-hover"
            >
              Go to sign in
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function AgencyInviteClaimPage() {
  return (
    <Suspense fallback={null}>
      <ClaimContent />
    </Suspense>
  );
}
