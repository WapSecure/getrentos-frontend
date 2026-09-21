import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  Archive,
  BedDouble,
  Building2,
  ChevronLeft,
  DoorOpen,
  MapPin,
  Pencil,
  ShowerHead,
  UserPlus,
} from 'lucide-react-native';
import {
  Badge,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  Price,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  landlordApi,
  OCCUPANCY_LABEL,
  OCCUPANCY_TONE,
  VERIFICATION_TONE,
  type LandlordUnit,
} from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';
import { EditPropertySheet } from '@/components/landlord/EditPropertySheet';
import { AssignTenantSheet } from '@/components/landlord/AssignTenantSheet';

export default function LandlordPropertyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [assigning, setAssigning] = useState<LandlordUnit | null>(null);

  // The API has no single-property route — the list is the source of truth,
  // and sharing its query key means arriving from the list costs no refetch.
  const property = useQuery({
    queryKey: qk.landlord.properties(),
    queryFn: () => landlordApi.properties(),
  });

  const units = useQuery({
    queryKey: qk.landlord.units(id),
    queryFn: () => landlordApi.units(id),
    enabled: !!id,
  });

  const p = property.data?.items.find((item) => item.id === id);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['landlord', 'properties'] });
    qc.invalidateQueries({ queryKey: ['landlord', 'units'] });
  };
  const fail = (e: unknown, fallback: string) =>
    toast.show(e instanceof ApiError ? e.message : fallback, 'error');

  const archive = useMutation({
    mutationFn: () => landlordApi.archiveProperty(id),
    onSuccess: () => {
      invalidate();
      toast.show('Property archived.', 'success');
      router.back();
    },
    onError: (e) => fail(e, 'Could not archive that property.'),
  });

  const markVacant = useMutation({
    mutationFn: (unitId: string) => landlordApi.markUnitVacant(unitId),
    onSuccess: () => {
      invalidate();
      toast.show('Unit marked vacant.', 'success');
    },
    onError: (e) => fail(e, 'Could not update that unit.'),
  });
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
        {p && !p.archived ? (
          <>
            <Pressable
              onPress={() => setEditing(true)}
              accessibilityRole="button"
              accessibilityLabel="Edit property"
              hitSlop={10}
              style={{ marginRight: spacing.lg }}
            >
              <Pencil size={19} color={colors.foreground} />
            </Pressable>
            <Pressable
              onPress={() =>
                Alert.alert('Archive property?', 'It will stop appearing in your active list.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Archive', style: 'destructive', onPress: () => archive.mutate() },
                ])
              }
              accessibilityRole="button"
              accessibilityLabel="Archive property"
              hitSlop={10}
            >
              <Archive size={19} color={colors.mutedForeground} />
            </Pressable>
          </>
        ) : null}
      </View>

      {property.isError ? (
        <ErrorState onRetry={() => property.refetch()} />
      ) : !property.isLoading && !p ? (
        <EmptyState
          icon={<Building2 size={30} color={colors.mutedForeground} />}
          title="Property not found"
          description="It may have been archived or removed since this screen was opened."
        />
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

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
                        {u.occupancyStatus === 'occupied' ? (
                          <Pressable
                            onPress={() => markVacant.mutate(u.id)}
                            accessibilityRole="button"
                            accessibilityLabel={`Mark ${u.unitName} vacant`}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                          >
                            <DoorOpen size={13} color={colors.mutedForeground} />
                            <Text variant="caption" color="mutedForeground">
                              Mark vacant
                            </Text>
                          </Pressable>
                        ) : (
                          <Pressable
                            onPress={() => setAssigning(u)}
                            accessibilityRole="button"
                            accessibilityLabel={`Assign a tenant to ${u.unitName}`}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                          >
                            <UserPlus size={13} color={colors.primary} />
                            <Text variant="caption" color="primary" style={{ fontWeight: '600' }}>
                              Assign a tenant
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </Card>
            )}
          </View>
        </ScrollView>
      )}

      <EditPropertySheet open={editing} onClose={() => setEditing(false)} property={p ?? null} />
      <AssignTenantSheet open={!!assigning} onClose={() => setAssigning(null)} unit={assigning} />
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
