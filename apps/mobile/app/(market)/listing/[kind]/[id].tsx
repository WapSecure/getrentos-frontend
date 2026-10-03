import { useState } from 'react';
import { ScrollView, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  Bath,
  BedDouble,
  Check,
  ChevronLeft,
  Heart,
  Lock,
  MapPin,
  Maximize,
  Share2,
  ShieldCheck,
  Star,
} from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  IconButton,
  LinkButton,
  Price,
  PropertyCard,
  SectionHeader,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
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
import { PropertyGallery } from '@/components/property/PropertyGallery';
import { PropertyMapView } from '@/components/property/PropertyMapView';
import { useMarketSaved } from '@/hooks/useMarketSaved';
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

const CTA: Record<MarketKind, string> = {
  rent: 'Sign in to enquire',
  sale: 'Sign in to make an offer',
  shortlet: 'Sign in to book',
  land: 'Sign in to make an offer',
};

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

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(market)'));

  const share = async () => {
    if (!p || !valid) return;
    track('market_listing_shared', { kind });
    await Share.share({
      message: `${p.title} · ${p.location}\n${env.webUrl}${marketWebPath(kind as MarketKind, p.id)}`,
    }).catch(() => undefined);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
      >
        <PropertyGallery images={p?.images ?? []} height={320} />

        <View style={{ padding: spacing.xl, gap: spacing['2xl'] }}>
          {!valid ? (
            <EmptyState
              title="Listing not found"
              description="This link doesn’t point to a listing."
            />
          ) : query.isError ? (
            <ErrorState
              title="We couldn’t load this listing"
              description="It may have been taken down, or your connection dropped."
              onRetry={() => query.refetch()}
            />
          ) : !p ? (
            <View style={{ gap: spacing.md }} accessibilityLabel="Loading listing">
              <Skeleton height={30} width="50%" />
              <Skeleton height={20} width="80%" />
              <Skeleton height={16} width="60%" />
              <Skeleton height={96} />
            </View>
          ) : (
            <Body listing={p} />
          )}
        </View>
      </ScrollView>

      {/* Floating controls over the gallery. */}
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
              onPress={() => saved.toggle(p.id)}
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

      {p && valid ? <Footer listing={p} kind={kind as MarketKind} /> : null}
    </View>
  );
}

/* --------------------------------- body --------------------------------- */

function Body({ listing: p }: { listing: MarketDetail }) {
  const { colors, spacing, radius } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const longDescription = (p.description?.length ?? 0) > 280;
  const hasCoords = typeof p.latitude === 'number' && typeof p.longitude === 'number';

  return (
    <>
      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Badge label={MARKET_LABEL[p.kind]} tone="neutral" />
          {p.verified ? <Badge label="Verified" tone="success" /> : null}
        </View>
        <Text variant="title" accessibilityRole="header">
          {p.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
          <MapPin size={15} color={colors.mutedForeground} style={{ marginTop: 2 }} />
          <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
            {p.address ? `${p.address}, ${p.location}` : p.location}
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

      {p.bedrooms || p.bathrooms || p.size || p.highlight ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {p.bedrooms ? (
            <Chip
              label={`${p.bedrooms} bed${p.bedrooms === 1 ? '' : 's'}`}
              leadingIcon={<BedDouble size={15} color={colors.foreground} />}
            />
          ) : null}
          {p.bathrooms ? (
            <Chip
              label={`${p.bathrooms} bath${p.bathrooms === 1 ? '' : 's'}`}
              leadingIcon={<Bath size={15} color={colors.foreground} />}
            />
          ) : null}
          {p.size ? (
            <Chip
              label={`${p.size} m²`}
              leadingIcon={<Maximize size={15} color={colors.foreground} />}
            />
          ) : null}
          {p.highlight ? <Chip label={p.highlight} /> : null}
        </View>
      ) : null}

      {/* A stay's own Prices section itemises everything, so the generic note would only contradict it. */}
      {p.stay ? null : <CostContext listing={p} />}

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

      {p.facts.length ? (
        <View style={{ gap: spacing.sm }}>
          <SectionHeader title="Details" />
          <Card padding="none">
            {p.facts.map((f, i) => (
              <View
                key={f.label}
                accessible
                accessibilityLabel={`${f.label}: ${f.value}`}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  gap: spacing.lg,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  borderTopWidth: i ? 1 : 0,
                  borderTopColor: colors.border,
                }}
              >
                <Text variant="callout" color="mutedForeground">
                  {f.label}
                </Text>
                <Text
                  variant="callout"
                  style={{ fontWeight: '600', flexShrink: 1, textAlign: 'right' }}
                >
                  {f.value}
                </Text>
              </View>
            ))}
          </Card>
        </View>
      ) : null}

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
          <SectionHeader title="Location" description="Approximate area" />
          <PropertyMapView
            markers={[{ id: p.id, latitude: p.latitude!, longitude: p.longitude! }]}
            variant="location"
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
              GetRentos protection
            </Text>
            <Text variant="bodyStrong">A safer way to transact</Text>
          </View>
        </View>
        <Text variant="callout" color="mutedForeground">
          Pay only through GetRentos. We hold your money until both sides confirm and never ask you
          to send funds directly to a stranger.
        </Text>
      </Card>

      <SimilarListings listing={p} />
    </>
  );
}

function CostContext({ listing }: { listing: MarketDetail }) {
  const { colors, spacing } = useTheme();
  const monthlyEquivalent =
    listing.kind === 'rent' && listing.period === 'year' ? listing.price / 12 : undefined;
  const annualEquivalent =
    listing.kind === 'rent' && listing.period === 'month' ? listing.price * 12 : undefined;

  return (
    <View style={{ gap: spacing.sm }}>
      <SectionHeader title="Cost overview" description="Know what the displayed price includes" />
      <Card padding="none">
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: spacing.lg,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
          }}
        >
          <Text variant="callout" color="mutedForeground">
            Listed price
          </Text>
          <Price amount={listing.price} period={listing.period} variant="bodyStrong" />
        </View>
        {monthlyEquivalent || annualEquivalent ? (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: spacing.lg,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <Text variant="callout" color="mutedForeground">
              {monthlyEquivalent ? 'Monthly equivalent' : 'Annual equivalent'}
            </Text>
            <Price
              amount={monthlyEquivalent ?? annualEquivalent ?? 0}
              period={monthlyEquivalent ? 'month' : 'year'}
              variant="bodyStrong"
            />
          </View>
        ) : null}
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Text variant="caption" color="mutedForeground">
            Legal, agency, service, inspection or transaction fees are not included unless the
            listing details explicitly say otherwise. Confirm the full breakdown before paying.
          </Text>
        </View>
      </Card>
    </View>
  );
}

function SimilarListings({ listing }: { listing: MarketDetail }) {
  const { spacing } = useTheme();
  const saved = useMarketSaved(listing.kind);
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -spacing.xl }}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.md }}
      >
        {similar.map((item) => (
          <View key={item.id} style={{ width: 286 }}>
            <PropertyCard
              property={{ ...item, tag: item.highlight }}
              saved={saved.savedIds.has(item.id)}
              onToggleSave={saved.toggle}
              onPress={(id) =>
                router.push({
                  pathname: '/(market)/listing/[kind]/[id]',
                  params: { kind: listing.kind, id },
                })
              }
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/* -------------------------------- footer -------------------------------- */

function Footer({ listing, kind }: { listing: MarketDetail; kind: MarketKind }) {
  const { colors, spacing, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.md,
        paddingBottom: insets.bottom + spacing.md,
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        ...shadows.lg,
      }}
    >
      <View style={{ flex: 1 }}>
        <Price amount={listing.price} period={listing.period} variant="subheading" />
        <LinkButton
          label="Create a free account"
          onPress={() => {
            rememberListing(kind, listing.id);
            router.push('/(auth)/sign-up');
          }}
        />
      </View>
      <Button
        label={CTA[kind]}
        fullWidth={false}
        onPress={() => {
          track('market_signin_cta', { kind });
          // Come back to this listing once signed in.
          rememberListing(kind, listing.id);
          router.push('/(auth)/sign-in');
        }}
      />
    </View>
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

/**
 * The full price of a stay for the dates chosen in the list: what the booking
 * will cost, or why those dates don't work. Nothing shows without dates.
 */
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
