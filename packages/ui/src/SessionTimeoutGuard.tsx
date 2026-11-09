'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import { Clock } from '@sureground/icons';
import { cn } from '@sureground/shared';
import { Button } from './Button';
import { useSessionActivity } from './hooks/useSessionActivity';

interface SessionTimeoutGuardProps {
  /** Total inactivity before the session ends, dialog included. */
  idleMs?: number;
  warningMs?: number;
  redirectTo?: string;
  className?: string;
}

const formatCountdown = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Deliberately not dismissible: the only outcomes are "keep me signed in" and "sign me out".
export function SessionTimeoutGuard({
  idleMs,
  warningMs,
  redirectTo,
  className,
}: SessionTimeoutGuardProps) {
  const { secondsLeft, isExtending, continueSession, signOut } = useSessionActivity(
    idleMs,
    warningMs,
    redirectTo
  );
  const open = secondsLeft !== null;

  return (
    <RadixDialog.Root open={open} onOpenChange={() => undefined}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-sm" />
        <RadixDialog.Content
          role="alertdialog"
          aria-describedby={undefined}
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          className={cn(
            'fixed top-1/2 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2',
            'rounded-2xl border border-border/90 bg-card p-6 shadow-2xl focus:outline-none',
            className
          )}
        >
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-warning-subtle text-warning">
              <Clock className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <RadixDialog.Title className="text-base font-semibold text-foreground">
                Still there?
              </RadixDialog.Title>
              <p className="mt-1 text-sm text-muted-foreground">
                You have been inactive for a while. To keep your account secure we will sign you out
                in
              </p>
              <p
                className="mt-2 text-2xl font-semibold tabular-nums text-foreground"
                aria-live="polite"
                aria-atomic="true"
              >
                {formatCountdown(secondsLeft ?? 0)}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={signOut} disabled={isExtending}>
              Sign out
            </Button>
            <Button variant="primary" onClick={continueSession} isLoading={isExtending} autoFocus>
              Continue working
            </Button>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
