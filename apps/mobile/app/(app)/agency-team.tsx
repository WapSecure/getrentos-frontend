import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Badge,
  Button,
  Card,
  DateField,
  ListSkeleton,
  QueryState,
  Text,
  TextField,
  toISODate,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  agencyFirmApi,
  ASSIGNABLE_ROLES,
  endOfDayLagos,
  isPrincipal,
  MEMBER_STATE,
  type TeamInvitation,
  type TeamMember,
} from '@/lib/api/agencyFirm';
import { formatDay } from '@/lib/api/agency';
import { errorMessage } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { Sheet } from '@/components/Sheet';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

/** The firm's team. Only the principal invites, changes roles and removes people. */
export default function AgencyTeam() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const members = useQuery({ queryKey: qk.agency.members, queryFn: agencyFirmApi.members });
  const principal = isPrincipal(members.data ?? [], profile?.id);
  const invitations = useQuery({
    queryKey: qk.agency.invitations,
    queryFn: agencyFirmApi.invitations,
    enabled: principal,
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Agency"
        title="Team"
        subtitle={principal ? 'Invite people and set what they can do' : 'Who works at your firm'}
        onBack={() => goBack()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.md,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={members.isRefetching}
            onRefresh={() => {
              members.refetch();
              invitations.refetch();
            }}
            tintColor={colors.mutedForeground}
          />
        }
      >
        <QueryState query={members} skeleton={<ListSkeleton rows={3} variant="card" height={80} />}>
          {(members.data ?? []).map((m) => (
            <MemberRow
              key={m.userId}
              member={m}
              canEdit={principal && m.role !== 'OWNER'}
              onEdit={() => setEditing(m)}
            />
          ))}
        </QueryState>
        {principal ? (
          <>
            <InviteForm />
            {(invitations.data ?? []).length ? (
              <View style={{ gap: spacing.sm }}>
                <Text variant="heading">Invitations</Text>
                {(invitations.data ?? []).map((i) => (
                  <InvitationRow key={i.id} invitation={i} />
                ))}
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>
      <Sheet open={!!editing} onClose={() => setEditing(null)} title={editing?.name ?? ''}>
        {editing ? (
          <MemberEditor key={editing.userId} member={editing} onDone={() => setEditing(null)} />
        ) : null}
      </Sheet>
    </View>
  );
}

function MemberRow({
  member: m,
  canEdit,
  onEdit,
}: {
  member: TeamMember;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const { spacing } = useTheme();
  const state = MEMBER_STATE[m.state];
  return (
    <Card padding={spacing.lg} style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {m.name}
          </Text>
          <Text variant="caption" color="mutedForeground" numberOfLines={1}>
            {m.roleLabel} · {m.email}
          </Text>
        </View>
        <Badge label={state.label} tone={state.tone} />
      </View>
      <Text variant="caption" color="mutedForeground">
        Joined {formatDay(m.joinedAt)}
        {m.expiresAt ? ` · until ${formatDay(m.expiresAt)}` : ''}
      </Text>
      {canEdit ? (
        <Button
          label="Manage"
          size="sm"
          variant="secondary"
          onPress={onEdit}
          style={{ alignSelf: 'flex-start' }}
        />
      ) : null}
    </Card>
  );
}

function MemberEditor({ member: m, onDone }: { member: TeamMember; onDone: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [role, setRole] = useState<string>(m.role);
  const [until, setUntil] = useState(m.expiresAt ? m.expiresAt.slice(0, 10) : '');
  const refresh = () => qc.invalidateQueries({ queryKey: qk.agency.members });
  const fail = (fallback: string) => (e: unknown) => toast.show(errorMessage(e, fallback), 'error');

  const save = useMutation({
    mutationFn: () =>
      agencyFirmApi.updateMember(m.userId, {
        ...(role !== m.role ? { role } : {}),
        ...(until !== (m.expiresAt?.slice(0, 10) ?? '') ? { expiresAt: endOfDayLagos(until) } : {}),
      }),
    onSuccess: () => {
      refresh();
      toast.show('Saved.', 'success');
      onDone();
    },
    onError: fail('Could not save.'),
  });
  const toggle = useMutation({
    mutationFn: () =>
      m.state === 'SUSPENDED'
        ? agencyFirmApi.reinstateMember(m.userId)
        : agencyFirmApi.suspendMember(m.userId),
    onSuccess: () => {
      refresh();
      toast.show(m.state === 'SUSPENDED' ? 'Reinstated.' : 'Suspended.', 'success');
      onDone();
    },
    onError: fail('Could not change their access.'),
  });
  const remove = useMutation({
    mutationFn: () => agencyFirmApi.removeMember(m.userId),
    onSuccess: () => {
      refresh();
      toast.show('Removed from the team.', 'success');
      onDone();
    },
    onError: fail('Could not remove them.'),
  });
  const changed = role !== m.role || until !== (m.expiresAt?.slice(0, 10) ?? '');

  return (
    <View style={{ gap: spacing.lg }}>
      <ChipSelect
        label="Role"
        options={ASSIGNABLE_ROLES.map((r) => ({ value: r.value, label: r.label }))}
        value={role}
        onChange={setRole}
      />
      <Text variant="caption" color="mutedForeground">
        {ASSIGNABLE_ROLES.find((r) => r.value === role)?.hint}
      </Text>
      <DateField
        label="Access until (optional)"
        value={until}
        onChange={setUntil}
        min={toISODate(new Date())}
        hint="Leave empty to keep access open-ended."
      />
      <Button
        label="Save"
        loading={save.isPending}
        disabled={!changed || save.isPending}
        onPress={() => save.mutate()}
      />
      <Button
        label={m.state === 'SUSPENDED' ? 'Reinstate' : 'Suspend'}
        variant="secondary"
        loading={toggle.isPending}
        onPress={() => toggle.mutate()}
      />
      <Button
        label="Remove from the firm"
        variant="destructive"
        loading={remove.isPending}
        onPress={() =>
          Alert.alert(`Remove ${m.name} from the firm?`, 'Their access ends now.', [
            { text: 'Keep', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => remove.mutate() },
          ])
        }
      />
    </View>
  );
}

function InviteForm() {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('PORTFOLIO_MANAGER');
  const [until, setUntil] = useState('');
  const invite = useMutation({
    mutationFn: () =>
      agencyFirmApi.invite({
        email: email.trim(),
        role,
        membershipExpiresAt: endOfDayLagos(until),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.agency.invitations });
      toast.show(`Invitation sent to ${email.trim()}.`, 'success');
      setEmail('');
      setUntil('');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not send the invitation.'), 'error'),
  });
  return (
    <Card style={{ gap: spacing.md }}>
      <Text variant="heading">Invite someone</Text>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <ChipSelect
        label="Role"
        options={ASSIGNABLE_ROLES.map((r) => ({ value: r.value, label: r.label }))}
        value={role}
        onChange={setRole}
      />
      <Text variant="caption" color="mutedForeground">
        {ASSIGNABLE_ROLES.find((r) => r.value === role)?.hint}
      </Text>
      <DateField
        label="Access until (optional)"
        value={until}
        onChange={setUntil}
        min={toISODate(new Date())}
      />
      <Button
        label="Send invitation"
        loading={invite.isPending}
        disabled={!email.includes('@') || invite.isPending}
        onPress={() => invite.mutate()}
      />
    </Card>
  );
}

function InvitationRow({ invitation: i }: { invitation: TeamInvitation }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const revoke = useMutation({
    mutationFn: () => agencyFirmApi.revokeInvitation(i.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.agency.invitations });
      toast.show('Invitation withdrawn.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not withdraw it.'), 'error'),
  });
  return (
    <Card padding={spacing.md} style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="callout" style={{ flex: 1, fontWeight: '600' }} numberOfLines={1}>
          {i.email}
        </Text>
        <Badge
          label={i.status === 'PENDING' ? 'Invited' : 'Expired'}
          tone={i.status === 'PENDING' ? 'info' : 'warning'}
        />
      </View>
      <Text variant="caption" color="mutedForeground">
        {i.roleLabel} · link valid until {formatDay(i.expiresAt)}
        {i.membershipExpiresAt ? ` · access until ${formatDay(i.membershipExpiresAt)}` : ''}
      </Text>
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
    </Card>
  );
}
