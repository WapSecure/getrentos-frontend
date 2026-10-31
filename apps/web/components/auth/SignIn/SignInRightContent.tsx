'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Fingerprint } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { EmailSignIn } from './methods/EmailSignIn';
import { PhoneSignIn } from './methods/PhoneSignIn';
import { MagicLinkSignIn } from './methods/MagicLinkSignIn';
import { OAuthSignIn } from './methods/OAuthSignIn';
import { SignInMethod } from '@/app/(auth)/login/page';
import { ROUTES } from '@/lib/constants/auth';
import { useToast, type ToastVariant } from '@getrentos/ui';
import { Button, SessionExpiredNotice } from '@getrentos/ui';
import { AuthMethodTabs } from '../AuthMethodTabs';
import { safeNextPath, withNext } from '@/lib/nextPath';

const noSubscribe = () => () => {};

interface SignInRightContentProps {
  method: SignInMethod;
  setMethod: (method: SignInMethod) => void;
}

export const SignInRightContent = ({ method, setMethod }: SignInRightContentProps) => {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState<number | null>(null);
  // Internal post-login destination, e.g. `/shortlets/abc` when the proxy
  // redirected here via `?next=`. Only same-origin paths are accepted.
  // The server renders without the query string, so hydrate from an empty one
  // and only then read the real URL; reading it during render made the two disagree.
  const search = useSyncExternalStore(
    noSubscribe,
    () => window.location.search,
    () => ''
  );
  const nextPath = useMemo(() => safeNextPath(new URLSearchParams(search).get('next')), [search]);
  // Sent here from an invitation link rather than from an expired session.
  const fromInvite = new URLSearchParams(search).get('reason') === 'invite';

  useEffect(() => {
    if (isLocked && lockoutTimer && lockoutTimer > 0) {
      const timer = setTimeout(() => {
        setLockoutTimer(lockoutTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isLocked && lockoutTimer === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLocked(false);
      setLoginAttempts(0);
      setLockoutTimer(null);
    }
  }, [isLocked, lockoutTimer]);

  const showToast = (message: string, variant: ToastVariant) => {
    toast.show(message, variant);
  };

  const handleLoginAttempt = () => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);

    if (newAttempts >= 5) {
      setIsLocked(true);
      setLockoutTimer(15 * 60);
      showToast('Too many failed attempts. Account locked for 15 minutes.', 'error');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const renderMethodComponent = () => {
    switch (method) {
      case 'email':
        return (
          <EmailSignIn
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            showToast={showToast}
            onLoginAttempt={handleLoginAttempt}
            isLocked={isLocked}
            lockoutTimer={lockoutTimer}
            nextPath={nextPath}
          />
        );
      case 'phone':
        return (
          <PhoneSignIn
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            showToast={showToast}
            onLoginAttempt={handleLoginAttempt}
            isLocked={isLocked}
            lockoutTimer={lockoutTimer}
            nextPath={nextPath}
          />
        );
      case 'magic-link':
        return (
          <MagicLinkSignIn
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            showToast={showToast}
          />
        );
      default:
        return null;
    }
  };

  return (
    <section className="relative z-10 flex w-full items-center justify-center px-4 py-20 sm:px-8 lg:w-1/2 lg:px-12 lg:py-16">
      <div className="w-full max-w-[30rem] rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.28)] backdrop-blur-xl sm:p-9 dark:shadow-[0_24px_80px_-32px_rgba(0,0,0,0.7)]">
        {/* Back Button */}
        <Button
          variant="outline"
          rounded="lg"
          onClick={handleBack}
          aria-label="Go back"
          icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
          className="fixed left-4 top-4 z-30 min-h-11 bg-card/90 px-3 font-medium text-muted-foreground backdrop-blur sm:left-6 sm:top-6 lg:static lg:mb-8"
        >
          Back
        </Button>

        <div className="mb-8">
          <div className="mb-6 flex justify-center lg:hidden">
            <Logo size="md" />
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Secure account access
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Welcome back
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Sign in to manage your properties, payments, and conversations in one place.
          </p>
        </div>

        <SessionExpiredNotice />
        {fromInvite && (
          <div
            role="status"
            className="mb-4 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2 text-sm text-foreground"
          >
            Sign in with the email your invitation was sent to, or create an account with it, to
            open the invitation.
          </div>
        )}

        {/* Lockout Warning */}
        {isLocked && lockoutTimer && (
          <div className="mb-4 p-3 rounded-lg bg-warning-subtle border border-warning/20 text-warning text-sm flex items-center gap-2">
            <span>
              Account temporarily locked. Try again in {Math.floor(lockoutTimer / 60)}:
              {(lockoutTimer % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Method Selection */}
        <div className="mb-7">
          <AuthMethodTabs
            label="Choose a sign-in method"
            value={method}
            onChange={setMethod}
            tabs={[
              { value: 'email', label: 'Email', icon: Mail },
              { value: 'phone', label: 'Phone', icon: Phone },
              { value: 'magic-link', label: 'Magic link', icon: Fingerprint },
            ]}
          />
        </div>

        {/* Dynamic Form */}
        {renderMethodComponent()}

        {/* OAuth (Google) */}
        <div className="mt-5">
          <OAuthSignIn />
        </div>

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <a
              href={withNext(ROUTES.SIGNUP, nextPath)}
              className="font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Create one now
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};
