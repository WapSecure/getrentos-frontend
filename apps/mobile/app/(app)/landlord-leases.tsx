import { Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, FileSignature } from 'lucide-react-native';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Price,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { landlordApi, LEASE_STATUS_TONE, type LandlordLease } from '@/lib/api/landlord';
import { formatDate } from '@/lib/format';

export default function LandlordLeases() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const query = useQuery({
    queryKey: qk.landlord.leases(),
    queryFn: () => landlordApi.leases(),
  });

  const items = query.data?.items ?? [];
  const awaitingSignature = items.filter((l) => !l.tenantSigned || !l.landlordSigned).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingTop: insets.top + 8,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}
        >
          <ChevronLeft size={26} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="title">Leases</Text>
          {query.data ? (
            <Text variant="caption" color="mutedForeground">
              {query.data.total} lease{query.data.total === 1 ? '' : 's'}
              {awaitingSignature > 0 ? ` · ${awaitingSignature} awaiting signature` : ''}
            </Text>
          ) : null}
        </View>
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={120} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(l) => l.id}
          renderItem={({ item }: { item: LandlordLease }) => <LeaseCard lease={item} />}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<FileSignature size={32} color={colors.mutedForeground} />}
              title="No leases yet"
              description="Leases you create for approved applicants appear here."
            />
          }
        />
      )}
    </View>
  );
}

function LeaseCard({ lease: l }: { lease: LandlordLease }) {
  const { spacing } = useTheme();

  return (
    <Card padding={spacing.lg} style={{ marginBottom: spacing.sm }}>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
            {l.tenantName}
          </Text>
          <Badge label={l.status} tone={LEASE_STATUS_TONE[l.status]} />
        </View>

        <Text variant="caption" color="mutedForeground" numberOfLines={1}>
          {l.propertyName}
          {l.unitName ? ` · ${l.unitName}` : ''}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
            {formatDate(l.leaseStart, 'short')} – {formatDate(l.leaseEnd, 'short')}
          </Text>
          <Price amount={l.rentAmount} period="year" variant="callout" />
        </View>

        {/* Signature state is the thing a landlord chases, so surface it plainly. */}
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <SignatureChip label="Landlord" signed={l.landlordSigned} />
          <SignatureChip label="Tenant" signed={l.tenantSigned} />
        </View>
      </View>
    </Card>
  );
}

function SignatureChip({ label, signed }: { label: string; signed: boolean }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: spacing.md,
        paddingVertical: 5,
        borderRadius: radius.full,
        backgroundColor: signed ? colors.success + '1f' : colors.secondary,
      }}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: signed ? colors.success : colors.mutedForeground,
        }}
      />
      <Text
        variant="caption"
        style={{ fontSize: 11, color: signed ? colors.success : colors.mutedForeground }}
      >
        {label} {signed ? 'signed' : 'pending'}
      </Text>
    </View>
  );
}
