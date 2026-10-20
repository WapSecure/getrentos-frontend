'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, UserPlus, Users } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  DatePicker,
  EmptyState,
  Field,
  Input,
  PageErrorState,
  Select,
  TableSkeleton,
  useToast,
} from '@getrentos/ui';
import { formatDate } from '@/lib/format';
import { getStoredUser } from '@/lib/authStorage';
import {
  ASSIGNABLE_ROLE_OPTIONS,
  agencyTeamService,
  type AgencyMember,
  type AssignableAgencyRole,
} from '@/services/agencyTeamService';

const KEY = ['agency', 'team'] as const;

/** An end date picked as a day means "through the end of that day" in Lagos. */
const endOfDay = (day: string) => (day ? new Date(`${day}T23:59:59+01:00`).toISOString() : null);

/**
 * The firm's team. Everyone on it can see who's who; only the principal can
 * invite, change a role or end date, suspend or remove. Operating roles get the
 * firm's client properties as soon as they join; an accountant does not.
 */
export function AgencyTeamView() {
  const queryClient = useQueryClient();
  const myId = getStoredUser<{ id?: string }>()?.id;
  const toast = useToast();
  const [email, setEmail] = useState('');
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
  const fail = (e: Error) =>
    toast.error(e.message || 'Something went wrong.');
  const run =
    <T,>(fn: () => Promise<{ success: boolean; error?: string; data?: T }>) =>
    async () => {
      const res = await fn();
      if (!res.success) throw new Error(res.error || 'Something went wrong.');
      return res.data;
    };

  const invite = useMutation({
    mutationFn: run(() =>
      agencyTeamService.invite({ email: email.trim(), role, membershipExpiresAt: endOfDay(endDay) })
    ),
    onSuccess: () => {
      setEmail('');
      setEndDay('');
      done(`Invitation sent to ${email.trim()}.`);
    },
    onError: fail,
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
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Users className="h-6 w-6 text-primary" aria-hidden />
          Team
        </h1>
        <p className="mt-1 text-muted-foreground">
          Who works for the firm, in what role, and until when. Operating roles get your clients’
          properties as soon as they join; suspending or removing someone takes that away at once.
        </p>
      </div>

      {isPrincipal && (
        <Card className="mb-6 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <UserPlus className="h-4 w-4 text-muted-foreground" /> Invite someone
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_220px_180px_auto] md:items-end">
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@yourfirm.ng"
              />
            </Field>
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
              disabled={!email.includes('@')}
              isLoading={invite.isPending}
              loadingText="Sending…"
            >
              Send invite
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {ASSIGNABLE_ROLE_OPTIONS.find((o) => o.value === role)?.hint}. They join by signing in
            with this email.
          </p>

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
                      {i.email} · {i.roleLabel}
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
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Role</th>
                <th className="px-4 py-2.5 font-medium">Until</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                {isPrincipal && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {(members.data ?? []).map((m: AgencyMember) => {
                const editable = isPrincipal && m.role !== 'OWNER';
                return (
                  <tr key={m.userId}>
                    <td className="px-4 py-2.5">
                      <p className="text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      {editable ? (
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
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {editable ? (
                        <DatePicker
                          value={m.expiresAt ? m.expiresAt.slice(0, 10) : ''}
                          onChange={(day) =>
                            update.mutate({ userId: m.userId, expiresAt: endOfDay(day) })
                          }
                          ariaLabel={`Access end date for ${m.name}`}
                        />
                      ) : m.expiresAt ? (
                        formatDate(m.expiresAt)
                      ) : (
                        'No end date'
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge
                        variant={
                          m.state === 'ACTIVE'
                            ? 'success'
                            : m.state === 'SUSPENDED'
                              ? 'warning'
                              : 'neutral'
                        }
                      >
                        {m.state === 'ACTIVE'
                          ? 'Active'
                          : m.state === 'SUSPENDED'
                            ? 'Suspended'
                            : 'Ended'}
                      </Badge>
                    </td>
                    {isPrincipal && (
                      <td className="px-4 py-2.5 text-right">
                        {editable && (
                          <span className="flex justify-end gap-1">
                            {m.state === 'SUSPENDED' ? (
                              <Button
                                variant="ghost"
                                onClick={() =>
                                  act.mutate({ userId: m.userId, action: 'reinstate' })
                                }
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
                                  window.confirm(
                                    `Remove ${m.name} from the firm? Their access ends now.`
                                  )
                                ) {
                                  act.mutate({ userId: m.userId, action: 'remove' });
                                }
                              }}
                            >
                              Remove
                            </Button>
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
