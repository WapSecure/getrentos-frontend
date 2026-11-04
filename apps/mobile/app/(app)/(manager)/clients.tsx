import { useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, UserPlus, Users } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  ListSkeleton,
  PressableScale,
  Screen,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { useCustody } from '@/lib/agency/custody';
import {
  agencyApi,
  groupByOwner,
  INVITE_STATUS,
  isLive,
  MANDATE_STATUS,
  type OwnerInvite,
} from '@/lib/api/agency';
import { ApiError } from '@/lib/api/client';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Sheet } from '@/components/Sheet';

/** The firm's clients, one per owner, and owners invited who haven't joined. */
export default function AgencyClients() {
  const { colors, spacing } = useTheme();
  const custody = useCustody();
  const [inviting, setInviting] = useState(false);
  const invites = useQuery({ queryKey: qk.agency.ownerInvites, queryFn: agencyApi.ownerInvites });
  const clients = groupByOwner(custody.mandates);
  const outstanding = (invites.data ?? []).filter(
    (i) => i.status === 'PENDING' || i.status === 'EXPIRED'
  );

  return (
    <Screen
      refreshing={invites.isRefetching}
      onRefresh={() => {
        custody.reload();
        invites.refetch();
      }}
    >
      <DashboardHeader
        eyebrow="Agency"
        title="Clients"
        subtitle={`${clients.length} client${clients.length === 1 ? '' : 's'}`}
        accessory={
          <IconButton
            onPress={() => setInviting(true)}
            accessibilityLabel="Invite an owner"
            icon={<UserPlus size={21} color={colors.foreground} />}
          />
        }
      />
      <View style={{ gap: spacing.md }}>
        {custody.loading ? (
          <ListSkeleton rows={3} variant="card" height={110} />
        ) : custody.error && !custody.mandates.length ? (
          <ErrorState description={custody.error} onRetry={custody.reload} />
        ) : clients.length === 0 ? (
          <EmptyState
            icon={<Users size={32} color={colors.mutedForeground} />}
            title="No client engagements yet."
            description="Invite an owner to bring their property to your firm."
            action={<Button label="Invite owner" onPress={() => setInviting(true)} />}
          />
        ) : (
          clients.map((c) => (
            <Card key={c.ownerId} style={{ gap: spacing.sm }}>
              <PressableScale
                onPress={() => router.push(`/(app)/agency-client/${c.ownerId}`)}
                accessibilityRole="button"
                accessibilityLabel={`${c.ownerName}, client details`}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">{c.ownerName}</Text>
                    <Text variant="caption" color="mutedForeground">
                      {c.mandates.length} propert{c.mandates.length === 1 ? 'y' : 'ies'} · {c.live}{' '}
                      live
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.mutedForeground} />
                </View>
              </PressableScale>
              {c.mandates.map((m) => (
                <PressableScale
                  key={m.id}
                  onPress={() => {
                    custody.select(m.id);
                    router.navigate('/(app)/(manager)');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Act for ${c.ownerName} on ${m.propertyTitle ?? 'property'}`}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.sm,
                      paddingVertical: 6,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                    }}
                  >
                    <Text variant="callout" style={{ flex: 1 }} numberOfLines={1}>
                      {m.propertyTitle ?? 'Property'}
                    </Text>
                    {isLive(m) ? (
                      <Text variant="caption" color="primary" style={{ fontWeight: '600' }}>
                        Act for them
                      </Text>
                    ) : (
                      <Badge
                        label={MANDATE_STATUS[m.status].label}
                        tone={MANDATE_STATUS[m.status].tone}
                      />
                    )}
                  </View>
                </PressableScale>
              ))}
            </Card>
          ))
        )}

        {outstanding.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            <Text variant="heading">Invited, not joined yet</Text>
            {outstanding.map((i) => (
              <InviteRow key={i.id} invite={i} />
            ))}
          </View>
        ) : null}
      </View>

      <Sheet open={inviting} onClose={() => setInviting(false)} title="Invite an owner">
        <InviteForm key={inviting ? 'open' : 'closed'} onDone={() => setInviting(false)} />
      </Sheet>
    </Screen>
  );
}

function InviteRow({ invite: i }: { invite: OwnerInvite }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const revoke = useMutation({
    mutationFn: () => agencyApi.revokeOwnerInvite(i.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.agency.ownerInvites });
      toast.show('Invitation withdrawn.', 'success');
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not withdraw the invite.', 'error'),
  });
  const status = INVITE_STATUS[i.status];
  return (
    <Card padding={spacing.md} style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Text variant="callout" style={{ fontWeight: '600' }} numberOfLines={1}>
            {i.name ?? i.email}
          </Text>
          {i.name ? (
            <Text variant="caption" color="mutedForeground" numberOfLines={1}>
              {i.email}
            </Text>
          ) : null}
        </View>
        <Badge label={status.label} tone={status.tone} />
      </View>
      {i.status === 'PENDING' && i.hasAccount ? (
        <Text variant="caption" color="mutedForeground">
          Has a GetRentos account
        </Text>
      ) : null}
      {i.status === 'PENDING' ? (
        <Button
          label="Withdraw"
          size="sm"
          variant="ghost"
          loading={revoke.isPending}
          onPress={() =>
            Alert.alert('Withdraw this invitation?', i.email, [
              { text: 'Keep it', style: 'cancel' },
              { text: 'Withdraw', style: 'destructive', onPress: () => revoke.mutate() },
            ])
          }
          style={{ alignSelf: 'flex-start' }}
        />
      ) : null}
    </Card>
  );
}

function InviteForm({ onDone }: { onDone: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const send = useMutation({
    mutationFn: () =>
      agencyApi.inviteOwner({
        email: email.trim(),
        ...(name.trim() ? { name: name.trim() } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.agency.ownerInvites });
      toast.show('Invitation sent.', 'success');
      onDone();
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not send the invite.', 'error'),
  });
  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="callout" color="mutedForeground">
        They get an email to bring their property to your firm. Nothing is agreed until they sign an
        engagement.
      </Text>
      <TextField
        label="Owner email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        required
      />
      <TextField label="Name (optional)" value={name} onChangeText={setName} />
      <TextField label="Note (optional)" value={note} onChangeText={setNote} multiline />
      <Button
        label="Send invitation"
        loading={send.isPending}
        disabled={!email.trim() || send.isPending}
        onPress={() => send.mutate()}
      />
    </View>
  );
}
