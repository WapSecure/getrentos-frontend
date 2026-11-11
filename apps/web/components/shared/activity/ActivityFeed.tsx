import { Bot, ShieldCheck, UserRound, Wrench } from '@sureground/icons';
import { Badge, type BadgeVariant } from '@sureground/ui';
import { formatDualTime } from '@/lib/format';

/** Who did it. Staff always show as "Sureground"; `YOU` is the viewer's own action. */
export type ActivityFeedActorKind =
  | 'MANAGER'
  | 'SUREGROUND'
  | 'TENANT'
  | 'SYSTEM'
  | 'OTHER'
  | 'YOU';

export interface ActivityFeedItem {
  id: string;
  at: string;
  label: string;
  actor: string;
  actorKind: ActivityFeedActorKind;
  important: boolean;
  /** Shown before the time when the feed spans several properties. */
  propertyTitle?: string;
}

const KIND: Record<
  ActivityFeedActorKind,
  { label: string; icon: typeof Wrench; variant: BadgeVariant }
> = {
  MANAGER: { label: 'Manager', icon: Wrench, variant: 'info' },
  SUREGROUND: { label: 'Sureground', icon: ShieldCheck, variant: 'success' },
  TENANT: { label: 'Tenant', icon: UserRound, variant: 'neutral' },
  SYSTEM: { label: 'Automatic', icon: Bot, variant: 'neutral' },
  OTHER: { label: 'Other', icon: UserRound, variant: 'neutral' },
  YOU: { label: 'You', icon: UserRound, variant: 'primary' },
};

const dayOf = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NG', {
    timeZone: 'Africa/Lagos',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-NG', {
    timeZone: 'Africa/Lagos',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * Who did what and when, grouped by Lagos day. With `viewerTimeZone`, each time shows Lagos
 * time next to the viewer's own. Shared by the owner's activity log and the purchase workspace.
 */
export const ActivityFeed = ({
  items,
  viewerTimeZone,
  headingLevel = 'h2',
}: {
  items: readonly ActivityFeedItem[];
  viewerTimeZone?: string;
  headingLevel?: 'h2' | 'h3';
}) => {
  const days = new Map<string, ActivityFeedItem[]>();
  for (const item of items) {
    const day = dayOf(item.at);
    days.set(day, [...(days.get(day) ?? []), item]);
  }
  const Heading = headingLevel;

  return (
    <div className="space-y-6">
      {[...days.entries()].map(([day, list]) => (
        <section key={day}>
          <Heading className="mb-2 text-sm font-semibold text-foreground">{day}</Heading>
          <ol className="divide-y divide-border rounded-2xl border border-border bg-card">
            {list.map((item) => {
              const kind = KIND[item.actorKind] ?? KIND.OTHER;
              const Icon = kind.icon;
              const time = viewerTimeZone
                ? formatDualTime(item.at, viewerTimeZone)
                : timeOf(item.at);
              return (
                <li key={item.id} className="flex items-start gap-3 p-4">
                  <div className="shrink-0 rounded-xl bg-muted p-2">
                    <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{item.actor}</span> · {item.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.propertyTitle ? `${item.propertyTitle} · ${time}` : time}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant={kind.variant}>{kind.label}</Badge>
                    {item.important && <Badge variant="warning">Important</Badge>}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
};
