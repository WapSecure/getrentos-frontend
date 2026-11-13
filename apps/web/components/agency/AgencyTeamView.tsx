'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, UserPlus, Users } from '@sureground/icons';
import {
  Badge,
  Button,
  Card,
  DataTable,
  DatePicker,
  EmptyState,
  Field,
  PageErrorState,
  PageHeader,
  Select,
  TableSkeleton,
  type Column,
  useToast,
} from '@sureground/ui';
import { isNoAccountMessage, personContactLabel } from '@sureground/shared';
import { formatDate } from '@/lib/format';
import { ContactField, contactIsReady } from '@/components/shared/contact/ContactField';
import { InviteToSignUp } from '@/components/shared/representatives/InviteToSignUp';
import { getStoredUser } from '@/lib/authStorage';
import {
  ASSIGNABLE_ROLE_OPTIONS,
  agencyTeamService,
  type AgencyMember,
  type AgencyStaffInvite,
  type AssignableAgencyRole,
} from '@/services/agencyTeamService';

const KEY = ['agency', 'team'] as const;

/** An end date picked as a day means "through the end of that day" in Lagos. */
const endOfDay = (day: string) => (day ? new Date(`${day}T23:59:59+01:00`).toISOString() : null);

export function AgencyTeamView() {
  const queryClient = useQueryClient();
  const myId = getStoredUser<{ id?: string }>()?.id;
  const toast = useToast();
  const [contact, setContact] = useState('');
  const [noAccount, setNoAccount] = useState(false);
  const [role, setRole] = useState<AssignableAgencyRole>('PORTFOLIO_MANAGER');
  const [endDay, setEndDay] = useState('');

  const members = useQuery({
    queryKey: [...KEY, 'members'],
    queryFn: async () => {
      const res = await agencyTeamService.members();
      if (!res.success) throw new Error(res.error || 'Could not load your team.');
      return res.data ?? [];
    },
  });
  const principal = (members.data ?? []).find((m) => m.role === 'OWNER');
  const isPrincipal = !!principal && principal.userId === myId;

  const invites = useQuery({
    queryKey: [...KEY, 'invites'],
    enabled: isPrincipal,
    queryFn: async () => {
      const res = await agencyTeamService.invitations();
      if (!res.success) throw new Error(res.error || 'Could not load invitations.');
      return res.data ?? [];
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: KEY });
  const done = (message: string) => {
    refresh();
    toast.success(message);
  };
  const fail = (e: Error) => toast.error(e.message || 'Something went wrong.');
  const run =
    <T,>(fn: () => Promise<{ success: boolean; error?: string; data?: T }>) =>
    async () => {
      const res = await fn();
      if (!res.success) throw new Error(res.error || 'Something went wrong.');
      return res.data;
    };

  const invite = useMutation({
    mutationFn: run(() =>
      agencyTeamService.invite({
        contact: contact.trim(),
        role,
        membershipExpiresAt: endOfDay(endDay),
      })
    ),
    onSuccess: (sent) => {
      const who = contact.trim();
      setContact('');
      setEndDay('');
      setNoAccount(false);
      done(
        (sent as AgencyStaffInvite | undefined)?.deliveredBy?.includes('EMAIL')
          ? `Invitation sent to ${who}.`
          : `Invitation sent to ${who} in their Sureground app.`
      );
    },
    onError: (e: Error) => {
      if (isNoAccountMessage(e.message)) setNoAccount(true);
      else fail(e);
    },
  });
  const revoke = useMutation({
    mutationFn: (id: string) => run(() => agencyTeamService.revoke(id))(),
    onSuccess: () => done('Invitation withdrawn.'),
    onError: fail,
  });
  const update = useMutation({
    mutationFn: (v: { userId: string; role?: AssignableAgencyRole; expiresAt?: string | null }) =>
      run(() => agencyTeamService.update(v.userId, { role: v.role, expiresAt: v.expiresAt }))(),
    onSuccess: () => done('Saved.'),
    onError: fail,
  });
  const act = useMutation({
    mutationFn: (v: { userId: string; action: 'suspend' | 'reinstate' | 'remove' }) =>
      run(() => agencyTeamService[v.action](v.userId))(),
    onSuccess: (_d, v) =>
      done(
        v.action === 'suspend'
          ? 'Suspended.'
          : v.action === 'reinstate'
            ? 'Reinstated.'
            : 'Removed from the team.'
      ),
    onError: fail,
  });

  const columns: Column<AgencyMember>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (m) => (
        <>
          <p className="text-foreground">{m.name}</p>
          {m.email && <p className="text-xs text-muted-foreground">{m.email}</p>}
        </>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (m) =>
        isPrincipal && m.role !== 'OWNER' ? (
          <Select
            value={m.role}
            onValueChange={(v) =>
              update.mutate({ userId: m.userId, role: v as AssignableAgencyRole })
            }
            options={ASSIGNABLE_ROLE_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            ariaLabel={`Role for ${m.name}`}
          />
        ) : (
          m.roleLabel
        ),
    },
    {
      key: 'until',
      header: 'Until',
      className: 'text-muted-foreground',
      render: (m) =>
        isPrincipal && m.role !== 'OWNER' ? (
          <DatePicker
            value={m.expiresAt ? m.expiresAt.slice(0, 10) : ''}
            onChange={(day) => update.mutate({ userId: m.userId, expiresAt: endOfDay(day) })}
            ariaLabel={`Access end date for ${m.name}`}
          />
        ) : m.expiresAt ? (
          formatDate(m.expiresAt)
        ) : (
          'No end date'
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (m) => (
        <Badge
          variant={
            m.state === 'ACTIVE' ? 'success' : m.state === 'SUSPENDED' ? 'warning' : 'neutral'
          }
        >
          {m.state === 'ACTIVE' ? 'Active' : m.state === 'SUSPENDED' ? 'Suspended' : 'Ended'}
        </Badge>
      ),
    },
    ...(isPrincipal
      ? [
          {
            key: 'actions',
            header: '',
            srHeader: 'Actions',
            align: 'right',
            render: (m) =>
              m.role !== 'OWNER' && (
                <span className="flex justify-end gap-1">
                  {m.state === 'SUSPENDED' ? (
                    <Button
                      variant="ghost"
                      onClick={() => act.mutate({ userId: m.userId, action: 'reinstate' })}
                    >
                      Reinstate
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() => act.mutate({ userId: m.userId, action: 'suspend' })}
                    >
                      Suspend
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      if (
                        window.confirm(`Remove ${m.name} from the firm? Their access ends now.`)
                      ) {
                        act.mutate({ userId: m.userId, action: 'remove' });
                      }
                    }}
                  >
                    Remove
                  </Button>
                </span>
              ),
          } satisfies Column<AgencyMember>,
        ]
      : []),
  ];

  if (members.isError && !members.data) {
    return (
      <div className="p-6">
        <PageErrorState
          title="Could not load your team"
          description={(members.error as Error).message}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <PageHeader
        title="Team"
        description="Who works for the firm, in what role, and until when. Operating roles get your clients’ properties as soon as they join; suspending or removing someone takes that away at once."
      />

      {isPrincipal && (
        <Card className="mb-6 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <UserPlus className="h-4 w-4 text-muted-foreground" /> Invite someone
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_220px_180px_auto] md:items-end">
            <ContactField
              id="team-invite-contact"
              label="Phone number or email"
              hint=""
              value={contact}
              onChange={(next) => {
                setContact(next);
                setNoAccount(false);
              }}
            />
            <Field label="Role">
              <Select
                value={role}
                onValueChange={(v) => setRole(v as AssignableAgencyRole)}
                options={ASSIGNABLE_ROLE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              />
            </Field>
            <Field label="Until (optional)">
              <DatePicker value={endDay} onChange={setEndDay} clearable />
            </Field>
            <Button
              onClick={() => invite.mutate()}
              disabled={!contactIsReady(contact)}
              isLoading={invite.isPending}
              loadingText="Sending…"
            >
              Send invite
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {ASSIGNABLE_ROLE_OPTIONS.find((o) => o.value === role)?.hint}. Someone already on
            Sureground gets the invitation in their app; an email address also gets it by email.
          </p>
          {noAccount && (
            <div className="mt-3">
              <InviteToSignUp
                message="Nobody on Sureground uses that phone number yet, and we cannot text an invite. Send them the signup link, or invite them by email instead."
                reason="add you to our team"
                footnote="Once they have signed up, invite them here with the same phone number."
              />
            </div>
          )}

          {(invites.data ?? []).length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Open invitations</p>
              <ul className="divide-y divide-border/60">
                {(invites.data ?? []).map((i) => (
                  <li
                    key={i.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {personContactLabel(i) ?? 'Invited by phone'} · {i.roleLabel}
                      {i.membershipExpiresAt ? ` · until ${formatDate(i.membershipExpiresAt)}` : ''}
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge variant={i.status === 'EXPIRED' ? 'neutral' : 'info'}>
                        {i.status === 'EXPIRED'
                          ? 'Link expired'
                          : `Expires ${formatDate(i.expiresAt)}`}
                      </Badge>
                      <Button
                        variant="ghost"
                        onClick={() => revoke.mutate(i.id)}
                        disabled={revoke.isPending}
                        isLoading={revoke.isPending && revoke.variables === i.id}
                      >
                        Withdraw
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {members.isLoading ? (
        <TableSkeleton rows={4} columns={4} />
      ) : (members.data ?? []).length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team yet"
          description="Invite people to work with you."
        />
      ) : (
        <DataTable
          caption="Your team members"
          density="compact"
          columns={columns}
          data={members.data ?? []}
          getRowKey={(m) => m.userId}
        />
      )}
    </div>
  );
}
