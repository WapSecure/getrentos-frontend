import { useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, UserPlus, Users } from '@sureground/icons/native';
import {
  Badge,
  Divider,
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
} from '@sureground/ui-native';
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
import { errorMessage } from '@/lib/api/client';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Sheet } from '@/components/Sheet';
import { isNoAccountMessage, personContactLabel } from '@sureground/shared';
import { contactProblem, contactReady } from '@/lib/contact';
import { InviteToSignUp } from '@/components/contact/InviteToSignUp';

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
                  <Divider />
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.sm,
                      paddingVertical: 6,
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
    onError: (e) => toast.show(errorMessage(e, 'Could not withdraw the invite.'), 'error'),
  });
  const status = INVITE_STATUS[i.status];
  const contact = personContactLabel(i) ?? 'Invited by phone';
  return (
    <Card padding={spacing.md} style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Text variant="callout" style={{ fontWeight: '600' }} numberOfLines={1}>
            {i.name ?? contact}
          </Text>
          {i.name ? (
            <Text variant="caption" color="mutedForeground" numberOfLines={1}>
              {contact}
            </Text>
          ) : null}
        </View>
        <Badge label={status.label} tone={status.tone} />
      </View>
      {i.status === 'PENDING' && i.hasAccount ? (
        <Text variant="caption" color="mutedForeground">
          Has a Sureground account
        </Text>
      ) : null}
      {i.status === 'PENDING' ? (
        <Button
          label="Withdraw"
          size="sm"
          variant="ghost"
          loading={revoke.isPending}
          onPress={() =>
            Alert.alert('Withdraw this invitation?', i.name ?? contact, [
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
  const [contact, setContact] = useState('');
  const [touched, setTouched] = useState(false);
  const [noAccount, setNoAccount] = useState(false);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const send = useMutation({
    mutationFn: () =>
      agencyApi.inviteOwner({
        contact,
        ...(name.trim() ? { name: name.trim() } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      }),
    onSuccess: (sent) => {
      qc.invalidateQueries({ queryKey: qk.agency.ownerInvites });
      toast.show(
        sent?.deliveredBy?.includes('EMAIL')
          ? 'Invitation sent.'
          : 'Invitation sent to their Sureground app.',
        'success'
      );
      onDone();
    },
    onError: (e) => {
      const text = errorMessage(e, 'Could not send the invite.');
      if (isNoAccountMessage(text)) setNoAccount(true);
      else toast.show(text, 'error');
    },
  });
  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="callout" color="mutedForeground">
        An owner on Sureground gets the invitation in their app; an email address also gets it by
        email. Nothing is agreed until they sign an engagement.
      </Text>
      <TextField
        label="Owner's phone number or email"
        value={contact}
        onChangeText={(v) => {
          setContact(v);
          setNoAccount(false);
        }}
        onBlur={() => setTouched(true)}
        error={touched ? contactProblem(contact) : undefined}
        placeholder="0803 123 4567"
        autoCapitalize="none"
        autoCorrect={false}
        required
      />
      {noAccount ? (
        <InviteToSignUp
          message="Nobody on Sureground uses that phone number yet, and we cannot text an invite. Send them the signup link, or invite them by email instead."
          reason="manage your property with you"
          footnote="Once they have signed up, invite them here with the same phone number."
        />
      ) : null}
      <TextField label="Name (optional)" value={name} onChangeText={setName} />
      <TextField label="Note (optional)" value={note} onChangeText={setNote} multiline />
      <Button
        label="Send invitation"
        loading={send.isPending}
        disabled={!contactReady(contact) || send.isPending}
        onPress={() => send.mutate()}
      />
    </View>
  );
}
