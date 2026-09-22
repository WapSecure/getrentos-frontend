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
  Camera,
  Percent,
  Tags,
  Plus,
  Trash2,
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
import { AddUnitSheet } from '@/components/landlord/AddUnitSheet';
import { ManagementFeeSheet } from '@/components/landlord/SmallFormSheets';
import { pickImage } from '@/lib/filePicker';
import { BulkPriceSheet } from '@/components/landlord/BulkPriceSheet';
import { usePlanTier } from '@/lib/api/subscription';

export default function LandlordPropertyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [assigning, setAssigning] = useState<LandlordUnit | null>(null);
  const [addingUnit, setAddingUnit] = useState(false);
  const [editingFee, setEditingFee] = useState(false);
  const [bulkPricing, setBulkPricing] = useState(false);
  const { isPro } = usePlanTier();

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

  // Deleting is permanent, unlike archiving, so it sits apart and confirms twice over.
  const remove = useMutation({
    mutationFn: () => landlordApi.deleteProperty(id),
    onSuccess: () => {
      invalidate();
      toast.show('Property deleted.', 'success');
      router.back();
    },
    onError: (e) => fail(e, 'Could not delete that property.'),
  });

  /** Uploads a photo and appends its key to the gallery the property already has. */
  const addPhoto = useMutation({
    mutationFn: async () => {
      const file = await pickImage();
      if (!file || !p) return null;
      const { key } = await landlordApi.uploadPropertyMedia(file, 'image');
      return landlordApi.updateProperty(id, {
        galleryImageKeys: [...(p.galleryImageKeys ?? []), key],
      });
    },
    onSuccess: (result) => {
      if (!result) return; // the picker was dismissed
      invalidate();
      toast.show('Photo added.', 'success');
    },
    onError: (e) => fail(e, 'Could not add that photo.'),
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
        <View style={{ flex: 1 }}>
          <Text variant="title" numberOfLines={1}>
            {p?.name ?? 'Property'}
          </Text>
        </View>
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
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text variant="heading" style={{ flex: 1 }}>
                Units
              </Text>
              <Pressable
                onPress={() => setAddingUnit(true)}
                accessibilityRole="button"
                accessibilityLabel="Add a unit"
                hitSlop={10}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <Plus size={15} color={colors.primary} />
                <Text variant="callout" color="primary" style={{ fontWeight: '600' }}>
                  Add unit
                </Text>
              </Pressable>
            </View>
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

          {p && !p.archived ? (
            <Card padding="none">
              <Pressable
                onPress={() => addPhoto.mutate()}
                disabled={addPhoto.isPending}
                accessibilityRole="button"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: spacing.lg,
                }}
              >
                <Camera size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">
                    {addPhoto.isPending ? 'Uploading…' : 'Add a photo'}
                  </Text>
                  <Text variant="caption" color="mutedForeground">
                    {(p.galleryImageKeys ?? []).length} in the gallery
                  </Text>
                </View>
              </Pressable>
              {/* PRO-gated server-side; offering it to a FREE plan would only earn a refusal. */}
              {isPro && unitItems.length > 1 ? (
                <>
                  <Divider />
                  <Pressable
                    onPress={() => setBulkPricing(true)}
                    accessibilityRole="button"
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.md,
                      padding: spacing.lg,
                    }}
                  >
                    <Tags size={18} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong">Set rent for several units</Text>
                      <Text variant="caption" color="mutedForeground">
                        Re-price units in one go
                      </Text>
                    </View>
                  </Pressable>
                </>
              ) : null}
              <Divider />
              <Pressable
                onPress={() => setEditingFee(true)}
                accessibilityRole="button"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: spacing.lg,
                }}
              >
                <Percent size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">Management fee</Text>
                  <Text variant="caption" color="mutedForeground">
                    What you take from this property&apos;s rent
                  </Text>
                </View>
              </Pressable>
            </Card>
          ) : null}

          {p ? (
            <Pressable
              onPress={() =>
                Alert.alert(
                  'Delete this property?',
                  'This cannot be undone. Archive it instead if you may want it back.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => remove.mutate() },
                  ]
                )
              }
              disabled={remove.isPending}
              accessibilityRole="button"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: spacing.md,
              }}
            >
              <Trash2 size={15} color={colors.destructive} />
              <Text variant="callout" color="destructive">
                Delete property
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      )}

      <EditPropertySheet open={editing} onClose={() => setEditing(false)} property={p ?? null} />
      <AssignTenantSheet open={!!assigning} onClose={() => setAssigning(null)} unit={assigning} />
      <AddUnitSheet open={addingUnit} onClose={() => setAddingUnit(false)} propertyId={id} />
      <ManagementFeeSheet open={editingFee} onClose={() => setEditingFee(false)} propertyId={id} />
      <BulkPriceSheet open={bulkPricing} onClose={() => setBulkPricing(false)} units={unitItems} />
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
