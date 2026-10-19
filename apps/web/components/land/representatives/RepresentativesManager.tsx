'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Checkbox,
  Input,
  PageErrorState,
  Select,
  Textarea,
  Toast,
} from '@getrentos/ui';
import { UserPlus } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import {
  landRepresentativeKeys,
  landRepresentativeService,
} from '@/services/landRepresentativeService';
import {
  REPRESENTATIVE_RELATIONSHIP_LABELS,
  REPRESENTATIVE_SCOPE_LABELS,
  REPRESENTATIVE_STATUS_LABELS,
  type LandRepresentativeAppointment,
  type RepresentativeRelationship,
  type RepresentativeScope,
} from '@/types/landRepresentative';

const SCOPES = Object.keys(REPRESENTATIVE_SCOPE_LABELS) as RepresentativeScope[];

const AppointmentRow = ({
  appointment,
  onRevoke,
  busy,
}: {
  appointment: LandRepresentativeAppointment;
  onRevoke: (reason: string) => void;
  busy: boolean;
}) => {
  const [ending, setEnding] = useState(false);
  const [reason, setReason] = useState('');
  const live = appointment.status === 'INVITED' || appointment.status === 'ACTIVE';
  return (
    <li className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-foreground">{appointment.name ?? appointment.email}</p>
          <p className="text-xs text-muted-foreground">
            {REPRESENTATIVE_RELATIONSHIP_LABELS[appointment.relationship]} · {appointment.email}
          </p>
        </div>
        <Badge
          variant={
            appointment.status === 'ACTIVE'
              ? 'success'
              : appointment.status === 'INVITED'
                ? 'warning'
                : 'neutral'
          }
        >
          {REPRESENTATIVE_STATUS_LABELS[appointment.status]}
        </Badge>
      </div>
      <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
        {appointment.scopes.map((scope) => (
          <li key={scope}>{REPRESENTATIVE_SCOPE_LABELS[scope]}</li>
        ))}
      </ul>
      {appointment.endedAt && (
        <p className="mt-2 text-xs text-muted-foreground">
          Ended {formatDate(appointment.endedAt)}
          {appointment.endedReason ? `: ${appointment.endedReason}` : ''}
        </p>
      )}
      {live &&
        (ending ? (
          <div className="mt-3 space-y-2">
            <Input
              value={reason}
              maxLength={500}
              onChange={(e) => setReason(e.target.value)}
              aria-label="Why you are ending this appointment"
              placeholder="Why you are ending this appointment"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="danger"
                disabled={reason.trim().length < 3 || busy}
                isLoading={busy}
                onClick={() => onRevoke(reason)}
              >
                End appointment
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEnding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="ghost" className="mt-2" onClick={() => setEnding(true)}>
            End appointment
          </Button>
        ))}
    </li>
  );
};

/** The buyer appoints, and ends, the people who act for them on land. */
export const RepresentativesManager = () => {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState<RepresentativeRelationship | ''>('');
  const [scopes, setScopes] = useState<RepresentativeScope[]>(['VIEW']);
  const [note, setNote] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );

  const list = useQuery({
    queryKey: landRepresentativeKeys.mine,
    queryFn: () => unwrap(landRepresentativeService.mine()),
  });
  const appoint = useMutation({
    mutationFn: () =>
      unwrap(
        landRepresentativeService.appoint({
          email,
          relationship: relationship as RepresentativeRelationship,
          scopes,
          note,
        })
      ),
    onSuccess: (next) => {
      queryClient.setQueryData(landRepresentativeKeys.mine, next);
      setEmail('');
      setRelationship('');
      setScopes(['VIEW']);
      setNote('');
      setToast({ message: 'Invitation sent. They need to accept it.', variant: 'success' });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });
  const revoke = useMutation({
    mutationFn: (v: { id: string; reason: string }) =>
      unwrap(landRepresentativeService.revoke(v.id, v.reason)),
    onSuccess: (next) => {
      queryClient.setQueryData(landRepresentativeKeys.mine, next);
      setToast({ message: 'Appointment ended.', variant: 'success' });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const toggle = (scope: RepresentativeScope, on: boolean) =>
    setScopes((current) => (on ? [...current, scope] : current.filter((s) => s !== scope)));
  const canSubmit =
    /\S+@\S+\.\S+/.test(email.trim()) &&
    relationship !== '' &&
    scopes.length > 0 &&
    !appoint.isPending;

  return (
    <div className="space-y-8">
      <section
        aria-labelledby="appoint-heading"
        className="rounded-2xl border border-border bg-card p-5"
      >
        <h2 id="appoint-heading" className="flex items-center gap-2 font-semibold text-foreground">
          <UserPlus className="h-4 w-4 text-primary" aria-hidden /> Appoint someone
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          They need a GetRentos account, and must verify their identity before they can approve
          payments. They accept the appointment themselves.
        </p>
        <form
          className="mt-4 grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) appoint.mutate();
          }}
        >
          <div className="space-y-1.5">
            <label htmlFor="rep-email" className="text-sm font-medium text-foreground">
              Their email on GetRentos
            </label>
            <Input
              id="rep-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-foreground">Who they are to you</span>
            <Select
              value={relationship}
              onValueChange={(v) => setRelationship(v as RepresentativeRelationship)}
              ariaLabel="Relationship"
              placeholder="Choose"
              options={Object.entries(REPRESENTATIVE_RELATIONSHIP_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </div>
          <fieldset className="space-y-2 sm:col-span-2">
            <legend className="text-sm font-medium text-foreground">They may</legend>
            {SCOPES.map((scope) => (
              <label key={scope} className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox
                  checked={scopes.includes(scope)}
                  onCheckedChange={(on) => toggle(scope, on)}
                  aria-label={REPRESENTATIVE_SCOPE_LABELS[scope]}
                />
                {REPRESENTATIVE_SCOPE_LABELS[scope]}
              </label>
            ))}
          </fieldset>
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="rep-note" className="text-sm font-medium text-foreground">
              Note to them (optional)
            </label>
            <Textarea
              id="rep-note"
              rows={2}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={!canSubmit} isLoading={appoint.isPending}>
              Send invitation
            </Button>
          </div>
        </form>
      </section>

      <section aria-labelledby="reps-heading" className="space-y-3">
        <h2 id="reps-heading" className="text-lg font-semibold text-foreground">
          Your representatives
        </h2>
        {list.isLoading ? (
          <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
        ) : list.isError ? (
          <PageErrorState
            description={list.error instanceof Error ? list.error.message : undefined}
            onRetry={() => list.refetch()}
            isRetrying={list.isRefetching}
          />
        ) : (list.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">You have not appointed anyone yet.</p>
        ) : (
          <ul className="space-y-3">
            {(list.data ?? []).map((appointment) => (
              <AppointmentRow
                key={appointment.id}
                appointment={appointment}
                busy={revoke.isPending && revoke.variables?.id === appointment.id}
                onRevoke={(reason) => revoke.mutate({ id: appointment.id, reason })}
              />
            ))}
          </ul>
        )}
      </section>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
};
