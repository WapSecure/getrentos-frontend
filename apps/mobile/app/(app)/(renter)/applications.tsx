import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { FileText, MapPin } from '@sureground/icons/native';
import {
  Badge,
  Button,
  Chip,
  EmptyState,
  ListingPlaceholder,
  Price,
  QueryState,
  Skeleton,
  Text,
  useTheme,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { formatDate } from '@/lib/format';
import {
  applicationsApi,
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
  type ApplicationStatus,
  type RenterApplication,
} from '@/lib/api/applications';
import { ApplicationAssistantCard } from '@/components/applications/ApplicationAssistantCard';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

type Filter = 'all' | ApplicationStatus;

export default function Applications() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');

  const query = useQuery({
    queryKey: qk.renter.applications,
    queryFn: () => applicationsApi.list(1, 50),
  });

  const all = useMemo(() => query.data?.items ?? [], [query.data]);
  const items = useMemo(
    () => (filter === 'all' ? all : all.filter((a) => a.status === filter)),
    [all, filter]
  );
  const counts = useMemo(() => {
    const c = new Map<ApplicationStatus, number>();
    all.forEach((a) => c.set(a.status, (c.get(a.status) ?? 0) + 1));
    return c;
  }, [all]);
  const refresh = (
    <RefreshControl
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
      tintColor={colors.mutedForeground}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: insets.top + spacing.lg,
          gap: spacing.md,
        }}
      >
        <DashboardHeader
          eyebrow="Renter workspace"
          title="Applications"
          subtitle="Track every application and next step"
        />

        {all.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -spacing.xl }}
            contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}
          >
            <Chip
              selected={filter === 'all'}
              label="All"
              count={all.length}
              onPress={() => setFilter('all')}
              size="sm"
            />
            {APPLICATION_STATUSES.filter((st) => counts.has(st)).map((st) => (
              <Chip
                key={st}
                selected={filter === st}
                label={APPLICATION_STATUS_LABEL[st]}
                count={counts.get(st)}
                onPress={() => setFilter(st)}
                size="sm"
              />
            ))}
          </ScrollView>
        ) : null}
      </View>

      <QueryState
        query={query}
        style={{ paddingHorizontal: spacing.xl }}
        skeleton={
          <View style={{ paddingTop: spacing.lg, gap: spacing.md }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={104} radius={radius.lg} />
            ))}
          </View>
        }
      >
        {all.length === 0 ? (
          <ScrollView
            contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}
            refreshControl={refresh}
          >
            <ApplicationAssistantCard />
            <EmptyState
              icon={<FileText size={34} color={colors.mutedForeground} />}
              title="No applications yet"
              description="Submitted rental applications, their status, and required documents will appear here."
              action={
                <Button
                  label="Browse listings"
                  onPress={() => router.push('/(app)/(renter)/discover')}
                />
              }
            />
          </ScrollView>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<FileText size={34} color={colors.mutedForeground} />}
            title="Nothing here"
            description="No applications match this filter."
            action={<Button label="Show all" variant="outline" onPress={() => setFilter('all')} />}
          />
        ) : (
          <FlashList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }: { item: RenterApplication }) => (
              <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
                <ApplicationRow application={item} />
              </View>
            )}
            contentContainerStyle={{ paddingTop: spacing.sm, paddingBottom: spacing['3xl'] }}
            refreshControl={refresh}
          />
        )}
      </QueryState>
    </View>
  );
}

function ApplicationRow({ application: a }: { application: RenterApplication }) {
  const { colors, spacing, radius, shadows } = useTheme();
  return (
    <Pressable
      onPress={() => router.push(`/(app)/application/${a.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${a.title}, ${APPLICATION_STATUS_LABEL[a.status]}, ${a.address}, applied ${a.applicationDate}`}
      accessibilityHint="Opens the application"
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          gap: spacing.md,
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          padding: spacing.md,
          opacity: pressed ? 0.92 : 1,
        },
        shadows.sm,
      ]}
    >
      <View
        style={{
          width: 76,
          height: 76,
          borderRadius: radius.md,
          overflow: 'hidden',
          backgroundColor: colors.secondary,
        }}
      >
        {a.image ? (
          <Image
            source={{ uri: a.image }}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={a.id}
            transition={150}
            accessible={false}
            style={{ flex: 1 }}
          />
        ) : (
          <ListingPlaceholder size="thumb" />
        )}
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: spacing.sm,
          }}
        >
          <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
            {a.title}
          </Text>
          <Badge
            label={APPLICATION_STATUS_LABEL[a.status]}
            tone={APPLICATION_STATUS_TONE[a.status]}
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <MapPin size={11} color={colors.mutedForeground} />
          <Text variant="caption" color="mutedForeground" numberOfLines={1} style={{ flex: 1 }}>
            {a.address}
          </Text>
        </View>
        <Price amount={a.price} period={a.period} variant="callout" />
        <Text variant="caption" color="mutedForeground" numberOfLines={2}>
          {applicationNextStep(a)} · Applied {formatDate(a.applicationDate)}
        </Text>
      </View>
    </Pressable>
  );
}

/** One line on where the application stands, so "Pending" is never the only clue. */
function applicationNextStep(a: RenterApplication): string {
  const missing = (a.documents ?? []).filter((d) => d.required && !d.uploaded).length;
  if (a.status === 'approved') return 'Approved. Next, sign your lease';
  if (a.status === 'rejected') return 'Not successful this time';
  if (missing > 0)
    return missing === 1 ? '1 document still needed' : `${missing} documents still needed`;
  if (a.status === 'under_review') return 'The landlord is reviewing it';
  return 'Sent. Waiting for the landlord to review';
}
