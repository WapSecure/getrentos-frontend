import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  ChevronLeft,
  FileSignature,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Divider,
  ErrorState,
  Price,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  formatLandArea,
  landApi,
  LAND_DILIGENCE_LABEL,
  LAND_DILIGENCE_TONE,
  LAND_ENCUMBRANCE_LABEL,
  LAND_ENCUMBRANCE_TONE,
  LAND_TITLE_TYPE_LABEL,
} from '@/lib/api/land';
import { PropertyMapView } from '@/components/property/PropertyMapView';
import { boundaryCorners } from '@getrentos/shared';
import { PropertyGallery, toGallery } from '@/components/property/PropertyGallery';
import { formatDate } from '@/lib/format';
import { useAuth } from '@/lib/auth/AuthProvider';
import { accountRolesApi } from '@/lib/api/accountRoles';
import { ApiError } from '@/lib/api/client';
import { useAskSeller } from '@/hooks/useAskSeller';
import { MakeOfferSheet } from '@/components/buyer/MakeOfferSheet';
import { RequestViewingSheet } from '@/components/buyer/RequestViewingSheet';

function Fact({ label, value }: { label: string; value?: string | null }) {
  const { spacing } = useTheme();
  if (!value) return null;
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.md,
        paddingVertical: 6,
      }}
    >
      <Text variant="callout" color="mutedForeground">
        {label}
      </Text>
      <Text variant="callout" style={{ flex: 1, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}

export default function LandListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const query = useQuery({ queryKey: qk.land.detail(id), queryFn: () => landApi.get(id) });
  const listing = query.data;
  const outline = boundaryCorners(listing?.parcel.boundaryGeometry);
  const toast = useToast();
  const { workspaces, refreshProfile } = useAuth();
  // Questions, viewings and offers come from a buyer account, as on the web.
  const isBuyer = workspaces.includes('buyer');
  const [offerOpen, setOfferOpen] = useState(false);
  const [viewingOpen, setViewingOpen] = useState(false);
  const ask = useAskSeller();
  const addBuyer = useMutation({
    mutationFn: () => accountRolesApi.add('buyer'),
    onSuccess: async () => {
      // Stay on this parcel: the buttons appear once the profile has the role.
      await refreshProfile();
      toast.show('Buyer account added. You can now ask, view and offer.', 'success');
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not add a buyer account.', 'error'),
  });
  const target = listing
    ? { id: listing.id, title: listing.title, askingPrice: listing.price }
    : null;

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
          accessibilityLabel="Back"
          hitSlop={10}
        >
          <ChevronLeft size={24} color={colors.foreground} />
        </Pressable>
        <Text variant="title" style={{ flex: 1 }} numberOfLines={1}>
          {listing?.title ?? 'Land'}
        </Text>
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : !listing ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          <Skeleton height={200} radius={radius.lg} />
        </View>
      ) : (
        <>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: insets.bottom + 140, gap: spacing.lg }}
          >
            <PropertyGallery
              images={toGallery(listing.coverImageUrl, listing.galleryImageUrls)}
              height={220}
              emptyLabel="No photos for this parcel yet"
            />

            <View style={{ paddingHorizontal: spacing.xl, gap: spacing.lg }}>
              <View style={{ gap: 4 }}>
                <Price amount={listing.price} variant="display" />
                <Text variant="callout" color="mutedForeground">
                  {[listing.address, listing.city, listing.state].filter(Boolean).join(', ')}
                </Text>
                {listing.addressHidden ? (
                  <Text variant="caption" color="mutedForeground">
                    The exact address is shared once the property is verified.
                  </Text>
                ) : null}
                <Text variant="bodyStrong" style={{ marginTop: 4 }}>
                  {formatLandArea(listing.parcel.areaValue, listing.parcel.areaUnit)}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                <Badge
                  label={LAND_DILIGENCE_LABEL[listing.diligence.status]}
                  tone={LAND_DILIGENCE_TONE[listing.diligence.status]}
                />
                <Badge
                  label={`Encumbrance: ${LAND_ENCUMBRANCE_LABEL[listing.parcel.encumbranceStatus]}`}
                  tone={LAND_ENCUMBRANCE_TONE[listing.parcel.encumbranceStatus]}
                />
                {listing.parcel.subdivisionAllowed ? (
                  <Badge label="Subdivision allowed" tone="info" />
                ) : null}
                {listing.parcel.fractionalOwnershipAllowed ? (
                  <Badge label="Fractional ownership" tone="info" />
                ) : null}
              </View>

              {listing.diligence.status === 'VERIFIED' ? (
                <Card
                  elevated
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    backgroundColor: colors.successSubtle,
                  }}
                >
                  <ShieldCheck size={20} color={colors.success} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong" style={{ color: colors.success }}>
                      Title diligence verified
                    </Text>
                    <Text variant="caption" color="mutedForeground">
                      {listing.diligence.reviewedAt
                        ? `Reviewed ${formatDate(listing.diligence.reviewedAt, 'medium')}`
                        : 'Reviewed by GetRentos'}
                      {listing.diligence.expiresAt
                        ? ` · valid to ${formatDate(listing.diligence.expiresAt, 'medium')}`
                        : ''}
                    </Text>
                  </View>
                </Card>
              ) : null}

              <Divider />

              <View style={{ gap: spacing.sm }}>
                <Text variant="heading">About this parcel</Text>
                <Text variant="body" color="mutedForeground">
                  {listing.description}
                </Text>
              </View>

              <View style={{ gap: spacing.sm }}>
                <Text variant="heading">Parcel facts</Text>
                <Card elevated>
                  <Fact label="Plot" value={listing.parcel.plotNumber} />
                  <Fact label="Block" value={listing.parcel.block} />
                  <Fact label="Estate" value={listing.parcel.estateName} />
                  <Fact
                    label="Area"
                    value={formatLandArea(listing.parcel.areaValue, listing.parcel.areaUnit)}
                  />
                  <Fact
                    label="Frontage"
                    value={listing.parcel.frontage ? `${listing.parcel.frontage} m` : undefined}
                  />
                  <Fact
                    label="Depth"
                    value={listing.parcel.depth ? `${listing.parcel.depth} m` : undefined}
                  />
                  <Fact label="Zoning" value={listing.parcel.zoning} />
                  <Fact label="Permitted use" value={listing.parcel.permittedUse} />
                  <Fact label="Terrain" value={listing.parcel.terrain} />
                  <Fact
                    label="Road access"
                    value={
                      listing.parcel.roadAccess == null
                        ? undefined
                        : listing.parcel.roadAccess
                          ? 'Yes'
                          : 'No'
                    }
                  />
                  <Fact
                    label="Title type"
                    value={
                      listing.parcel.titleType
                        ? LAND_TITLE_TYPE_LABEL[listing.parcel.titleType]
                        : undefined
                    }
                  />
                  <Fact label="Tenure" value={listing.parcel.tenure} />
                </Card>
                <Text variant="caption" color="mutedForeground">
                  Title and survey numbers are shared with serious buyers after an enquiry, not
                  published publicly.
                </Text>
              </View>

              {listing.parcel.utilities?.length ? (
                <View style={{ gap: spacing.sm }}>
                  <Text variant="heading">Utilities</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                    {listing.parcel.utilities.map((u) => (
                      <Badge key={u} label={u} tone="neutral" />
                    ))}
                  </View>
                </View>
              ) : null}

              {listing.parcel.boundaryNotes ? (
                <View style={{ gap: spacing.sm }}>
                  <Text variant="heading">Boundaries</Text>
                  <Text variant="body" color="mutedForeground">
                    {listing.parcel.boundaryNotes}
                  </Text>
                </View>
              ) : null}

              {outline || (listing.latitude != null && listing.longitude != null) ? (
                <View style={{ gap: spacing.sm }}>
                  <Text variant="heading">Location</Text>
                  <PropertyMapView
                    markers={
                      listing.latitude != null && listing.longitude != null
                        ? [
                            {
                              id: listing.id,
                              latitude: listing.latitude,
                              longitude: listing.longitude,
                            },
                          ]
                        : []
                    }
                    variant={listing.locationPrecision === 'approximate' ? 'area' : 'location'}
                    boundary={outline ?? undefined}
                    zoom={14}
                    height={outline ? 240 : 200}
                  />
                  {outline ? (
                    <Text variant="caption" color="mutedForeground">
                      The shaded outline is the plot as drawn by the owner.
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          </ScrollView>

          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              gap: spacing.sm,
              padding: spacing.xl,
              paddingBottom: insets.bottom + spacing.sm,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: colors.background,
            }}
          >
            {isBuyer ? (
              <>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Button
                    label="Request viewing"
                    variant="outline"
                    icon={<Calendar size={16} color={colors.foreground} />}
                    style={{ flex: 1 }}
                    onPress={() => setViewingOpen(true)}
                  />
                  <Button
                    label="Make offer"
                    icon={<FileSignature size={16} color={colors.primaryForeground} />}
                    style={{ flex: 1 }}
                    onPress={() => setOfferOpen(true)}
                  />
                </View>
                <Button
                  label={ask.isPending ? 'Opening chat…' : 'Ask the seller a question'}
                  variant="ghost"
                  icon={<MessageCircle size={16} color={colors.foreground} />}
                  disabled={ask.isPending}
                  onPress={() => ask.mutate(listing.id)}
                />
              </>
            ) : (
              <>
                <Text variant="caption" color="mutedForeground">
                  Questions, viewings and offers on land come from a buyer account. Add one to this
                  account to go ahead.
                </Text>
                <Button
                  label={addBuyer.isPending ? 'Adding…' : 'Add a buyer account'}
                  disabled={addBuyer.isPending}
                  onPress={() => addBuyer.mutate()}
                />
              </>
            )}
          </View>

          <RequestViewingSheet
            open={viewingOpen}
            onClose={() => setViewingOpen(false)}
            listing={target}
          />
          <MakeOfferSheet open={offerOpen} onClose={() => setOfferOpen(false)} listing={target} />
        </>
      )}
    </View>
  );
}
