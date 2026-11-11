import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  ChevronLeft,
  FileSignature,
  FileText,
  MessageCircle,
  ShieldCheck,
} from '@sureground/icons/native';
import {
  Badge,
  Button,
  Card,
  DetailSkeleton,
  Divider,
  Price,
  QueryState,
  Text,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  formatLandArea,
  landApi,
  LAND_DILIGENCE_LABEL,
  LAND_DILIGENCE_TONE,
  LAND_ENCUMBRANCE_LABEL,
  LAND_ENCUMBRANCE_TONE,
} from '@/lib/api/land';
import { PropertyMapView } from '@/components/property/PropertyMapView';
import { boundaryCorners } from '@sureground/shared';
import { ShowroomMedia, useTrackDetailView } from '@/components/showroom/ShowroomMedia';
import {
  ShowroomCostsCard,
  ShowroomFacts,
  ShowroomPriceBar,
} from '@/components/showroom/ShowroomParts';
import { trackShowroom } from '@/lib/showroomAnalytics';
import { fromLand } from '@sureground/shared/showroom';
import { formatDate } from '@/lib/format';
import { useAuth } from '@/lib/auth/AuthProvider';
import { accountRolesApi } from '@/lib/api/accountRoles';
import { RequestInspection, RequestTour } from '@/components/land/LandRequests';
import { TrustChecks } from '@/components/land/TrustChecks';
import { PriceComparison } from '@/components/land/PriceComparison';
import { Sheet } from '@/components/Sheet';
import { errorMessage } from '@/lib/api/client';
import { useAskSeller } from '@/hooks/useAskSeller';
import { MakeOfferSheet } from '@/components/buyer/MakeOfferSheet';
import { RequestViewingSheet } from '@/components/buyer/RequestViewingSheet';

export default function LandListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const query = useQuery({ queryKey: qk.land.detail(id), queryFn: () => landApi.get(id) });
  const listing = query.data;
  // Shared with the web showroom, so both show the same parcel facts, costs and photos.
  const showroom = useMemo(() => (listing ? fromLand(listing) : undefined), [listing]);
  useTrackDetailView(listing?.id, 'land');
  const outline = boundaryCorners(listing?.parcel.boundaryGeometry);
  const toast = useToast();
  const { workspaces, refreshProfile } = useAuth();
  // Questions, viewings and offers come from a buyer account, as on the web.
  const isBuyer = workspaces.includes('buyer');
  const [offerOpen, setOfferOpen] = useState(false);
  const [viewingOpen, setViewingOpen] = useState(false);
  const [request, setRequest] = useState<'tour' | 'inspection' | null>(null);
  const ask = useAskSeller();
  const addBuyer = useMutation({
    mutationFn: () => accountRolesApi.add('buyer'),
    onSuccess: async () => {
      // Stay on this parcel: the buttons appear once the profile has the role.
      await refreshProfile();
      toast.show('Buyer account added. You can now ask, view and offer.', 'success');
    },
    onError: (err) => toast.show(errorMessage(err, 'Could not add a buyer account.'), 'error'),
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

      <QueryState
        query={query}
        style={{ paddingHorizontal: spacing.xl }}
        skeleton={<DetailSkeleton />}
      >
        {listing ? (
          <>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: insets.bottom + 140, gap: spacing.lg }}
            >
              {showroom ? (
                <ShowroomMedia
                  listingId={listing.id}
                  market="land"
                  items={showroom.media}
                  title={listing.title}
                  height={260}
                  emptyLabel="No photos for this parcel yet"
                  onVideoExpired={() => void query.refetch()}
                />
              ) : null}

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
                          : 'Reviewed by Sureground'}
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

                {showroom ? (
                  <ShowroomCostsCard
                    market="land"
                    costs={showroom.costs}
                    price={showroom.price}
                    footer={
                      isBuyer ? (
                        <Button
                          label="Make an offer"
                          variant="secondary"
                          icon={<FileSignature size={16} color={colors.foreground} />}
                          onPress={() => {
                            trackShowroom({
                              name: 'offer_start',
                              listingId: listing.id,
                              market: 'land',
                            });
                            setOfferOpen(true);
                          }}
                        />
                      ) : null
                    }
                  />
                ) : null}

                <View style={{ gap: spacing.sm }}>
                  {showroom ? <ShowroomFacts facts={showroom.facts} title="Parcel facts" /> : null}
                  <Text variant="caption" color="mutedForeground">
                    Title and survey numbers are shared with serious buyers after an enquiry, not
                    published publicly.
                  </Text>
                </View>

                {isBuyer ? (
                  <View style={{ gap: spacing.sm }}>
                    <Text variant="heading">More ways to check this land</Text>
                    <Button
                      label="Ask for a live video tour"
                      variant="outline"
                      onPress={() => setRequest('tour')}
                    />
                    <Button
                      label="Commission an independent inspection"
                      variant="outline"
                      onPress={() => {
                        trackShowroom({
                          name: 'inspection_request_start',
                          listingId: listing.id,
                          market: 'land',
                          props: { variant: 'independent' },
                        });
                        setRequest('inspection');
                      }}
                    />
                    <Button
                      label="Ask the seller a question"
                      loadingLabel="Opening chat…"
                      variant="ghost"
                      icon={<MessageCircle size={16} color={colors.foreground} />}
                      loading={ask.isPending}
                      onPress={() => ask.mutate(listing.id)}
                    />
                  </View>
                ) : (
                  <Card style={{ gap: spacing.xs }}>
                    <Text variant="bodyStrong">Buying land needs a buyer account</Text>
                    <Text variant="caption" color="mutedForeground">
                      Questions, inspections and offers on land come from a buyer account. Add one
                      to this account to go ahead.
                    </Text>
                  </Card>
                )}

                {listing.diligence.assuranceTier ||
                listing.diligence.labels?.length ||
                listing.diligence.notVerified?.length ? (
                  <Card elevated style={{ gap: spacing.md }}>
                    <Text variant="heading">What was checked</Text>
                    <TrustChecks
                      tier={listing.diligence.assuranceTier}
                      labels={listing.diligence.labels}
                      notVerified={listing.diligence.notVerified}
                      compact
                    />
                  </Card>
                ) : null}

                <PriceComparison listingId={listing.id} />

                <Button
                  label="Decision dossier and all-in cost"
                  variant="secondary"
                  icon={<FileText size={16} color={colors.foreground} />}
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/land-dossier',
                      params: { listingId: listing.id },
                    })
                  }
                />

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

            <ShowroomPriceBar
              price={listing.price}
              caption={
                <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                  {formatLandArea(listing.parcel.areaValue, listing.parcel.areaUnit)}
                </Text>
              }
              action={
                isBuyer ? (
                  <Button
                    label="Request inspection"
                    fullWidth={false}
                    icon={<Calendar size={16} color={colors.primaryForeground} />}
                    onPress={() => {
                      trackShowroom({
                        name: 'inspection_request_start',
                        listingId: listing.id,
                        market: 'land',
                        surface: 'app_sticky_bar',
                      });
                      setViewingOpen(true);
                    }}
                  />
                ) : (
                  <Button
                    label="Add a buyer account"
                    loadingLabel="Adding…"
                    fullWidth={false}
                    loading={addBuyer.isPending}
                    onPress={() => addBuyer.mutate()}
                  />
                )
              }
            />

            <Sheet
              open={!!request}
              onClose={() => setRequest(null)}
              title={
                request === 'tour'
                  ? 'Ask for a live video tour'
                  : 'Commission an independent inspection'
              }
            >
              {request === 'tour' ? (
                <RequestTour
                  target={{ listingId: listing.id }}
                  landName={listing.title}
                  onDone={() => setRequest(null)}
                />
              ) : request === 'inspection' ? (
                <RequestInspection
                  target={{ listingId: listing.id }}
                  landName={listing.title}
                  onDone={() => setRequest(null)}
                />
              ) : null}
            </Sheet>
            <RequestViewingSheet
              open={viewingOpen}
              onClose={() => setViewingOpen(false)}
              listing={target}
            />
            <MakeOfferSheet open={offerOpen} onClose={() => setOfferOpen(false)} listing={target} />
          </>
        ) : null}
      </QueryState>
    </View>
  );
}
