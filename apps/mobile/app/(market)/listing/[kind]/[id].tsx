import { useState } from 'react';
import { ScrollView, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  Bath,
  BedDouble,
  ChevronLeft,
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
  SectionHeader,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  isMarketKind,
  MARKET_LABEL,
  publicMarketApi,
  type MarketDetail,
  type MarketKind,
} from '@/lib/api/publicMarket';
import { env } from '@/lib/env';
import { track } from '@/lib/analytics';
import { PropertyGallery } from '@/components/property/PropertyGallery';
import { PropertyMapView } from '@/components/property/PropertyMapView';

const CTA: Record<MarketKind, string> = {
  rent: 'Sign in to enquire',
  sale: 'Sign in to make an offer',
  shortlet: 'Sign in to book',
  land: 'Sign in to make an offer',
};

const WEB_PATH: Record<MarketKind, (id: string) => string> = {
  rent: () => '/rent',
  sale: () => '/buy',
  shortlet: (id) => `/shortlets/${id}`,
  land: () => '/land',
};

export default function PublicListing() {
  const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const valid = isMarketKind(kind) && !!id;

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
      message: `${p.title} · ${p.location}\n${env.webUrl}${WEB_PATH[kind as MarketKind](p.id)}`,
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
          <IconButton
            onPress={share}
            accessibilityLabel="Share listing"
            icon={<Share2 size={19} color={colors.foreground} />}
          />
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
      <View style={{ gap: spacing.sm }}>
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
        <Price amount={p.price} period={p.period} variant="heading" />
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
          {p.host.verified ? <ShieldCheck size={20} color={colors.success} /> : null}
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

      {p.amenities.length ? (
        <View style={{ gap: spacing.sm }}>
          <SectionHeader title="Amenities" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {p.amenities.map((a) => (
              <Chip key={a} label={a} size="sm" />
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

      <Card
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.md,
          backgroundColor: colors.accent,
        }}
      >
        <Lock size={18} color={colors.primary} style={{ marginTop: 2 }} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="callout" style={{ fontWeight: '700', color: colors.accentForeground }}>
            Pay through GetRentos escrow
          </Text>
          <Text variant="caption" color="mutedForeground">
            Your money is held until both sides confirm — never transferred straight to a stranger.
          </Text>
        </View>
      </Card>
    </>
  );
}

/* -------------------------------- footer -------------------------------- */

function Footer({ listing, kind }: { listing: MarketDetail; kind: MarketKind }) {
  const { colors, spacing } = useTheme();
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
      }}
    >
      <View style={{ flex: 1 }}>
        <Price amount={listing.price} period={listing.period} variant="subheading" />
        <LinkButton label="Create a free account" onPress={() => router.push('/(auth)/sign-up')} />
      </View>
      <Button
        label={CTA[kind]}
        fullWidth={false}
        onPress={() => {
          track('market_signin_cta', { kind });
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
