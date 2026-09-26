import { Linking, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BadgeCheck, Mail, Phone, Users } from 'lucide-react-native';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  Price,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { ownerApi, OWNER_LEAD_LABEL, type OwnerLead } from '@/lib/api/owner';
import { formatDate } from '@/lib/format';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

export default function OwnerLeads() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const query = useQuery({ queryKey: qk.owner.leads, queryFn: () => ownerApi.leads() });
  const refresh = (
    <RefreshControl
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
      tintColor={colors.mutedForeground}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <DetailHeader
          eyebrow="Selling"
          title="Buyer leads"
          subtitle="People interested in your listings"
          onBack={() => router.back()}
        />
      </View>
      {query.isError && !query.data ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <ErrorState onRetry={() => query.refetch()} />
        </ScrollView>
      ) : query.isPending ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1].map((i) => (
            <Skeleton key={i} height={110} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <FlashList
          data={query.data?.items ?? []}
          keyExtractor={(l) => l.id}
          refreshControl={refresh}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={
            <EmptyState
              icon={<Users size={34} color={colors.mutedForeground} />}
              title="No leads yet"
              description="Buyers who enquire about or view your listings appear here."
            />
          }
          renderItem={({ item: l }: { item: OwnerLead }) => (
            <Card elevated style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
                      {l.buyerName}
                    </Text>
                    {l.verified ? (
                      <BadgeCheck
                        size={15}
                        color={colors.success}
                        accessibilityLabel="Verified buyer"
                      />
                    ) : null}
                  </View>
                  <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                    {l.propertyName} · {formatDate(l.inquiryDate, 'short')}
                  </Text>
                </View>
                <Badge label={OWNER_LEAD_LABEL[l.stage] ?? l.stage} tone="info" />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
                  Trust score {l.trustScore}
                  {l.assignedRealtor ? ` · Realtor: ${l.assignedRealtor}` : ''}
                </Text>
                {l.offerAmount ? <Price amount={l.offerAmount} variant="callout" /> : null}
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {l.phone ? (
                  <IconButton
                    accessibilityLabel={`Call ${l.buyerName}`}
                    icon={<Phone size={18} color={colors.primary} />}
                    onPress={() => Linking.openURL(`tel:${l.phone}`)}
                  />
                ) : null}
                {l.email ? (
                  <IconButton
                    accessibilityLabel={`Email ${l.buyerName}`}
                    icon={<Mail size={18} color={colors.primary} />}
                    onPress={() => Linking.openURL(`mailto:${l.email}`)}
                  />
                ) : null}
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}
