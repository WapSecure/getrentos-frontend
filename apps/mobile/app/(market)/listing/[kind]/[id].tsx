import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { formatLocation } from '@sureground/shared';
import { Dimensions, FlatList, ScrollView, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  Check,
  ChevronLeft,
  Heart,
  Lock,
  MapPin,
  Share2,
  ShieldCheck,
  Star,
} from '@sureground/icons/native';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  LinkButton,
  Price,
  PropertyCard,
  QueryState,
  SectionHeader,
  Skeleton,
  Text,
  useTheme,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  isMarketKind,
  MARKET_LABEL,
  marketWebPath,
  publicMarketApi,
  type MarketDetail,
  type MarketKind,
} from '@/lib/api/publicMarket';
import { env } from '@/lib/env';
import { track } from '@/lib/analytics';
import { rememberListing } from '@/lib/pendingListing';
import { PriceComparison } from '@/components/land/PriceComparison';
import { ShowroomMedia, useTrackDetailView } from '@/components/showroom/ShowroomMedia';
import {
  KeyFactsRow,
  ShowroomCostsCard,
  ShowroomFacts,
  ShowroomPriceBar,
} from '@/components/showroom/ShowroomParts';
import { trackShowroom } from '@/lib/showroomAnalytics';
import { ShowroomCommercial } from '@/components/showroom/ShowroomCommercial';
import { vatStated } from '@sureground/shared/showroom';
import { PropertyMapView } from '@/components/property/PropertyMapView';
import { useMarketSaved } from '@/hooks/useMarketSaved';
import { useCardAnalytics } from '@/hooks/useCardAnalytics';
import { visibleFraction } from '@/lib/cardImpressions';
import type { ShortletListing } from '@/lib/api/shortlets';
import { nightsLabel, seasonRange } from '@/lib/stays';
import { GuestPromiseCard, SupportContact, TrustChips } from '@/components/shortlet/StayUI';
import {
  EssentialsBlock,
  FairPriceNote,
  InspectionBlock,
  PricingBlock,
  RulesBlock,
} from '@/components/shortlet/StaySections';

// One primary action per market; each signs in first and comes back to this listing.
const CTA: Record<MarketKind, { label: string; a11y: string }> = {
  rent: { label: 'Request viewing', a11y: 'Sign in to request a viewing' },
  sale: { label: 'Request inspection', a11y: 'Sign in to request an inspection' },
  land: { label: 'Request inspection', a11y: 'Sign in to request an inspection' },
  shortlet: { label: 'Sign in to book', a11y: 'Sign in to book' },
};

const START_EVENT = {
  rent: 'inspection_request_start',
  sale: 'inspection_request_start',
  land: 'inspection_request_start',
  shortlet: 'booking_start',
} as const;

export default function PublicListing() {
  const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const valid = isMarketKind(kind) && !!id;
  const saved = useMarketSaved(isMarketKind(kind) ? kind : 'rent');

  const query = useQuery({
    queryKey: qk.market.detail(String(kind), String(id)),
    queryFn: () => publicMarketApi.detail(kind as MarketKind, id),
    enabled: valid,
  });
  const p = query.data;
  useTrackDetailView(p?.id, isMarketKind(kind) ? kind : 'rent');

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(market)'));
  // Sections that count impressions re-measure themselves when the page scrolls.
  const [scrollListeners] = useState(() => new Set<() => void>());

  const share = async () => {
    if (!p || !valid) return;
    track('market_listing_shared', { kind });
    trackShowroom({ name: 'property_share', listingId: p.id, market: kind as MarketKind });
    await Share.share({
      message: `${p.title} · ${formatLocation(p.location)}\n${env.webUrl}${marketWebPath(kind as MarketKind, p.id)}`,
    }).catch(() => undefined);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
        onScroll={() => scrollListeners.forEach((listener) => listener())}
        scrollEventThrottle={200}
      >
        {p && valid ? (
          <ShowroomMedia
            listingId={p.id}
            market={kind as MarketKind}
            items={p.media}
            floorPlans={p.floorPlans}
            title={p.title}
            height={320}
            onVideoExpired={() => void query.refetch()}
          />
        ) : (
          <View style={{ height: 320, backgroundColor: colors.muted }} />
        )}

        <View style={{ padding: spacing.xl, gap: spacing['2xl'] }}>
          {!valid ? (
            <EmptyState
              title="Listing not found"
              description="This link doesn’t point to a listing."
            />
          ) : (
            <QueryState
              query={query}
              errorTitle="We couldn’t load this listing"
              errorDescription="It may have been taken down, or your connection dropped."
              skeleton={
                <View style={{ gap: spacing.md }} accessibilityLabel="Loading listing">
                  <Skeleton height={30} width="50%" />
                  <Skeleton height={20} width="80%" />
                  <Skeleton height={16} width="60%" />
                  <Skeleton height={96} />
                </View>
              }
            >
              {p ? <Body listing={p} scrollListeners={scrollListeners} /> : null}
            </QueryState>
          )}
        </View>
      </ScrollView>

      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: insets.top + spacing.sm,
          left: spacing.lg,
          right: spacing.lg,
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <IconButton
          onPress={back}
          haptic={false}
          accessibilityLabel="Go back"
          icon={<ChevronLeft size={22} color={colors.foreground} />}
        />
        {p ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <IconButton
              onPress={() => {
                if (!saved.savedIds.has(p.id)) {
                  trackShowroom({ name: 'property_save', listingId: p.id, market: p.kind });
                }
                saved.toggle(p.id);
              }}
              accessibilityLabel={
                saved.savedIds.has(p.id) ? 'Remove listing from saved' : 'Save listing'
              }
              accessibilityState={{ selected: saved.savedIds.has(p.id) }}
              icon={
                <Heart
                  size={19}
                  color={saved.savedIds.has(p.id) ? colors.destructive : colors.foreground}
                  fill={saved.savedIds.has(p.id) ? colors.destructive : 'transparent'}
                />
              }
            />
            <IconButton
              onPress={share}
              accessibilityLabel="Share listing"
              icon={<Share2 size={19} color={colors.foreground} />}
            />
          </View>
        ) : null}
      </View>

      {p && valid && !p.underOffer ? <Footer listing={p} kind={kind as MarketKind} /> : null}
    </View>
  );
}

function Body({
  listing: p,
  scrollListeners,
}: {
  listing: MarketDetail;
  scrollListeners: Set<() => void>;
}) {
  const { colors, spacing, radius } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const longDescription = (p.description?.length ?? 0) > 280;
  const hasCoords = typeof p.latitude === 'number' && typeof p.longitude === 'number';

  return (
    <>
      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Badge label={MARKET_LABEL[p.kind]} tone="neutral" />
          {p.trustLabel ? (
            <Badge
              label={p.trustLabel.label}
              tone={
                p.trustLabel.tone === 'verified'
                  ? 'success'
                  : p.trustLabel.tone === 'partial'
                    ? 'info'
                    : 'warning'
              }
            />
          ) : p.verified ? (
            <Badge label="Verified" tone="success" />
          ) : null}
        </View>
        <Text variant="title" accessibilityRole="header">
          {p.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
          <MapPin size={15} color={colors.mutedForeground} style={{ marginTop: 2 }} />
          <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
            {formatLocation(p.address, p.location)}
          </Text>
        </View>
        <Card
          style={{
            gap: spacing.xs,
            backgroundColor: colors.accent,
            borderColor: colors.primary,
          }}
        >
          <Text variant="caption" color="primary" uppercase>
            {p.kind === 'rent' || p.kind === 'shortlet' ? 'Price' : 'Asking price'}
          </Text>
          <Price amount={p.price} period={p.period} variant="heading" />
          {p.stay ? <StayTotal stay={p.stay} /> : null}
        </Card>
        {p.stay ? <TrustChips listing={p.stay} /> : null}
      </View>

      <View style={{ gap: spacing.sm }}>
        <KeyFactsRow bedrooms={p.bedrooms} bathrooms={p.bathrooms} size={p.size} />
        {p.highlight ? (
          <Text variant="callout" color="mutedForeground">
            {p.highlight}
          </Text>
        ) : null}
      </View>

      {p.underOffer ? (
        <Card style={{ gap: 2, backgroundColor: colors.warningSubtle }}>
          <Text variant="bodyStrong">Under offer</Text>
          <Text variant="caption" color="mutedForeground">
            The seller has accepted an offer on this property, so it is not taking new offers right
            now.
          </Text>
        </Card>
      ) : null}

      {/* A stay's own Prices section itemises everything, so the generic note would only contradict it. */}
      {p.costs ? (
        <ShowroomCostsCard
          market={p.kind === 'shortlet' ? 'rent' : p.kind}
          costs={p.costs}
          price={p.price}
          priceUnit={p.period === 'month' || p.period === 'year' ? p.period : undefined}
          vatStated={vatStated(p.commercial)}
        />
      ) : null}

      {p.host ? (
        <Card
          elevated
          accessible
          accessibilityLabel={[
            `${p.host.label}: ${p.host.name}`,
            p.host.verified ? 'verified' : null,
            p.host.rating ? `rated ${p.host.rating.toFixed(1)} out of 5` : null,
            p.host.reviews ? `${p.host.reviews} reviews` : null,
          ]
            .filter(Boolean)
            .join(', ')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
        >
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: radius.full,
              backgroundColor: colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant="bodyStrong" style={{ color: colors.accentForeground }}>
              {initials(p.host.name)}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="caption" color="mutedForeground">
              {p.host.label}
            </Text>
            <Text variant="bodyStrong" numberOfLines={1}>
              {p.host.name}
            </Text>
            {p.host.rating ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Star size={12} color={colors.warning} fill={colors.warning} />
                <Text variant="caption" color="mutedForeground">
                  {p.host.rating.toFixed(1)}
                  {p.host.reviews ? ` · ${p.host.reviews} reviews` : ''}
                </Text>
              </View>
            ) : null}
          </View>
          {p.host.verified ? (
            <View style={{ alignItems: 'center', gap: 2 }}>
              <ShieldCheck size={20} color={colors.success} accessibilityLabel="Verified account" />
              <Text variant="caption" color="success">
                Verified
              </Text>
            </View>
          ) : null}
        </Card>
      ) : null}

      {/* Commercial: the lease and the space come before the description, as on the web. */}
      {p.commercial && (p.kind === 'rent' || p.kind === 'sale') ? (
        <ShowroomCommercial commercial={p.commercial} market={p.kind} />
      ) : null}

      {p.description ? (
        <View style={{ gap: spacing.sm }}>
          <SectionHeader title="About this place" />
          <Text variant="body" color="mutedForeground" numberOfLines={expanded ? undefined : 6}>
            {p.description}
          </Text>
          {longDescription ? (
            <LinkButton
              label={expanded ? 'Show less' : 'Read more'}
              onPress={() => setExpanded((v) => !v)}
            />
          ) : null}
        </View>
      ) : null}

      <ShowroomFacts facts={p.facts} />

      {p.stay ? (
        <>
          <EssentialsBlock listing={p.stay} />
          <RulesBlock listing={p.stay} />
          <PricingBlock listing={p.stay} />
          <FairPriceNote listing={p.stay} />
          <InspectionBlock listing={p.stay} />
          <GuestPromiseCard>
            <SupportContact context={`Question about ${p.title}`} />
          </GuestPromiseCard>
        </>
      ) : null}

      {p.amenities.length ? (
        <View style={{ gap: spacing.sm }}>
          <SectionHeader title="Amenities" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {p.amenities.map((a) => (
              <View
                key={a}
                accessible
                accessibilityLabel={a}
                style={{
                  width: '48%',
                  minHeight: 48,
                  flexGrow: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                  backgroundColor: colors.card,
                }}
              >
                <Check size={16} color={colors.success} />
                <Text variant="callout" style={{ flex: 1 }}>
                  {a}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {hasCoords ? (
        <View style={{ gap: spacing.sm }}>
          <SectionHeader
            title="Location"
            description={
              p.locationPrecision === 'approximate'
                ? 'Approximate area: the exact spot is shown once the property is verified'
                : undefined
            }
          />
          <PropertyMapView
            markers={[{ id: p.id, latitude: p.latitude!, longitude: p.longitude! }]}
            variant={p.locationPrecision === 'approximate' ? 'area' : 'location'}
            zoom={14}
            height={200}
            borderRadius={radius.lg}
          />
        </View>
      ) : null}

      <Card style={{ gap: spacing.md, backgroundColor: colors.accent }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: radius.full,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.background,
            }}
          >
            <Lock size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="caption" color="primary" uppercase>
              Sureground protection
            </Text>
            <Text variant="bodyStrong">A safer way to transact</Text>
          </View>
        </View>
        <Text variant="callout" color="mutedForeground">
          Pay only through Sureground. {PROTECTION_LINE[p.kind]} We never ask you to send funds
          directly to a stranger.
        </Text>
      </Card>

      {p.kind === 'land' ? <PriceComparison listingId={p.id} /> : null}
      <SimilarListings listing={p} scrollListeners={scrollListeners} />
    </>
  );
}

function SimilarListings({
  listing,
  scrollListeners,
}: {
  listing: MarketDetail;
  scrollListeners: Set<() => void>;
}) {
  const { spacing } = useTheme();
  const saved = useMarketSaved(listing.kind);
  // The web's similar strip counts under `${market}_similar`. The row scrolls sideways (the list
  // reports which cards are half in view) inside a page that scrolls down (we measure the row), so
  // a card counts only when both say it is on screen.
  const cards = useCardAnalytics(listing.kind, `${listing.kind}_similar`, { inView: false });
  const row = useRef<ComponentRef<typeof View>>(null);
  const { setInView } = cards;
  const measure = useCallback(() => {
    row.current?.measureInWindow((_x, y, _width, height) =>
      setInView(visibleFraction(y, height, Dimensions.get('window').height) >= 0.5)
    );
  }, [setInView]);
  useEffect(() => {
    scrollListeners.add(measure);
    return () => {
      scrollListeners.delete(measure);
    };
  }, [scrollListeners, measure]);
  const query = useQuery({
    queryKey: [
      ...qk.market.list(listing.kind, {}),
      'similar',
      listing.id,
      listing.price,
      listing.bedrooms,
    ],
    queryFn: () =>
      publicMarketApi.list(
        listing.kind,
        {
          minPrice: Math.max(0, Math.round(listing.price * 0.7)),
          maxPrice: Math.round(listing.price * 1.3),
          bedrooms: listing.bedrooms,
          sort: 'newest',
        },
        1,
        6
      ),
    staleTime: 5 * 60_000,
  });
  const similar = (query.data?.items ?? []).filter((item) => item.id !== listing.id).slice(0, 4);
  if (!similar.length) return null;

  return (
    <View style={{ gap: spacing.md }}>
      <SectionHeader
        title="Similar listings"
        description="Comparable options in the same market and price range"
      />
      <View ref={row} onLayout={measure}>
        <FlatList
          horizontal
          data={similar}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -spacing.xl }}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.md }}
          {...cards.listProps}
          renderItem={({ item, index }) => (
            <View style={{ width: 286 }}>
              <PropertyCard
                property={{ ...item, tag: item.highlight }}
                saved={saved.savedIds.has(item.id)}
                onToggleSave={saved.toggle}
                onPress={(id) => {
                  cards.click(id, index);
                  router.push({
                    pathname: '/(market)/listing/[kind]/[id]',
                    params: { kind: listing.kind, id },
                  });
                }}
              />
            </View>
          )}
        />
      </View>
    </View>
  );
}

const PROTECTION_LINE: Record<MarketKind, string> = {
  rent: 'We hold your rent and release it to the landlord on schedule, unless you raise a dispute.',
  sale: 'We hold your deposit and only release it to the seller once you confirm receipt.',
  land: 'We hold your money and only release it to the seller once the conveyance steps are confirmed.',
  shortlet: 'We hold your payment and pay the host no sooner than 24 hours after check-in.',
};

function Footer({ listing, kind }: { listing: MarketDetail; kind: MarketKind }) {
  const cta = CTA[kind];
  return (
    <ShowroomPriceBar
      price={listing.price}
      period={listing.period}
      caption={
        <LinkButton
          label="Create a free account"
          onPress={() => {
            rememberListing(kind, listing.id);
            router.push('/(auth)/sign-up');
          }}
        />
      }
      action={
        <Button
          label={cta.label}
          accessibilityLabel={cta.a11y}
          fullWidth={false}
          onPress={() => {
            track('market_signin_cta', { kind });
            trackShowroom({
              name: START_EVENT[kind],
              listingId: listing.id,
              market: kind,
              surface: 'app_sticky_bar',
              props: { variant: 'signed_out' },
            });
            // Come back to this listing once signed in.
            rememberListing(kind, listing.id);
            router.push('/(auth)/sign-in');
          }}
        />
      }
    />
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

function StayTotal({ stay }: { stay: ShortletListing }) {
  const { colors } = useTheme();
  const { checkIn, checkOut } = useLocalSearchParams<{ checkIn?: string; checkOut?: string }>();
  const id = stay.listingId ?? stay.id;
  const quote = useQuery({
    queryKey: ['market', 'stay-quote', id, checkIn, checkOut],
    queryFn: () => publicMarketApi.stayQuote(id, checkIn!, checkOut!),
    enabled: !!checkIn && !!checkOut,
  });
  const q = quote.data;
  if (!checkIn || !checkOut || !q) return null;
  if (!q.available) {
    return (
      <Text variant="callout" style={{ color: colors.warning }}>
        {seasonRange(checkIn, checkOut)}: {q.reason ?? 'those dates are taken.'}
      </Text>
    );
  }
  return (
    <View
      accessible
      accessibilityLabel={`${(q.estimatedTotal ?? 0).toLocaleString('en-NG')} naira in total for ${seasonRange(checkIn, checkOut)}`}
      style={{ gap: 2 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
        <Price amount={q.estimatedTotal ?? 0} variant="subheading" />
        <Text variant="callout" color="mutedForeground">
          total
        </Text>
      </View>
      <Text variant="caption" color="mutedForeground">
        {seasonRange(checkIn, checkOut)} · {nightsLabel(q.estimatedNights ?? 0)} · incl. cleaning
        {q.estimatedTax ? ` & ${q.taxName ?? 'tax'}` : ''}
        {stay.deposit ? ` · + ₦${stay.deposit.toLocaleString('en-NG')} refundable deposit` : ''}
      </Text>
    </View>
  );
}
