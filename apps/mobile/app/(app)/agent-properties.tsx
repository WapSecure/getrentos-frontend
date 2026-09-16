import { Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Building2, ShieldCheck } from 'lucide-react-native';
import { Card, EmptyState, ErrorState, Skeleton, Text, useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { agentApi, type AgentAssignedProperty } from '@/lib/api/agent';

export default function AgentProperties() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const query = useQuery({
    queryKey: qk.agent.properties(1, 50),
    queryFn: () => agentApi.properties(1, 50),
  });
  const items = query.data?.items ?? [];

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
        <Text variant="title">My properties</Text>
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={90} radius={radius.lg} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Building2 size={34} color={colors.mutedForeground} />}
          title="No properties assigned"
          description="Properties your clients assign to you will appear here."
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: AgentAssignedProperty }) => (
            <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
              <Card elevated>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: spacing.sm,
                  }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {item.property.title}
                    </Text>
                    <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                      {item.property.address}, {item.property.city}
                    </Text>
                    <Text variant="caption" color="mutedForeground">
                      Client: {item.agentClient.client.legalName}
                    </Text>
                  </View>
                  {item.property.isVerified ? (
                    <ShieldCheck size={16} color={colors.success} />
                  ) : null}
                </View>
              </Card>
            </View>
          )}
          contentContainerStyle={{
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
        />
      )}
    </View>
  );
}
