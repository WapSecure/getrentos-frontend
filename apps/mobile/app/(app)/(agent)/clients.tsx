import { useState } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Users } from 'lucide-react-native';
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  agentClientsApi,
  type AgentClientRelationship,
  type AgentClientStatus,
} from '@/lib/api/agentClients';
import { InviteClientSheet } from '@/components/agent/InviteClientSheet';

const STATUS_TONE: Record<AgentClientStatus, 'success' | 'warning' | 'danger'> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  REVOKED: 'danger',
};

export default function AgentClients() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [inviteOpen, setInviteOpen] = useState(false);

  const query = useQuery({
    queryKey: qk.agent.clients(1, 50),
    queryFn: () => agentClientsApi.list(1, 50),
  });
  const items = query.data?.items ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingHorizontal: spacing.xl,
          paddingTop: insets.top + spacing.lg,
          paddingBottom: spacing.md,
        }}
      >
        <Text variant="title" style={{ flex: 1 }}>
          Clients
        </Text>
        <Pressable
          onPress={() => setInviteOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Invite a client"
          hitSlop={10}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Plus size={18} color={colors.primaryForeground} />
        </Pressable>
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
          icon={<Users size={34} color={colors.mutedForeground} />}
          title="No clients yet"
          description="Invite a landlord or property owner to authorize you as their field agent."
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: AgentClientRelationship }) => (
            <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
              <Card elevated>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <Avatar name={item.client.legalName} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">{item.client.legalName}</Text>
                    <Text variant="caption" color="mutedForeground">
                      {item.client.email}
                    </Text>
                  </View>
                  <Badge
                    label={item.status[0] + item.status.slice(1).toLowerCase()}
                    tone={STATUS_TONE[item.status]}
                  />
                </View>
                {item.properties.length > 0 ? (
                  <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.sm }}>
                    {item.properties.length}{' '}
                    {item.properties.length === 1 ? 'property' : 'properties'} assigned
                  </Text>
                ) : null}
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

      <InviteClientSheet open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </View>
  );
}
