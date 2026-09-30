import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, Package, UserCheck } from 'lucide-react-native';
import {
  Card,
  EmptyState,
  ErrorState,
  Screen,
  SectionHeader,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { useGatemanPost } from '@/lib/gateman/GatemanPostProvider';
import { gatemanApi } from '@/lib/api/gateman';
import { qk } from '@/lib/query/keys';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

/**
 * Who the estate expects today, at the barrier.
 *
 * Prefixed `gate-` for the same reason `gate-deliveries` and `gate-patrol` are:
 * route groups contribute no URL segment, so a group screen also answers on its
 * bare path and Expo Router's generated route union would collapse a clash
 * silently. There is no top-level `expected.tsx` today — the prefix is what keeps
 * it that way.
 *
 * READ-ONLY, and deliberately so. It exists because the question a guard is
 * actually asked is "am I expected?" and the answer currently requires ringing
 * the office. Nothing on it opens a barrier: the visitor still presents their
 * PIN, and this only says the estate already knows they are coming. That is also
 * why the endpoint is readable at the gate even though the guest list behind it
 * belongs to the office — a board that admitted people would be a new way in,
 * invented by a display.
 *
 * Every row shows the deadline the estate gave it rather than counting who is
 * "due", because the guard is the one who has to decide what to do about a
 * visitor holding a pass that expired this morning: turn them away, or ring the
 * resident. Hiding the row would make that decision for them, badly.
 */
export default function GatemanExpected() {
  const { spacing } = useTheme();
  const { estate, isLoading: isPostLoading } = useGatemanPost();

  const boardQuery = useQuery({
    queryKey: qk.gateman.expectedToday(estate?.id ?? ''),
    queryFn: () => gatemanApi.getExpectedToday(estate!.id),
    enabled: !!estate,
  });

  const board = boardQuery.data;
  const total = board ? board.visitors.length + board.contractors.length + board.parcels.length : 0;

  return (
    <Screen>
      <DashboardHeader eyebrow="Gate console" title="Expected today" />
      <View style={{ padding: spacing.lg, gap: spacing.lg }}>
        <Text variant="caption" color="mutedForeground">
          This is what the estate has been told, not a door. Every visitor still presents their own
          pass, and you can always turn somebody away whatever this says.
        </Text>

        {isPostLoading || boardQuery.isLoading ? (
          <View style={{ gap: spacing.md }}>
            <Skeleton height={72} radius={12} />
            <Skeleton height={120} radius={12} />
          </View>
        ) : boardQuery.isError ? (
          <ErrorState
            title="Could not read the board"
            description="Nobody is stranded by this — check visitors in by their pass as usual."
            onRetry={() => void boardQuery.refetch()}
          />
        ) : !board || total === 0 ? (
          <EmptyState
            icon={<UserCheck size={28} />}
            title="Nobody expected"
            description="No invitation outstanding, nobody authorised for today, and no parcel waiting."
          />
        ) : (
          <>
            <Card>
              <View style={{ gap: 4 }}>
                <Text variant="bodyStrong">{board.tally.label}</Text>
                <Text variant="caption" color="mutedForeground">
                  Counted at{' '}
                  {new Date(board.asOf).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  .
                </Text>
              </View>
            </Card>

            <Block
              title="Invitations"
              icon={<UserCheck size={16} />}
              rows={board.visitors.map((visitor) => ({
                id: visitor.id,
                title: visitor.visitorName,
                subtitle: `${visitor.unitLabel} · ${visitor.sourceLabel}`,
                deadline: visitor.deadlineLabel,
                deadlineToday: visitor.deadlineToday,
              }))}
              emptyLabel="No invitation outstanding."
            />

            <Block
              title="Regular visitors"
              icon={<Briefcase size={16} />}
              rows={board.contractors.map((contractor) => ({
                id: contractor.id,
                title: contractor.name,
                subtitle: [
                  contractor.trade ?? contractor.company,
                  contractor.unitLabel ?? 'Common areas',
                  contractor.hoursLabel,
                ]
                  .filter(Boolean)
                  .join(' · '),
                deadline: contractor.deadlineLabel,
                deadlineToday: contractor.deadlineToday,
              }))}
              emptyLabel="Nobody authorised for today."
            />

            <Block
              title="Parcels"
              icon={<Package size={16} />}
              rows={board.parcels.map((parcel) => ({
                id: parcel.id,
                title: `${parcel.courier}${parcel.description ? ` — ${parcel.description}` : ''}`,
                subtitle: `${parcel.unitLabel} · ${parcel.residentName}`,
                deadline: parcel.deadlineLabel,
                deadlineToday: parcel.deadlineToday,
              }))}
              emptyLabel="Nothing waiting."
            />
          </>
        )}
      </View>
    </Screen>
  );
}

type BoardRow = {
  id: string;
  title: string;
  subtitle: string;
  deadline: string;
  deadlineToday: boolean;
};

/**
 * One kind of arrival.
 *
 * A block rather than one flat list because the three are handled differently at
 * a barrier — an invitation is checked in, a regular visitor is usually waved
 * through, and a parcel is handed over — so the guard needs to know which of the
 * three they are looking at before they know what to do with it.
 */
const Block = ({
  title,
  icon,
  rows,
  emptyLabel,
}: {
  title: string;
  icon: ReactNode;
  rows: BoardRow[];
  emptyLabel: string;
}) => {
  const { spacing } = useTheme();

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        {icon}
        <SectionHeader title={title} />
        <Text variant="caption" color="mutedForeground">
          {rows.length}
        </Text>
      </View>

      {rows.length === 0 ? (
        <Text variant="caption" color="mutedForeground">
          {emptyLabel}
        </Text>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {rows.map((row) => (
            <Card key={row.id}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: spacing.sm,
                }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong">{row.title}</Text>
                  <Text variant="caption" color="mutedForeground">
                    {row.subtitle}
                  </Text>
                </View>
                {/* The deadline is the part of a row the estate can be wrong
                    about, so it is shown rather than filtered away: "until
                    Friday" and "by 18:00 today" mean different things at a
                    barrier, and the guard is the one who has to act on it. */}
                <Text
                  variant="caption"
                  color={row.deadlineToday ? 'foreground' : 'mutedForeground'}
                >
                  {row.deadline}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}
    </View>
  );
};
