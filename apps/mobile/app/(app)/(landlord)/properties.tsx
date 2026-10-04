import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Building2, MapPin, Plus } from 'lucide-react-native';
import {
  Badge,
  Button,
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
import {
  landlordApi,
  VERIFICATION_LABEL,
  VERIFICATION_TONE,
  type LandlordProperty,
} from '@/lib/api/landlord';

export default function LandlordProperties() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [creating, setCreating] = useState(false);

  const query = useQuery({
    queryKey: qk.landlord.properties(),
    queryFn: () => landlordApi.properties(),
  });

  const items = query.data?.items ?? [];
  const refresh = (
    <RefreshControl
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
      tintColor={colors.mutedForeground}
    />
  );

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
          eyebrow="Your portfolio"
          title="Properties"
          subtitle={
            query.data
              ? `${query.data.total} ${query.data.total === 1 ? 'property' : 'properties'}`
              : undefined
          }
          accessory={
            <IconButton
              onPress={() => setCreating(true)}
              accessibilityLabel="Add a property"
              icon={<Plus size={20} color={colors.foreground} />}
            />
          }
        />
      </View>

      {query.isError && items.length === 0 ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <ErrorState onRetry={() => query.refetch()} />
        </ScrollView>
      ) : query.isPending ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={104} radius={radius.lg} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <EmptyState
            icon={<Building2 size={34} color={colors.mutedForeground} />}
            title="Add your first property"
            description="Record a property you let, add its units, then list them and collect rent."
            action={<Button label="Add property" onPress={() => setCreating(true)} />}
          />
        </ScrollView>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          refreshControl={refresh}
          renderItem={({ item }: { item: LandlordProperty }) => <PropertyRow property={item} />}
        />
      )}

      <CreatePropertySheet open={creating} onClose={() => setCreating(false)} />
    </View>
  );
}

function PropertyRow({ property: p }: { property: LandlordProperty }) {
  const { colors, spacing, radius, shadows } = useTheme();
  const occupancy = p.totalUnits > 0 ? Math.round((p.occupiedUnits / p.totalUnits) * 100) : 0;
  const units = `${p.occupiedUnits} of ${p.totalUnits} ${p.totalUnits === 1 ? 'unit' : 'units'} occupied`;

  return (
    <PressableScale
      onPress={() => router.push(`/(app)/landlord-property/${p.id}`)}
      haptic={false}
      accessibilityRole="button"
      accessibilityLabel={[p.name, p.address, VERIFICATION_LABEL[p.verificationStatus], units].join(
        ', '
      )}
      style={[
        {
          flexDirection: 'row',
          gap: spacing.md,
          padding: spacing.md,
          borderRadius: radius.lg,
          backgroundColor: colors.card,
        },
        shadows.sm,
      ]}
    >
      <View
        style={{
          width: 80,
          height: 80,
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
            contentFit="cover"
            recyclingKey={p.id}
            cachePolicy="memory-disk"
            accessible={false}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <Building2 size={22} color={colors.mutedForeground} />
        )}
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {p.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <MapPin size={11} color={colors.mutedForeground} />
          <Text variant="caption" color="mutedForeground" numberOfLines={1} style={{ flex: 1 }}>
            {p.address}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          <Badge
            label={VERIFICATION_LABEL[p.verificationStatus]}
            tone={VERIFICATION_TONE[p.verificationStatus]}
          />
          <Badge
            label={p.totalUnits > 0 ? `${occupancy}% occupied` : 'No units yet'}
            tone="neutral"
          />
        </View>
        {p.annualRentRoll > 0 ? (
          <Price amount={p.annualRentRoll} period="year" variant="callout" />
        ) : null}
      </View>
    </PressableScale>
  );
}
