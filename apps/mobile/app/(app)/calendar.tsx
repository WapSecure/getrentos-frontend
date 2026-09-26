import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar as CalendarIcon, MapPin, Plus } from 'lucide-react-native';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  calendarApi,
  CALENDAR_EVENT_TYPE_COLOR,
  CALENDAR_EVENT_TYPE_LABEL,
  type CalendarEvent,
} from '@/lib/api/calendar';
import { CalendarEventSheet } from '@/components/calendar/CalendarEventSheet';
import { formatDate } from '@/lib/format';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';

function groupByDate(events: CalendarEvent[]): { date: string; events: CalendarEvent[] }[] {
  const sorted = [...events].sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    return d !== 0 ? d : a.startTime.localeCompare(b.startTime);
  });
  const groups = new Map<string, CalendarEvent[]>();
  for (const e of sorted) {
    const key = e.date.slice(0, 10);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }
  return Array.from(groups.entries()).map(([date, events]) => ({ date, events }));
}

export default function CalendarScreen() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [creating, setCreating] = useState(false);

  const query = useQuery({ queryKey: qk.renter.calendarEvents, queryFn: calendarApi.list });
  const groups = useMemo(() => groupByDate(query.data ?? []), [query.data]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Your schedule"
        title="Calendar"
        subtitle="Viewings, payments and important dates"
        onBack={() => router.back()}
        accessory={
          <IconButton
            onPress={() => setCreating(true)}
            accessibilityLabel="Add event"
            icon={<Plus size={20} color={colors.primary} />}
          />
        }
      />

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={70} radius={radius.lg} />
          ))}
        </View>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon size={34} color={colors.mutedForeground} />}
          title="Nothing on your calendar"
          description="Viewings, payments and lease dates will show up here."
        />
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
            gap: spacing.lg,
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
        >
          {groups.map((g) => (
            <View key={g.date} style={{ gap: spacing.sm }}>
              <Text variant="bodyStrong" color="mutedForeground">
                {formatDate(g.date)}
              </Text>
              {g.events.map((e) => (
                <Pressable key={e.id} onPress={() => setEditingEvent(e)}>
                  <Card elevated style={e.status === 'cancelled' ? { opacity: 0.55 } : undefined}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: spacing.sm,
                      }}
                    >
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text
                          variant="bodyStrong"
                          numberOfLines={1}
                          style={
                            e.status === 'completed'
                              ? { textDecorationLine: 'line-through' }
                              : undefined
                          }
                        >
                          {e.title}
                        </Text>
                        <Text variant="caption" color="mutedForeground">
                          {e.startTime} – {e.endTime}
                        </Text>
                        {e.location ? (
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                              marginTop: 2,
                            }}
                          >
                            <MapPin size={11} color={colors.mutedForeground} />
                            <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                              {e.location}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Badge
                        label={CALENDAR_EVENT_TYPE_LABEL[e.type]}
                        tone={CALENDAR_EVENT_TYPE_COLOR[e.type]}
                      />
                    </View>
                  </Card>
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      <CalendarEventSheet open={creating} onClose={() => setCreating(false)} event={null} />
      <CalendarEventSheet
        open={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        event={editingEvent}
      />
    </View>
  );
}
