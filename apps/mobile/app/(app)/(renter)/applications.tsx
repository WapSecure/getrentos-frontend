import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { FileText, MapPin } from 'lucide-react-native';
import {
  Badge,
  Button,
  Chip,
  EmptyState,
  ErrorState,
  Price,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
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

  const all = query.data?.items ?? [];
  const items = useMemo(() => {
    const list = query.data?.items ?? [];
    return filter === 'all' ? list : list.filter((a) => a.status === filter);
  }, [query.data, filter]);

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
          <FlashList
            data={(['all', ...APPLICATION_STATUSES] as Filter[]).map((f) => ({ f }))}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(x) => x.f}
            renderItem={({ item }) => (
              <Chip
                selected={filter === item.f}
                label={item.f === 'all' ? 'All' : APPLICATION_STATUS_LABEL[item.f]}
                onPress={() => setFilter(item.f)}
                size="sm"
              />
            )}
            style={{ marginHorizontal: -spacing.xl }}
            contentContainerStyle={{ paddingHorizontal: spacing.xl }}
          />
        ) : null}
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={104} radius={radius.lg} />
          ))}
        </View>
      ) : all.length === 0 ? (
        <View style={{ padding: spacing.xl, gap: spacing.lg }}>
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
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<FileText size={34} color={colors.mutedForeground} />}
          title="Nothing here"
          description="No applications match this filter."
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
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
        />
      )}
    </View>
  );
}

function ApplicationRow({ application: a }: { application: RenterApplication }) {
  const { colors, spacing, radius, shadows } = useTheme();
  return (
    <Pressable
      onPress={() => router.push(`/(app)/application/${a.id}`)}
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
          <Image source={{ uri: a.image }} contentFit="cover" style={{ flex: 1 }} />
        ) : null}
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
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Price amount={a.price} period={a.period} variant="callout" />
          <Text variant="caption" color="mutedForeground">
            Applied {a.applicationDate}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
