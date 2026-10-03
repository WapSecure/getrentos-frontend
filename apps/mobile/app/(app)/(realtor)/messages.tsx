import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle, PenSquare, Search, X } from 'lucide-react-native';
import {
  Avatar,
  Button,
  EmptyState,
  ErrorState,
  FormAlert,
  IconButton,
  Skeleton,
  Text,
  TextField,
  useTheme,
} from '@getrentos/ui-native';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import {
  clientName,
  clientRole,
  realtorApi,
  type RealtorClient,
  type RealtorConversation,
} from '@/lib/api/realtor';
import { ApiError } from '@/lib/api/client';
import { relativeTime } from '@/lib/format';

/** Conversations with active clients. A client who revokes you drops out of this list. */
export default function RealtorMessages() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [picking, setPicking] = useState(false);
  const query = useQuery({
    queryKey: qk.realtor.conversations,
    queryFn: realtorApi.conversations,
  });

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (query.data?.items ?? []).filter(
      (c) =>
        !q ||
        (c.client.legalName ?? '').toLowerCase().includes(q) ||
        (c.lastMessage ?? '').toLowerCase().includes(q)
    );
  }, [query.data, search]);

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
          paddingHorizontal: spacing.xl,
          paddingTop: insets.top + spacing.lg,
          paddingBottom: spacing.sm,
          gap: spacing.md,
        }}
      >
        <DashboardHeader
          eyebrow="Inbox"
          title="Messages"
          subtitle="Your clients"
          accessory={
            <IconButton
              accessibilityLabel="New message"
              icon={<PenSquare size={20} color={colors.primary} />}
              onPress={() => setPicking(true)}
            />
          }
        />
        {query.data?.items.length ? (
          <TextField
            placeholder="Search clients or messages"
            accessibilityLabel="Search conversations"
            leftIcon={<Search size={18} color={colors.mutedForeground} />}
            autoCapitalize="none"
            value={search}
            onChangeText={setSearch}
            rightAccessory={
              search ? (
                <Pressable
                  onPress={() => setSearch('')}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  hitSlop={12}
                >
                  <X size={18} color={colors.mutedForeground} />
                </Pressable>
              ) : null
            }
          />
        ) : null}
      </View>

      {query.isError && !query.data ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <ErrorState onRetry={() => query.refetch()} />
        </ScrollView>
      ) : query.isPending ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={64} />
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(c) => c.id}
          keyboardDismissMode="on-drag"
          refreshControl={refresh}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing['3xl'] }}
          ListEmptyComponent={
            <EmptyState
              icon={<MessageCircle size={34} color={colors.mutedForeground} />}
              title={search ? 'No matches' : 'No conversations yet'}
              description={
                search
                  ? 'Try a name or a word from the message.'
                  : 'Message a client about their property, an offer or a viewing.'
              }
              action={
                search ? undefined : (
                  <Button label="Message a client" onPress={() => setPicking(true)} />
                )
              }
            />
          }
          renderItem={({ item }: { item: RealtorConversation }) => <Row c={item} />}
        />
      )}

      <Sheet open={picking} onClose={() => setPicking(false)} title="Message a client">
        {picking ? <ClientPicker onDone={() => setPicking(false)} /> : null}
      </Sheet>
    </View>
  );
}

function Row({ c }: { c: RealtorConversation }) {
  const { colors, spacing } = useTheme();
  const unread = c.unreadCount > 0;
  const name = c.client.legalName ?? 'Client';
  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/(app)/realtor-conversation/[id]', params: { id: c.id } })
      }
      accessibilityRole="button"
      accessibilityLabel={[
        name,
        unread ? `${c.unreadCount} unread` : null,
        c.lastMessage || 'No messages yet',
        c.lastMessageAt ? relativeTime(c.lastMessageAt) : null,
      ]
        .filter(Boolean)
        .join(', ')}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: spacing.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        backgroundColor: pressed ? colors.secondary : 'transparent',
      })}
    >
      <Avatar name={name} size={48} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text
            variant="bodyStrong"
            numberOfLines={1}
            style={{ flex: 1, fontWeight: unread ? '800' : '600' }}
          >
            {name}
          </Text>
          {c.lastMessageAt ? (
            <Text variant="caption" color={unread ? 'primary' : 'mutedForeground'}>
              {relativeTime(c.lastMessageAt)}
            </Text>
          ) : null}
        </View>
        <Text
          variant="callout"
          color={unread ? 'foreground' : 'mutedForeground'}
          numberOfLines={1}
          style={{ fontWeight: unread ? '600' : '400' }}
        >
          {c.lastMessage || 'No messages yet'}
        </Text>
      </View>
    </Pressable>
  );
}

/** Pick an active client and open (or reuse) the conversation with them. */
function ClientPicker({ onDone }: { onDone: () => void }) {
  const { colors, spacing } = useTheme();
  const clients = useQuery({ queryKey: qk.realtor.clients, queryFn: () => realtorApi.clients() });
  const start = useMutation({
    mutationFn: (c: RealtorClient) => realtorApi.startConversation(c.clientId),
    onSuccess: (conversation) => {
      onDone();
      router.push({
        pathname: '/(app)/realtor-conversation/[id]',
        params: { id: conversation.id },
      });
    },
  });
  const active = clients.data?.items.filter((c) => c.status === 'ACTIVE') ?? [];
  if (clients.isPending) return <Skeleton height={120} />;
  if (!active.length)
    return (
      <View style={{ gap: spacing.md }}>
        <FormAlert
          tone="info"
          message="You can message clients once they’ve approved you. Invite an owner or landlord to get started."
        />
        <Button
          label="Go to clients"
          variant="secondary"
          onPress={() => {
            onDone();
            router.push('/(app)/realtor-clients');
          }}
        />
      </View>
    );
  return (
    <View style={{ gap: spacing.xs }}>
      {active.map((c) => (
        <Pressable
          key={c.id}
          onPress={() => start.mutate(c)}
          disabled={start.isPending}
          accessibilityRole="button"
          accessibilityLabel={`Message ${clientName(c)}, ${clientRole(c)}`}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            paddingVertical: spacing.sm,
            opacity: pressed || (start.isPending && start.variables?.id === c.id) ? 0.6 : 1,
          })}
        >
          <Avatar name={clientName(c)} size={40} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {clientName(c)}
            </Text>
            <Text variant="caption" color="mutedForeground">
              {clientRole(c)}
            </Text>
          </View>
          <MessageCircle size={18} color={colors.primary} />
        </Pressable>
      ))}
      {start.error ? (
        <FormAlert
          message={
            start.error instanceof ApiError ? start.error.message : 'Could not open that chat.'
          }
        />
      ) : null}
    </View>
  );
}
