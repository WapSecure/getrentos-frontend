import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Handshake, UserPlus } from 'lucide-react-native';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  clientName,
  clientRole,
  realtorApi,
  type RealtorClient,
  type RelationshipStatus,
} from '@/lib/api/realtor';
import { formatDate } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { StatusPill } from '@/components/host/HostUI';
import { InviteClientSheet } from '@/components/realtor/RealtorUI';

const GROUPS: { status: RelationshipStatus; title: string }[] = [
  { status: 'ACTIVE', title: 'Active' },
  { status: 'PENDING', title: 'Waiting for approval' },
  { status: 'REVOKED', title: 'Ended' },
];

/** Owners and landlords who let the realtor represent them. */
export default function RealtorClients() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [inviting, setInviting] = useState(false);
  const query = useQuery({ queryKey: qk.realtor.clients, queryFn: () => realtorApi.clients() });
  const items = query.data?.items ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
            tintColor={colors.mutedForeground}
          />
        }
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <DetailHeader
          eyebrow="Your book"
          title="Clients"
          subtitle="Owners and landlords you represent"
          onBack={() => router.back()}
          accessory={
            <IconButton
              accessibilityLabel="Invite a client"
              icon={<UserPlus size={20} color={colors.primary} />}
              onPress={() => setInviting(true)}
            />
          }
        />
        {query.isError && !query.data ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : query.isPending ? (
          [0, 1, 2].map((i) => <Skeleton key={i} height={76} radius={radius.lg} />)
        ) : !items.length ? (
          <EmptyState
            icon={<Handshake size={34} color={colors.mutedForeground} />}
            title="No clients yet"
            description="Invite an owner or landlord by email. Once they approve, they choose which properties you handle."
            action={<Button label="Invite a client" onPress={() => setInviting(true)} />}
          />
        ) : (
          GROUPS.map((g) => {
            const list = items.filter((c) => c.status === g.status);
            if (!list.length) return null;
            return (
              <View key={g.status} style={{ gap: spacing.sm }}>
                <Text variant="heading" accessibilityRole="header">
                  {g.title}
                </Text>
                {list.map((c) => (
                  <ClientRow key={c.id} c={c} />
                ))}
              </View>
            );
          })
        )}
      </ScrollView>
      <InviteClientSheet open={inviting} onClose={() => setInviting(false)} />
    </View>
  );
}

function ClientRow({ c }: { c: RealtorClient }) {
  const { colors, spacing } = useTheme();
  const active = c.status === 'ACTIVE';
  const props = c._count.properties;
  return (
    <Pressable
      disabled={!active}
      onPress={() => {
        void haptics.tap();
        router.push({ pathname: '/(app)/realtor-client/[id]', params: { id: c.id } });
      }}
      accessibilityRole={active ? 'button' : undefined}
      accessibilityLabel={`${clientName(c)}, ${clientRole(c)}, ${
        active
          ? `${props} ${props === 1 ? 'property' : 'properties'}`
          : c.status === 'PENDING'
            ? 'waiting for approval'
            : 'relationship ended'
      }`}
    >
      {({ pressed }) => (
        <Card
          elevated
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            opacity: pressed ? 0.92 : active ? 1 : 0.75,
          }}
        >
          <Avatar name={clientName(c)} size={44} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {clientName(c)}
            </Text>
            <Text variant="caption" color="mutedForeground" numberOfLines={1}>
              {clientRole(c)}
              {active
                ? ` · ${props} ${props === 1 ? 'property' : 'properties'}`
                : ` · invited ${formatDate(c.createdAt, 'short')}`}
            </Text>
          </View>
          {active ? (
            <ChevronRight size={18} color={colors.mutedForeground} />
          ) : (
            <StatusPill
              label={c.status === 'PENDING' ? 'Pending' : 'Ended'}
              tone={c.status === 'PENDING' ? 'warning' : 'neutral'}
            />
          )}
        </Card>
      )}
    </Pressable>
  );
}
