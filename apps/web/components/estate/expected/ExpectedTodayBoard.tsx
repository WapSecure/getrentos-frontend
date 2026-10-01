'use client';

import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, Package, UserCheck } from 'lucide-react';
import { Badge, Card, EmptyState, Skeleton } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';

/**
 * Who the estate expects today.
 *
 * Three answers on one screen because a guard asking "who is coming?" does not
 * care which table the answer came from, and the estate currently has to look in
 * three places. The rows are grouped by kind anyway — an invitation, a standing
 * authorisation and a parcel are handled differently at a barrier — but they
 * share a deadline and a household, which is what makes one board worth having.
 *
 * It is a HINT board, and it says so. Nothing here opens a barrier: the person
 * still presents a PIN, and this only tells the guard they are expected. A board
 * that admitted people would be a new way in, invented by a display.
 */
export const ExpectedTodayBoard = ({ estateId }: { estateId: string }) => {
  const boardQuery = useQuery({
    queryKey: estateKeys.expectedToday(estateId),
    queryFn: () => unwrap(estateService.getExpectedToday(estateId)),
  });

  if (boardQuery.isLoading) {
    return <Skeleton className="h-40 w-full rounded-2xl" />;
  }

  const board = boardQuery.data;
  const total =
    (board?.visitors.length ?? 0) + (board?.contractors.length ?? 0) + (board?.parcels.length ?? 0);

  if (!board) {
    return (
      <EmptyState
        icon={UserCheck}
        title="Nothing to show"
        description="The board could not be read just now. Everybody can still be admitted by their pass as usual."
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="font-medium text-foreground">{board.tally.label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Counted at{' '}
            {new Date(board.asOf).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })}
            . Nothing here admits anybody — a visitor still presents their pass.
          </p>
        </div>
        <Badge variant={board.tally.byEndOfToday > 0 ? 'info' : 'neutral'}>
          {board.tally.byEndOfToday} by the end of today
        </Badge>
      </Card>

      {total === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="Nobody expected"
          description="No invitations outstanding, no standing authorisation due today, and no parcel waiting. Visitors without a pass are still screened at the gate as always."
        />
      ) : (
        <div className="space-y-5">
          <Section
            title="Invitations"
            icon={<UserCheck className="h-4 w-4" />}
            count={board.visitors.length}
          >
            {board.visitors.map((visitor) => (
              <Row
                key={visitor.id}
                title={visitor.visitorName}
                subtitle={`${visitor.unitLabel} · ${visitor.sourceLabel}`}
                deadline={visitor.deadlineLabel}
                deadlineToday={visitor.deadlineToday}
              />
            ))}
          </Section>

          <Section
            title="Regular visitors"
            icon={<Briefcase className="h-4 w-4" />}
            count={board.contractors.length}
          >
            {board.contractors.map((contractor) => (
              <Row
                key={contractor.id}
                title={contractor.name}
                subtitle={[
                  contractor.trade ?? contractor.company,
                  contractor.unitLabel ?? 'Common areas',
                  contractor.hoursLabel,
                ]
                  .filter(Boolean)
                  .join(' · ')}
                deadline={contractor.deadlineLabel}
                deadlineToday={contractor.deadlineToday}
              />
            ))}
          </Section>

          <Section
            title="Parcels"
            icon={<Package className="h-4 w-4" />}
            count={board.parcels.length}
          >
            {board.parcels.map((parcel) => (
              <Row
                key={parcel.id}
                title={`${parcel.courier}${parcel.description ? ` — ${parcel.description}` : ''}`}
                subtitle={`${parcel.unitLabel} · ${parcel.residentName}`}
                deadline={parcel.deadlineLabel}
                deadlineToday={parcel.deadlineToday}
              />
            ))}
          </Section>
        </div>
      )}
    </div>
  );
};

const Section = ({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon: ReactNode;
  count: number;
  children: ReactNode;
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-foreground">
      {icon}
      <h3 className="text-sm font-semibold">{title}</h3>
      <span className="text-xs text-muted-foreground">{count}</span>
    </div>
    {count === 0 ? (
      <p className="rounded-xl border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">
        None today.
      </p>
    ) : (
      <div className="space-y-2">{children}</div>
    )}
  </div>
);

/**
 * One expected arrival.
 *
 * The deadline is the loudest thing after the name, because it is the only part
 * of the row the estate can be wrong about: a pass is a permission with an end,
 * and a guard reads "until Friday" differently from "by 18:00 today".
 */
const Row = ({
  title,
  subtitle,
  deadline,
  deadlineToday,
}: {
  title: string;
  subtitle: string;
  deadline: string;
  deadlineToday: boolean;
}) => (
  <Card className="flex flex-wrap items-center justify-between gap-3 p-3">
    <div className="min-w-0">
      <p className="truncate font-medium text-foreground">{title}</p>
      <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
    </div>
    <Badge variant={deadlineToday ? 'info' : 'neutral'}>{deadline}</Badge>
  </Card>
);
