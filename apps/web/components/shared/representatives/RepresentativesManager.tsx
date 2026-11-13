'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  CheckboxGroup,
  Field,
  Input,
  ListSkeleton,
  PageErrorState,
  Select,
  Textarea,
  Toast,
} from '@sureground/ui';
import { UserPlus } from '@sureground/icons';
import { isNoAccountMessage, personContactLabel, readContactInput } from '@sureground/shared';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { representativeKeys, representativeService } from '@/services/representativeService';
import { InviteToSignUp } from './InviteToSignUp';
import {
  REPRESENTATIVE_RELATIONSHIP_LABELS,
  REPRESENTATIVE_SCOPE_LABELS,
  REPRESENTATIVE_STATUS_LABELS,
  type LandRepresentativeAppointment,
  type RepresentativeRelationship,
  type RepresentativeScope,
} from '@/types/landRepresentative';

const NO_ACCOUNT_MESSAGE =
  'No Sureground account uses that phone number or email. Ask them to sign up first, then appoint them.';

const SCOPE_OPTIONS = (Object.keys(REPRESENTATIVE_SCOPE_LABELS) as RepresentativeScope[]).map(
  (scope) => ({ value: scope, label: REPRESENTATIVE_SCOPE_LABELS[scope] })
);

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
  const contactLabel = personContactLabel(appointment);
  return (
    <li>
      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-foreground">{appointment.name ?? contactLabel}</p>
            <p className="text-xs text-muted-foreground">
              {REPRESENTATIVE_RELATIONSHIP_LABELS[appointment.relationship]}
              {contactLabel ? ` · ${contactLabel}` : ''}
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
      </Card>
    </li>
  );
};

export const RepresentativesManager = () => {
  const queryClient = useQueryClient();
  const [contact, setContact] = useState('');
  const [contactTouched, setContactTouched] = useState(false);
  const [noAccount, setNoAccount] = useState<string | null>(null);
  const [relationship, setRelationship] = useState<RepresentativeRelationship | ''>('');
  const [scopes, setScopes] = useState<RepresentativeScope[]>(['VIEW']);
  const [note, setNote] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );

  const list = useQuery({
    queryKey: representativeKeys.mine,
    queryFn: () => unwrap(representativeService.mine()),
  });
  const appoint = useMutation({
    mutationFn: () =>
      unwrap(
        representativeService.appoint({
          contact,
          relationship: relationship as RepresentativeRelationship,
          scopes,
          note,
        })
      ),
    onSuccess: (next) => {
      queryClient.setQueryData(representativeKeys.mine, next);
      setContact('');
      setContactTouched(false);
      setNoAccount(null);
      setRelationship('');
      setScopes(['VIEW']);
      setNote('');
      setToast({ message: 'Invitation sent. They need to accept it.', variant: 'success' });
    },
    onError: (reason: Error) => {
      if (isNoAccountMessage(reason.message)) setNoAccount(NO_ACCOUNT_MESSAGE);
      else setToast({ message: reason.message, variant: 'error' });
    },
  });
  const revoke = useMutation({
    mutationFn: (v: { id: string; reason: string }) =>
      unwrap(representativeService.revoke(v.id, v.reason)),
    onSuccess: (next) => {
      queryClient.setQueryData(representativeKeys.mine, next);
      setToast({ message: 'Appointment ended.', variant: 'success' });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const contactInput = readContactInput(contact);
  const contactError =
    contactTouched && contactInput.kind === 'invalid' ? contactInput.message : undefined;
  const canSubmit =
    (contactInput.kind === 'email' || contactInput.kind === 'phone') &&
    relationship !== '' &&
    scopes.length > 0 &&
    !appoint.isPending;

  return (
    <div className="space-y-8">
      <Card className="p-5">
        <section aria-labelledby="appoint-heading">
          <h2
            id="appoint-heading"
            className="flex items-center gap-2 font-semibold text-foreground"
          >
            <UserPlus className="h-4 w-4 text-primary" aria-hidden /> Appoint someone
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            They need a Sureground account, and must verify their identity before they can approve
            payments. They accept the appointment themselves.
          </p>
          <form
            className="mt-4 grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (canSubmit) appoint.mutate();
            }}
          >
            <Field
              label="Their phone number or email on Sureground"
              htmlFor="rep-contact"
              hint="The one they signed up with, for example 0803 123 4567"
              error={contactError}
            >
              <Input
                id="rep-contact"
                type="text"
                inputMode="email"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                value={contact}
                onChange={(e) => {
                  setContact(e.target.value);
                  setNoAccount(null);
                }}
                onBlur={() => setContactTouched(true)}
              />
            </Field>
            <Field label="Who they are to you">
              <Select
                value={relationship}
                onValueChange={(v) => setRelationship(v as RepresentativeRelationship)}
                ariaLabel="Relationship"
                placeholder="Choose"
                options={Object.entries(REPRESENTATIVE_RELATIONSHIP_LABELS).map(
                  ([value, label]) => ({
                    value,
                    label,
                  })
                )}
              />
            </Field>
            <CheckboxGroup
              legend="They may"
              value={scopes}
              onValueChange={setScopes}
              options={SCOPE_OPTIONS}
              className="sm:col-span-2"
            />
            <Field label="Note to them (optional)" htmlFor="rep-note" className="sm:col-span-2">
              <Textarea
                id="rep-note"
                rows={2}
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Field>
            {noAccount && (
              <div className="sm:col-span-2">
                <InviteToSignUp message={noAccount} />
              </div>
            )}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={!canSubmit} isLoading={appoint.isPending}>
                Send invitation
              </Button>
            </div>
          </form>
        </section>
      </Card>

      <section aria-labelledby="reps-heading" className="space-y-3">
        <h2 id="reps-heading" className="text-lg font-semibold text-foreground">
          Your representatives
        </h2>
        {list.isLoading ? (
          <ListSkeleton rows={2} variant="cards" label="Loading representatives" />
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
