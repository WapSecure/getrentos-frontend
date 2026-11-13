import type { ReactNode } from 'react';
import { AlertCircle, Bell, CheckCircle2, Clock, type SgIcon } from '@sureground/icons';
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
} from '@sureground/ui';
import { cn } from '@sureground/shared';
import type { AttentionItem } from '@/types/attention';

export interface AttentionListItem extends AttentionItem {
  /** Replaces the severity glyph with one that says what the item is (a deposit, a tour). */
  icon?: SgIcon;
  /** When it is due, already formatted (Lagos time beside the viewer's own). */
  due?: ReactNode;
}

const TONE = {
  urgent: { icon: AlertCircle, cls: 'text-destructive', tile: 'bg-destructive-subtle' },
  soon: { icon: Clock, cls: 'text-warning', tile: 'bg-warning-subtle' },
  info: { icon: Bell, cls: 'text-primary', tile: 'bg-primary/10' },
} as const;

const SEVERITY_LABEL = { urgent: 'Urgent', soon: 'Due soon', info: 'For information' } as const;

interface AttentionListProps {
  items: readonly AttentionListItem[];
  title?: string;
  description?: ReactNode;
  /** Shown when nothing is waiting; without it the card is not drawn at all. */
  empty?: { title: string; description?: ReactNode };
  className?: string;
}

/**
 * "Needs your attention" for any dashboard: one row per thing waiting, each with what it is, when
 * it is due and a single action. Feed it from the API (AttentionFeed) or from a page's own data.
 */
export function AttentionList({
  items,
  title = 'Needs your attention',
  description,
  empty,
  className,
}: AttentionListProps) {
  if (!items.length && !empty) return null;
  const urgent = items.filter((item) => item.severity === 'urgent').length;

  return (
    <Card className={className}>
      <CardHeader
        className="pb-4"
        action={
          items.length > 0 ? (
            <Badge variant={urgent ? 'danger' : 'neutral'} dot={urgent > 0}>
              {urgent ? `${urgent} urgent` : `${items.length} open`}
            </Badge>
          ) : undefined
        }
      >
        <CardTitle as="h2">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      {items.length === 0 && empty ? (
        <EmptyState
          icon={CheckCircle2}
          title={empty.title}
          description={empty.description}
          size="compact"
          bare
          className="border-t border-border"
        />
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {items.map((item) => {
            const tone = TONE[item.severity];
            const Icon = item.icon ?? tone.icon;
            return (
              <li
                key={item.key}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                      tone.tile
                    )}
                  >
                    <Icon className={cn('h-4 w-4', tone.cls)} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      <span className="sr-only">{SEVERITY_LABEL[item.severity]}: </span>
                      {item.title}
                    </p>
                    {item.detail && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{item.detail}</p>
                    )}
                    {item.due && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
                        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {item.due}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  href={item.link.path}
                  variant={item.severity === 'urgent' ? 'primary' : 'outline'}
                  className="ml-12 shrink-0 self-start sm:ml-0 sm:self-center"
                >
                  {item.link.label}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
