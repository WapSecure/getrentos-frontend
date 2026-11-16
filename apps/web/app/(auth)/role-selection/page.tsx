'use client';

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from '@sureground/icons';
import { Alert, Button, Field, RadioGroup, ThemeToggle } from '@sureground/ui';
import { RoleCard } from '@/components/auth/RoleSelection/RoleCard';
import { Logo } from '@/components/ui/Logo';
import { useSignup } from '@/hooks/useSignup';
import { useSignupStore } from '@/lib/store/signupStore';
import { getStoredUser, isAuthenticated } from '@/lib/authStorage';
import { ROLES, ROUTES, getDashboardRoute, resolvePrimaryRoleId } from '@/lib/constants/auth';
import { isSocialSignupPending } from '@/lib/socialSignup';

const noSubscribe = () => () => {};

// Admin, gateman, resident and property manager are provisioned out of band, never offered at self-serve signup.
const ROLE_LIST = Object.values(ROLES)
  .filter(
    (role) =>
      role.id !== 'admin' &&
      role.id !== 'gateman' &&
      role.id !== 'resident' &&
      role.id !== 'manager'
  )
  .sort((a, b) => a.order - b.order);

const roleName = (id: string) => ROLE_LIST.find((role) => role.id === id)?.name ?? id;

function signedInDashboard(): string {
  const user = getStoredUser<{ roles?: string[] }>();
  return getDashboardRoute(resolvePrimaryRoleId(user?.roles));
}

export default function RoleSelectionPage() {
  const router = useRouter();
  const headingId = useId();
  const gridRef = useRef<HTMLDivElement>(null);
  const [pickError, setPickError] = useState<string | null>(null);
  const {
    signupData,
    addRole,
    removeRole,
    setPrimaryRole,
    createAccount,
    finishSocialSignup,
    goToDetails,
    isLoading,
    error,
  } = useSignup();
  const otpReference = useSignupStore((state) => state.otpReference);

  const mounted = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false
  );
  // A Google sign-up arrives already signed in, with no code step behind it.
  const social = mounted && !otpReference && isSocialSignupPending() && isAuthenticated();

  // Read once on arrival: only a verified sign-up or a new Google account belongs here.
  useEffect(() => {
    const { otpReference: reference, data } = useSignupStore.getState();
    const verified = Boolean(reference && data.isVerified);
    if (!verified && !(isSocialSignupPending() && isAuthenticated())) {
      router.replace(ROUTES.SIGNUP);
    }
  }, [router]);

  const selected = signupData.selectedRoles;

  const toggle = (roleId: string) => {
    setPickError(null);
    if (selected.includes(roleId)) removeRole(roleId);
    else addRole(roleId);
  };

  const handleContinue = async () => {
    if (selected.length === 0) {
      setPickError('Pick at least one way you will use Sureground.');
      gridRef.current?.querySelector<HTMLButtonElement>('[role=checkbox]')?.focus();
      return;
    }
    if (social) await finishSocialSignup();
    else await createAccount();
  };

  const errorAction =
    error?.action === 'details' ? (
      <Button variant="outline" size="sm" onClick={() => goToDetails(error.notice)}>
        Back to your details
      </Button>
    ) : error?.action === 'signin' ? (
      <Button href={ROUTES.LOGIN} variant="outline" size="sm">
        Sign in instead
      </Button>
    ) : error?.action === 'dashboard' ? (
      <Button href={signedInDashboard()} variant="outline" size="sm">
        Go to your dashboard
      </Button>
    ) : undefined;

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-background">
      {!social && (
        <Button
          variant="outline"
          rounded="lg"
          onClick={() => goToDetails(null)}
          icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
          className="fixed left-4 top-4 z-30 min-h-11 bg-card/90 px-3 font-medium text-muted-foreground backdrop-blur sm:left-6 sm:top-6"
        >
          Back
        </Button>
      )}

      <div className="fixed right-4 top-4 z-30 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <div className="mb-6 flex justify-center">
              <Logo size="lg" />
            </div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              {social ? 'One last thing' : 'Step 3 of 3'}
            </p>
            <h1 id={headingId} className="mb-2 text-3xl font-bold text-foreground">
              How will you use Sureground?
            </h1>
            <p className="text-lg text-muted-foreground">
              Pick all that apply. Each one gets a personalised space.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              We don&rsquo;t ask for documents now, only when you list, pay or sign. You can add
              roles later in settings.
            </p>
          </div>

          <div
            ref={gridRef}
            role="group"
            aria-labelledby={headingId}
            className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3"
          >
            {ROLE_LIST.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                isSelected={selected.includes(role.id)}
                onToggle={() => toggle(role.id)}
              />
            ))}
          </div>

          {selected.length > 1 && (
            <Field label="Which do you want to start with?" className="mt-8">
              <RadioGroup
                value={selected[0]}
                onValueChange={setPrimaryRole}
                orientation="horizontal"
                options={selected.map((id) => ({ value: id, label: roleName(id) }))}
              />
            </Field>
          )}
        </div>
      </main>

      <div className="relative z-20 border-t border-border/70 bg-background/90 shadow-[0_-10px_30px_-18px_rgba(20,24,31,0.2)] backdrop-blur-xl">
        <div className="mx-auto max-w-6xl space-y-3 px-4 py-4 sm:px-6 lg:px-8">
          {(error || pickError) && (
            <Alert variant="danger" action={pickError ? undefined : errorAction}>
              {pickError ?? error?.message}
            </Alert>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {selected.length === 0
                ? 'Nothing picked yet.'
                : `${selected.length} picked. You will start as ${roleName(selected[0])}.`}
            </p>
            <Button
              onClick={() => void handleContinue()}
              isLoading={isLoading}
              size="lg"
              rounded="lg"
              icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
              iconPosition="right"
              className="w-full px-8 text-sm sm:w-auto"
            >
              {social ? 'Continue' : 'Create account'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
