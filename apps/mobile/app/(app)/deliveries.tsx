import { Image, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Package } from 'lucide-react-native';
import { Badge, Card, EmptyState, Screen, Skeleton, Text, useTheme } from '@getrentos/ui-native';
import { residentApi } from '@/lib/api/resident';
import { qk } from '@/lib/query/keys';
import { formatDate } from '@/lib/format';

function BackHeader({ title }: { title: string }) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.xl,
        paddingTop: insets.top + spacing.sm,
        paddingBottom: spacing.md,
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
      <Text variant="title">{title}</Text>
    </View>
  );
}

export default function ResidentDeliveries() {
  const { colors, spacing, radius } = useTheme();
  const query = useQuery({
    queryKey: qk.resident.deliveries(1, 50),
    queryFn: () => residentApi.listDeliveries(1, 50),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <BackHeader title="Deliveries" />
      <Screen refreshing={query.isRefetching} onRefresh={query.refetch}>
        {query.isLoading ? (
          <View style={{ gap: spacing.md }}>
            <Skeleton height={76} radius={16} />
            <Skeleton height={76} radius={16} />
          </View>
        ) : query.data && query.data.items.length > 0 ? (
          query.data.items.map((d) => (
            <Card key={d.id} elevated>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                {d.photoUrl ? (
                  <Image
                    source={{ uri: d.photoUrl }}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: radius.md,
                      backgroundColor: colors.secondary,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: radius.md,
                      backgroundColor: colors.accent,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Package size={22} color={colors.primary} />
                  </View>
                )}
                <View style={{ flex: 1, gap: 2 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text variant="bodyStrong">{d.courier ?? 'Package'}</Text>
                    <Badge
                      label={d.status === 'collected' ? 'Collected' : 'Received'}
                      tone={d.status === 'collected' ? 'success' : 'info'}
                    />
                  </View>
                  {d.recipientName ? (
                    <Text variant="caption" color="mutedForeground">
                      For {d.recipientName}
                    </Text>
                  ) : null}
                  <Text variant="caption" color="mutedForeground">
                    Received {formatDate(d.receivedAt, 'short')}
                    {d.collectedAt ? ` · Collected ${formatDate(d.collectedAt, 'short')}` : ''}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        ) : (
          <EmptyState
            icon={<Package size={34} color={colors.mutedForeground} />}
            title="No deliveries yet"
            description="Packages logged at the gate for your household will show up here."
          />
        )}
      </Screen>
    </View>
  );
}
