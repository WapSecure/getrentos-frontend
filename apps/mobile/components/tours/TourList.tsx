import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { CalendarClock, History, Hourglass } from '@sureground/icons/native';
import { EmptyState, SegmentedControl, Text, useTheme } from '@sureground/ui-native';
import {
  firstGroupWithTours,
  formatDualTime,
  groupTours,
  nextBookedTour,
  TOUR_GROUP_LABELS,
  TOUR_GROUPS,
  type GroupableTour,
  type TourGroup,
  type TourViewer,
} from '@sureground/shared';
import { deviceTimeZone } from '@/lib/api/landBuyerExtras';
import { formatDate } from '@/lib/format';

const GROUP_EMPTY: Record<TourViewer, Record<TourGroup, { title: string; body: string }>> = {
  buyer: {
    upcoming: {
      title: 'Nothing booked',
      body: 'Tours with times to pick, or a time agreed, appear here.',
    },
    waiting: {
      title: 'Nothing waiting for times',
      body: 'Once you ask for a tour, it waits here until the seller offers times.',
    },
    past: { title: 'No past tours', body: 'Finished and cancelled tours appear here.' },
  },
  host: {
    upcoming: {
      title: 'Nothing booked',
      body: 'Tours where you have offered times, or a time is agreed, appear here.',
    },
    waiting: {
      title: 'No requests need times',
      body: 'New requests from buyers wait here until you offer times.',
    },
    past: { title: 'No past tours', body: 'Finished and cancelled tours appear here.' },
  },
};

type ListTour = GroupableTour & { id: string; land: string };

/**
 * The tours screens' list, as on web: upcoming, waiting and past with counts, and the next booked
 * tour in one line. The caller's QueryState covers having no tours at all.
 */
export function TourList<T extends ListTour>({
  tours,
  viewer,
  renderTour,
}: {
  tours: readonly T[];
  viewer: TourViewer;
  renderTour: (tour: T) => ReactNode;
}) {
  const { colors, spacing } = useTheme();
  const groups = groupTours(tours);
  const [picked, setPicked] = useState<TourGroup | null>(null);
  // Captured once at mount: render must not read the clock.
  const [now] = useState(() => Date.now());
  const group = picked ?? firstGroupWithTours(groups);
  const next = nextBookedTour(tours, now);
  const labels = TOUR_GROUP_LABELS[viewer];
  const needsYou = (g: TourGroup) =>
    viewer === 'buyer'
      ? g === 'upcoming' && groups.upcoming.some((t) => t.status === 'PROPOSED')
      : g === 'waiting' && groups.waiting.length > 0;
  const empty = GROUP_EMPTY[viewer][group];
  const EmptyIcon =
    group === 'upcoming' ? CalendarClock : group === 'waiting' ? Hourglass : History;

  return (
    <View style={{ gap: spacing.md }}>
      <SegmentedControl<TourGroup>
        accessibilityLabel="Which tours to show"
        value={group}
        onChange={setPicked}
        options={TOUR_GROUPS.map((g) => ({
          value: g,
          label: labels[g],
          count: groups[g].length,
          countTone: needsYou(g) ? 'warning' : 'neutral',
        }))}
      />
      {next?.scheduledAt ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <CalendarClock size={16} color={colors.primary} />
          <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
            Next: <Text variant="callout">{next.land}</Text>,{' '}
            {formatDate(next.scheduledAt, 'short')},{' '}
            {formatDualTime(next.scheduledAt, deviceTimeZone())}
          </Text>
        </View>
      ) : null}
      {groups[group].length === 0 ? (
        <EmptyState
          size="compact"
          icon={<EmptyIcon size={28} color={colors.mutedForeground} />}
          title={empty.title}
          description={empty.body}
        />
      ) : (
        groups[group].map((tour) => <View key={tour.id}>{renderTour(tour)}</View>)
      )}
    </View>
  );
}
