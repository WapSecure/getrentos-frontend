import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { BedDouble, Building2, ChevronLeft, MapPin, ShowerHead } from 'lucide-react-native';
import {
  Badge,
  Card,
  Divider,
  ErrorState,
  Price,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  landlordApi,
  OCCUPANCY_LABEL,
  OCCUPANCY_TONE,
  VERIFICATION_TONE,
} from '@/lib/api/landlord';

export default function LandlordPropertyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const property = useQuery({
    queryKey: qk.landlord.property(id),
    queryFn: () => landlordApi.property(id),
    enabled: !!id,
  });

  const units = useQuery({
    queryKey: qk.landlord.units(id),
    queryFn: () => landlordApi.units(id),
    enabled: !!id,
  });

  const p = property.data;
  const unitItems = units.data?.items ?? [];

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
        <Text variant="title" numberOfLines={1} style={{ flex: 1 }}>
          {p?.name ?? 'Property'}
        </Text>
      </View>

      {property.isError ? (
        <ErrorState onRetry={() => property.refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
            gap: spacing.lg,
          }}
        >
          {property.isLoading ? (
            <Skeleton height={170} radius={radius.lg} />
          ) : (
            <View
              style={{
                height: 170,
                borderRadius: radius.lg,
                overflow: 'hidden',
                backgroundColor: colors.secondary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {p?.coverImage ? (
                <Image
                  source={{ uri: p.coverImage }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <Building2 size={30} color={colors.mutedForeground} />
              )}
            </View>
          )}

          {p ? (
            <View style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Badge
                  label={p.verificationStatus}
                  tone={VERIFICATION_TONE[p.verificationStatus]}
                />
                {p.archived ? <Badge label="Archived" tone="neutral" /> : null}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <MapPin size={14} color={colors.mutedForeground} />
                <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
                  {p.address}, {p.city}, {p.state}
                </Text>
              </View>

              {p.description ? (
                <Text variant="callout" color="mutedForeground">
                  {p.description}
                </Text>
              ) : null}
            </View>
          ) : null}

          {p ? (
            <Card elevated>
              <View style={{ flexDirection: 'row' }}>
                <Metric label="Units" value={`${p.totalUnits}`} />
                <Metric label="Occupied" value={`${p.occupiedUnits}`} />
                <Metric
                  label="Rent roll"
                  value={p.annualRentRoll > 0 ? undefined : '—'}
                  amount={p.annualRentRoll > 0 ? p.annualRentRoll : undefined}
                />
              </View>
            </Card>
          ) : null}

          <View style={{ gap: spacing.md }}>
            <Text variant="heading">Units</Text>
            {units.isLoading ? (
              <Skeleton height={80} radius={radius.lg} />
            ) : unitItems.length === 0 ? (
              <Text variant="callout" color="mutedForeground">
                No units on this property yet.
              </Text>
            ) : (
              <Card padding="none">
                {unitItems.map((u, i) => (
                  <View key={u.id}>
                    {i > 0 ? <Divider /> : null}
                    <View style={{ padding: spacing.lg, gap: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                        <Text variant="bodyStrong" style={{ flex: 1 }}>
                          {u.unitName}
                        </Text>
                        <Badge
                          label={OCCUPANCY_LABEL[u.occupancyStatus]}
                          tone={OCCUPANCY_TONE[u.occupancyStatus]}
                        />
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <BedDouble size={13} color={colors.mutedForeground} />
                          <Text variant="caption" color="mutedForeground">
                            {u.bedrooms}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <ShowerHead size={13} color={colors.mutedForeground} />
                          <Text variant="caption" color="mutedForeground">
                            {u.bathrooms}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }} />
                        <Price
                          amount={u.askingRent}
                          period={u.askingRentPeriod}
                          variant="callout"
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </Card>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function Metric({ label, value, amount }: { label: string; value?: string; amount?: number }) {
  const { spacing } = useTheme();
  return (
    <View style={{ flex: 1, gap: 2, paddingVertical: spacing.xs }}>
      {amount !== undefined ? (
        <Price amount={amount} variant="bodyStrong" compact />
      ) : (
        <Text variant="bodyStrong">{value}</Text>
      )}
      <Text variant="caption" color="mutedForeground">
        {label}
      </Text>
    </View>
  );
}
