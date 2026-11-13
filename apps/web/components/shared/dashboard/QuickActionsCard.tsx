'use client';

import { useId, type ElementType } from 'react';
import Link from 'next/link';
import { ChevronRight } from '@sureground/icons';
import { Card, CardDescription, CardHeader, CardTitle } from '@sureground/ui';

export interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: ElementType;
}

interface QuickActionsCardProps {
  actions: QuickAction[];
  description?: string;
}

function ActionRow({ action }: { action: QuickAction }) {
  const descriptionId = useId();
  const Icon = action.icon;
  return (
    <Link
      href={action.href}
      aria-describedby={descriptionId}
      className="group flex min-h-16 items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-primary/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground">{action.label}</span>
        <span id={descriptionId} className="mt-0.5 block text-xs leading-5 text-muted-foreground">
          {action.description}
        </span>
      </span>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-muted-foreground/70 transition-[color,transform] duration-150 group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transition-none"
        aria-hidden="true"
      />
    </Link>
  );
}

/** The dashboard's shortcuts for every role: an icon tile, what it does, and where it goes. */
export function QuickActionsCard({
  actions,
  description = 'Your everyday tasks, close at hand.',
}: QuickActionsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        {/* h2 to sit beside the chart and activity feed: at h3 a screen reader nests it under "Recent activity". */}
        <CardTitle as="h2">Quick actions</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <ul className="space-y-0.5 p-2.5 pt-2">
        {actions.map((action) => (
          <li key={action.label}>
            <ActionRow action={action} />
          </li>
        ))}
      </ul>
    </Card>
  );
}
