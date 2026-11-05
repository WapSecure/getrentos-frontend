import { Alert, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MessageCircle, ShieldCheck, Star } from 'lucide-react-native';
import {
  Avatar,
  Button,
  DetailSkeleton,
  PropertyCard,
  QueryState,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { publicMarketApi, type LandlordMicrosite, type MarketCard } from '@/lib/api/publicMarket';
import { messagesApi } from '@/lib/api/messages';
import { errorMessage } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { openMarketListing } from '@/lib/pendingListing';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

/** A landlord's or agency's public page (website: /l/<slug>): who they are and what they let. */
export default function LandlordPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { usablePortal } = useAuth();
  const profile = useQuery({
    queryKey: qk.market.microsite(slug),
    queryFn: () => publicMarketApi.microsite(slug),
    enabled: !!slug,
    retry: false,
  });
  const listings = useInfiniteQuery({
    queryKey: qk.market.micrositeListings(slug),
    queryFn: ({ pageParam }) => publicMarketApi.micrositeListings(slug, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.pageSize < last.total ? last.page + 1 : undefined,
    enabled: !!profile.data,
  });
  const items = listings.data?.pages.flatMap((p) => p.items) ?? [];
  const p = profile.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Landlord"
        title={p?.displayName ?? 'Landlord'}
        onBack={() => goBack()}
      />
      <QueryState
        query={profile}
        skeleton={
          <View style={{ paddingHorizontal: spacing.xl }}>
            <DetailSkeleton />
          </View>
        }
        errorTitle="This page isn’t available"
        errorDescription="The link may be wrong, or the landlord has switched their page off."
        style={{ paddingHorizontal: spacing.xl }}
      >
        {p ? (
          <FlashList
            data={items}
            keyExtractor={(l) => l.id}
            renderItem={({ item }: { item: MarketCard }) => (
              <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
                <PropertyCard
                  property={{ ...item, tag: item.highlight }}
                  onPress={(id) => openMarketListing('rent', id, usablePortal)}
                />
              </View>
            )}
            ListHeaderComponent={<Profile profile={p} />}
            ListEmptyComponent={
              listings.isLoading ? null : (
                <Text
                  variant="callout"
                  color="mutedForeground"
                  style={{ paddingHorizontal: spacing.xl }}
                >
                  No homes listed right now.
                </Text>
              )
            }
            onEndReached={() => {
              if (listings.hasNextPage && !listings.isFetchingNextPage) listings.fetchNextPage();
            }}
            contentContainerStyle={{ paddingBottom: insets.bottom + spacing['3xl'] }}
          />
        ) : null}
      </QueryState>
    </View>
  );
}

function Profile({ profile: p }: { profile: LandlordMicrosite }) {
  const { colors, spacing, radius } = useTheme();
  const toast = useToast();
  const { status, usablePortal } = useAuth();
  const contact = useMutation({
    mutationFn: () => messagesApi.start(p.landlordId),
    onSuccess: (conversation) => router.push(`/(app)/conversation/${conversation.id}`),
    onError: (e) => toast.show(errorMessage(e, 'Could not start the conversation.'), 'error'),
  });
  const onContact = () => {
    if (status !== 'authenticated') {
      router.push('/(auth)/sign-in');
      return;
    }
    if (usablePortal !== 'renter') {
      Alert.alert(
        'Message from a renter account',
        'Landlords hear from renters. Switch to your renter workspace, or add one from Account, then try again.'
      );
      return;
    }
    contact.mutate();
  };
  return (
    <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.md }}>
      {p.bannerUrl ? (
        <Image
          source={{ uri: p.bannerUrl }}
          contentFit="cover"
          style={{ height: 150, borderRadius: radius.lg, backgroundColor: colors.secondary }}
          accessibilityIgnoresInvertColors
        />
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        {p.avatarUrl ? (
          <Image
            source={{ uri: p.avatarUrl }}
            contentFit="cover"
            style={{ width: 56, height: 56, borderRadius: radius.md }}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Avatar name={p.displayName} size={56} />
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Text variant="heading" style={{ flexShrink: 1 }}>
              {p.displayName}
            </Text>
            {p.verified ? (
              <ShieldCheck size={18} color={colors.success} accessibilityLabel="Verified" />
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            {p.reviewCount > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Star size={13} color={colors.warning} fill={colors.warning} />
                <Text variant="caption" color="mutedForeground">
                  {p.rating.toFixed(1)} ({p.reviewCount})
                </Text>
              </View>
            ) : null}
            <Text variant="caption" color="mutedForeground">
              {p.listingCount} listing{p.listingCount === 1 ? '' : 's'}
            </Text>
          </View>
        </View>
      </View>
      {p.bio ? (
        <Text variant="callout" color="mutedForeground">
          {p.bio}
        </Text>
      ) : null}
      <Button
        label="Message this landlord"
        icon={<MessageCircle size={16} color={colors.primaryForeground} />}
        loading={contact.isPending}
        onPress={onContact}
      />
      <Text variant="heading" style={{ marginTop: spacing.sm }}>
        Available homes
      </Text>
    </View>
  );
}
