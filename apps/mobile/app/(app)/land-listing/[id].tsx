import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ShieldCheck } from 'lucide-react-native';
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
  formatLandArea,
  landApi,
  LAND_DILIGENCE_LABEL,
  LAND_DILIGENCE_TONE,
  LAND_ENCUMBRANCE_LABEL,
  LAND_ENCUMBRANCE_TONE,
  LAND_TITLE_TYPE_LABEL,
} from '@/lib/api/land';
import { PropertyMapView } from '@/components/property/PropertyMapView';
import { PropertyGallery, toGallery } from '@/components/property/PropertyGallery';
import { formatDate } from '@/lib/format';

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
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing['3xl'], gap: spacing.lg }}
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
                {listing.address}, {listing.city}, {listing.state}
              </Text>
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

            {listing.latitude != null && listing.longitude != null ? (
              <View style={{ gap: spacing.sm }}>
                <Text variant="heading">Location</Text>
                <PropertyMapView
                  markers={[
                    { id: listing.id, latitude: listing.latitude, longitude: listing.longitude },
                  ]}
                  variant="location"
                  zoom={14}
                  height={200}
                />
              </View>
            ) : null}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
