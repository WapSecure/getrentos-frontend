import { useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Building2, MapPin, Plus } from 'lucide-react-native';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  PressableScale,
  Price,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { CreatePropertySheet } from '@/components/landlord/CreatePropertySheet';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { landlordApi, VERIFICATION_TONE, type LandlordProperty } from '@/lib/api/landlord';

export default function LandlordProperties() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [creating, setCreating] = useState(false);

  const query = useQuery({
    queryKey: qk.landlord.properties(),
    queryFn: () => landlordApi.properties(),
  });

  const items = query.data?.items ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + spacing.lg,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <DashboardHeader
          eyebrow="Portfolio"
          title="Properties"
          subtitle={
            query.data
              ? `${query.data.total} propert${query.data.total === 1 ? 'y' : 'ies'}`
              : 'Manage your property portfolio'
          }
          accessory={
            <IconButton
              onPress={() => setCreating(true)}
              accessibilityLabel="Add a property"
              icon={<Plus size={20} color={colors.primary} />}
            />
          }
        />
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={104} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(p) => p.id}
          renderItem={({ item }: { item: LandlordProperty }) => (
            <PropertyRow
              property={item}
              onPress={() => router.push(`/(app)/landlord-property/${item.id}`)}
            />
          )}
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
              icon={<Building2 size={32} color={colors.mutedForeground} />}
              title="No properties yet"
              description="Properties you list appear here with their units, occupancy and rent roll."
            />
          }
        />
      )}

      <CreatePropertySheet open={creating} onClose={() => setCreating(false)} />
    </View>
  );
}

function PropertyRow({
  property: p,
  onPress,
}: {
  property: LandlordProperty;
  onPress: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const occupancy = p.totalUnits > 0 ? Math.round((p.occupiedUnits / p.totalUnits) * 100) : 0;

  return (
    <PressableScale onPress={onPress} style={{ marginBottom: spacing.sm }}>
      <Card padding="none">
        <View style={{ flexDirection: 'row', gap: spacing.md, padding: spacing.md }}>
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: radius.md,
              overflow: 'hidden',
              backgroundColor: colors.secondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {p.coverImage ? (
              <Image
                source={{ uri: p.coverImage }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            ) : (
              <Building2 size={22} color={colors.mutedForeground} />
            )}
          </View>

          <View style={{ flex: 1, gap: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
              <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                {p.name}
              </Text>
              <Badge label={p.verificationStatus} tone={VERIFICATION_TONE[p.verificationStatus]} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MapPin size={12} color={colors.mutedForeground} />
              <Text variant="caption" color="mutedForeground" numberOfLines={1} style={{ flex: 1 }}>
                {p.address}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Text variant="caption" color="mutedForeground">
                {p.occupiedUnits}/{p.totalUnits} occupied · {occupancy}%
              </Text>
              {p.annualRentRoll > 0 ? (
                <Price amount={p.annualRentRoll} period="year" variant="caption" compact />
              ) : null}
            </View>
          </View>
        </View>
      </Card>
    </PressableScale>
  );
}
