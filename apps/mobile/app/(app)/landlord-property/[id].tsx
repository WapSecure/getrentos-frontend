import { formatLocation } from '@sureground/shared';
import { useEffect, useRef, useState } from 'react';
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
} from '@sureground/icons/native';
import {
  Badge,
  Card,
  Divider,
  IconButton,
  Price,
  QueryState,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  landlordApi,
  OCCUPANCY_LABEL,
  OCCUPANCY_TONE,
  VERIFICATION_LABEL,
  VERIFICATION_TONE,
  type LandlordUnit,
} from '@/lib/api/landlord';
import { abortError, errorMessage } from '@/lib/api/client';
import { EditPropertySheet } from '@/components/landlord/EditPropertySheet';
import { RecordOccupierSheet } from '@/components/landlord/RecordOccupierSheet';
import { AddUnitSheet } from '@/components/landlord/AddUnitSheet';
import { ManagementFeeSheet } from '@/components/landlord/SmallFormSheets';
import { pickPhotos, type PickedVideo } from '@/lib/filePicker';
import { usePhotoUploads } from '@/lib/usePhotoUploads';
import { PhotoUploadList } from '@/components/media/PhotoUploadList';
import { VideoTourField } from '@/components/video/VideoTourField';
import type { VideoOnSiteReport } from '@/lib/filmedOnSite';
import type { UploadTaskOptions } from '@/lib/uploadQueue';
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

  // No single-property route: read from the list, sharing its query key so arriving from the list costs no refetch.
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
  const fail = (e: unknown, fallback: string) => toast.show(errorMessage(e, fallback), 'error');

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

  // Attaching replaces the gallery, so it builds on the newest list: a refetch may not have landed yet.
  const galleryKeys = useRef<string[]>([]);
  useEffect(() => {
    galleryKeys.current = p?.galleryImageKeys ?? [];
  }, [p?.galleryImageKeys]);
  const photoUploads = usePhotoUploads({
    upload: (file, options) => landlordApi.uploadPropertyPhoto(file, options),
    attach: async (added) => {
      const next = [...galleryKeys.current, ...added];
      const updated = await landlordApi.updateProperty(id, { galleryImageKeys: next });
      galleryKeys.current = updated?.galleryImageKeys ?? next;
      invalidate();
      toast.show(added.length === 1 ? 'Photo added.' : `${added.length} photos added.`, 'success');
    },
  });
  const addPhotos = async () => {
    try {
      photoUploads.add(await pickPhotos());
    } catch (e) {
      fail(e, 'Could not open your photos.');
    }
  };

  const attachVideo = async (
    file: PickedVideo,
    onSite: VideoOnSiteReport | null,
    options: UploadTaskOptions
  ) => {
    const previous = p?.videoTourKey;
    const key = await landlordApi.uploadPropertyVideo(file, options);
    try {
      // Cancelled while storage was checking it: don't attach.
      if (options.signal.aborted) throw abortError();
      await landlordApi.updateProperty(id, {
        videoTourKey: key,
        videoTourOnSite: onSite ?? undefined,
      });
    } catch (e) {
      // Not attached, so it is only staging: don't leave it behind.
      landlordApi.removePropertyMedia(key).catch(() => undefined);
      throw e;
    }
    // Detached now, so the old file can go; the server refuses if it is still in use.
    if (previous) landlordApi.removePropertyMedia(previous).catch(() => undefined);
    invalidate();
  };
  const removeVideo = async () => {
    const previous = p?.videoTourKey;
    await landlordApi.updateProperty(id, { videoTourKey: null });
    if (previous) landlordApi.removePropertyMedia(previous).catch(() => undefined);
    invalidate();
  };

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
        <IconButton
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          icon={<ChevronLeft size={22} color={colors.foreground} />}
        />
        <View style={{ flex: 1 }}>
          {/* Two action buttons share this row, so long names wrap instead of cutting to a few letters. */}
          <Text variant="heading" numberOfLines={2}>
            {p?.name ?? 'Property'}
          </Text>
        </View>
        {p && !p.archived ? (
          <>
            <IconButton
              onPress={() => setEditing(true)}
              accessibilityLabel="Edit property"
              icon={<Pencil size={19} color={colors.foreground} />}
            />
            <IconButton
              onPress={() =>
                Alert.alert('Archive property?', 'It will stop appearing in your active list.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Archive', style: 'destructive', onPress: () => archive.mutate() },
                ])
              }
              accessibilityLabel="Archive property"
              icon={<Archive size={19} color={colors.mutedForeground} />}
            />
          </>
        ) : null}
      </View>

      <QueryState
        query={property}
        skeleton={<Skeleton height={170} radius={radius.lg} />}
        isEmpty={!p}
        empty={{
          icon: <Building2 size={30} color={colors.mutedForeground} />,
          title: 'Property not found',
          description: 'It may have been archived or removed since this screen was opened.',
        }}
        style={{ paddingHorizontal: spacing.xl }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
            gap: spacing.lg,
          }}
        >
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
                cachePolicy="memory-disk"
                recyclingKey={p.id}
                accessible={false}
              />
            ) : (
              <Building2 size={30} color={colors.mutedForeground} />
            )}
          </View>

          {p ? (
            <View style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Badge
                  label={VERIFICATION_LABEL[p.verificationStatus]}
                  tone={VERIFICATION_TONE[p.verificationStatus]}
                />
                {p.archived ? <Badge label="Archived" tone="neutral" /> : null}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <MapPin size={14} color={colors.mutedForeground} />
                <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
                  {formatLocation(p.address, p.city, p.state)}
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
                        {/* The tenancy's rent is the money actually coming in, so it
                            wins over the asking rent once one exists. */}
                        <Price
                          amount={u.leaseRent ?? u.askingRent}
                          period={u.leaseRentPeriod ?? u.askingRentPeriod}
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
                            accessibilityLabel={`Record an occupier for ${u.unitName}`}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                          >
                            <UserPlus size={13} color={colors.primary} />
                            <Text variant="caption" color="primary" style={{ fontWeight: '600' }}>
                              Record occupier
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
            <VideoTourField
              title={p.name}
              hasVideo={!!p.videoTourKey}
              filmedOnSite={p.videoTourFilmedOnSite}
              videoUrl={p.videoTourUrl}
              onUpload={attachVideo}
              onRemove={removeVideo}
              onExpired={() => property.refetch()}
            />
          ) : null}

          {p && !p.archived ? (
            <Card padding="none">
              <Pressable
                onPress={() => void addPhotos()}
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
                  <Text variant="bodyStrong">Add photos</Text>
                  <Text variant="caption" color="mutedForeground">
                    {photoUploads.busy
                      ? 'Uploading. You can keep adding photos.'
                      : `${(p.galleryImageKeys ?? []).length} in the gallery`}
                  </Text>
                </View>
              </Pressable>
              {photoUploads.pending.length ? (
                <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
                  <PhotoUploadList
                    pending={photoUploads.pending}
                    states={photoUploads.states}
                    failed={photoUploads.failed}
                    onRemove={photoUploads.remove}
                    onRetry={photoUploads.retry}
                  />
                </View>
              ) : null}
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
      </QueryState>

      <EditPropertySheet open={editing} onClose={() => setEditing(false)} property={p ?? null} />
      <RecordOccupierSheet open={!!assigning} onClose={() => setAssigning(null)} unit={assigning} />
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
