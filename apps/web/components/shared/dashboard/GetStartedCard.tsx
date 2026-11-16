'use client';

import { useSyncExternalStore, type ElementType } from 'react';
import Link from 'next/link';
import { ChevronRight } from '@sureground/icons';
import { Button, Card, CardDescription, CardHeader, CardTitle } from '@sureground/ui';

export interface GetStartedStep {
  title: string;
  body: string;
  icon: ElementType;
  /** Without one the step only explains something. */
  href?: string;
}

interface GetStartedCardProps {
  /** Names the dismissal in browser storage, per portal. */
  id: string;
  description: string;
  steps: GetStartedStep[];
}

const listeners = new Set<() => void>();
const keyFor = (id: string) => `sureground.getStarted.${id}`;

const subscribe = (onChange: () => void) => {
  listeners.add(onChange);
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
};

const isDismissed = (id: string) => {
  try {
    return window.localStorage.getItem(keyFor(id)) === '1';
  } catch {
    return false;
  }
};

const dismiss = (id: string) => {
  try {
    window.localStorage.setItem(keyFor(id), '1');
  } catch {
    // Storage blocked: the card comes back on the next visit.
  }
  listeners.forEach((listener) => listener());
};

function StepRow({ step }: { step: GetStartedStep }) {
  const Icon = step.icon;
  const content = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground">{step.title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{step.body}</span>
      </span>
    </>
  );
  if (!step.href) return <div className="flex items-start gap-3 px-3 py-2.5">{content}</div>;
  return (
    <Link
      href={step.href}
      className="group flex min-h-16 items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-primary/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {content}
      <ChevronRight
        className="h-4 w-4 shrink-0 text-muted-foreground/70 transition-[color,transform] duration-150 group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transition-none"
        aria-hidden="true"
      />
    </Link>
  );
}

// Shown on a new account's first visits until the person says they have it.
export function GetStartedCard({ id, description, steps }: GetStartedCardProps) {
  // Hidden on the server render so a dismissed card never flashes.
  const hidden = useSyncExternalStore(
    subscribe,
    () => isDismissed(id),
    () => true
  );
  if (hidden) return null;

  return (
    <Card>
      <CardHeader
        className="pb-2"
        action={
          <Button variant="ghost" rounded="lg" onClick={() => dismiss(id)}>
            Got it
          </Button>
        }
      >
        <CardTitle as="h2">Get started</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <ul className="grid gap-0.5 p-2.5 pt-2 md:grid-cols-2">
        {steps.map((step) => (
          <li key={step.title}>
            <StepRow step={step} />
          </li>
        ))}
      </ul>
    </Card>
  );
}
