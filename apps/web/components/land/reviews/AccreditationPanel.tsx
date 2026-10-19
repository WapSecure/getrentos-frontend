'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  DatePicker,
  DocumentUpload,
  Field,
  Input,
  PageErrorState,
  Select,
  Textarea,
  Toast,
  type PendingUpload,
} from '@getrentos/ui';
import { BadgeCheck, FileText } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { NIGERIA_STATES } from '@/lib/constants/locations';
import { landProfessionalKeys, landProfessionalService } from '@/services/landProfessionalService';
import { LAND_REVIEWER_ROLE_LABELS, type LandReviewerRole } from '@/types/landReviewer';
import {
  LAND_PROFESSIONAL_REGULATORS,
  LAND_PROFESSIONAL_STATUS_LABELS,
  type LandProfessional,
  type LandProfessionalStatus,
} from '@/types/landProfessional';

const ROLES = Object.keys(LAND_REVIEWER_ROLE_LABELS) as LandReviewerRole[];

const STATUS_VARIANT: Record<LandProfessionalStatus, 'success' | 'warning' | 'danger' | 'neutral'> =
  {
    ACCREDITED: 'success',
    APPLIED: 'warning',
    REJECTED: 'danger',
    SUSPENDED: 'danger',
    EXPIRED: 'neutral',
  };

/** Roles a fresh application may be made for: none open, accredited or suspended. */
const openRoles = (records: LandProfessional[]) =>
  ROLES.filter(
    (role) =>
      !records.some(
        (r) => r.role === role && ['APPLIED', 'ACCREDITED', 'SUSPENDED'].includes(r.status)
      )
  );

const AccreditationRecord = ({
  record,
  onAppeal,
  appealing,
}: {
  record: LandProfessional;
  onAppeal: (reason: string) => void;
  appealing: boolean;
}) => {
  const [reason, setReason] = useState('');
  const canAppeal = record.status === 'SUSPENDED' && !record.appealedAt;
  return (
    <li>
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-foreground">{LAND_REVIEWER_ROLE_LABELS[record.role]}</p>
          <Badge variant={STATUS_VARIANT[record.status]}>
            {LAND_PROFESSIONAL_STATUS_LABELS[record.status]}
          </Badge>
        </div>
        <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Licence</dt>
            <dd className="text-right text-foreground">
              {record.regulator} {record.licenceNumber}
            </dd>
          </div>
          {record.licenceExpiresAt && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Licence expires</dt>
              <dd className="text-right text-foreground">{formatDate(record.licenceExpiresAt)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3 sm:col-span-2">
            <dt className="text-muted-foreground">States</dt>
            <dd className="text-right text-foreground">{record.practiceStates.join(', ')}</dd>
          </div>
          {record.insurer && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Indemnity insurer</dt>
              <dd className="text-right text-foreground">{record.insurer}</dd>
            </div>
          )}
        </dl>
        {record.credentialUrl && (
          <a
            href={record.credentialUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <FileText className="h-4 w-4" aria-hidden /> Credential on file
          </a>
        )}
        {record.decisionNote && record.status !== 'SUSPENDED' && (
          <p className="mt-3 rounded-xl bg-secondary p-3 text-sm text-foreground">
            {record.decisionNote}
          </p>
        )}
        {record.status === 'EXPIRED' && (
          <p className="mt-3 text-sm text-muted-foreground">
            Your licence on file has lapsed. Apply again below with the renewed licence.
          </p>
        )}
        {record.status === 'SUSPENDED' && (
          <div className="mt-3 space-y-3">
            <p className="rounded-xl bg-destructive/10 p-3 text-sm text-foreground">
              Suspended{record.suspendedAt ? ` on ${formatDate(record.suspendedAt)}` : ''}:{' '}
              {record.suspendedReason}
            </p>
            {record.appealedAt ? (
              <p className="text-sm text-muted-foreground">
                You appealed on {formatDate(record.appealedAt)}. Staff will review it.
              </p>
            ) : (
              canAppeal && (
                <form
                  className="space-y-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    onAppeal(reason);
                  }}
                >
                  <label
                    htmlFor={`appeal-${record.id}`}
                    className="text-sm font-medium text-foreground"
                  >
                    Appeal (once)
                  </label>
                  <Textarea
                    id={`appeal-${record.id}`}
                    rows={3}
                    maxLength={5000}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Why the suspension should be lifted, and any evidence."
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={reason.trim().length < 20 || appealing}
                    isLoading={appealing}
                  >
                    Send appeal
                  </Button>
                </form>
              )
            )}
          </div>
        )}
      </Card>
    </li>
  );
};

/** Apply for, and track, accreditation as a land surveyor, lawyer, valuer or inspector. */
export const AccreditationPanel = () => {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );
  const [role, setRole] = useState<LandReviewerRole | ''>('');
  const [licenceNumber, setLicenceNumber] = useState('');
  const [licenceExpiresAt, setLicenceExpiresAt] = useState('');
  const [states, setStates] = useState<string[]>([]);
  const [insurer, setInsurer] = useState('');
  const [insuranceExpiresAt, setInsuranceExpiresAt] = useState('');
  const [credential, setCredential] = useState<PendingUpload[]>([]);

  const mine = useQuery({
    queryKey: landProfessionalKeys.mine,
    queryFn: () => unwrap(landProfessionalService.mine()),
  });

  const apply = useMutation({
    mutationFn: () =>
      unwrap(
        landProfessionalService.apply({
          role: role as LandReviewerRole,
          licenceNumber,
          licenceExpiresAt: licenceExpiresAt || undefined,
          practiceStates: states,
          insurer,
          insuranceExpiresAt: insuranceExpiresAt || undefined,
          file: credential[0]?.file,
        })
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: landProfessionalKeys.mine });
      setRole('');
      setLicenceNumber('');
      setLicenceExpiresAt('');
      setStates([]);
      setInsurer('');
      setInsuranceExpiresAt('');
      setCredential([]);
      setToast({
        message: 'Application sent. We will check the register and let you know.',
        variant: 'success',
      });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const appeal = useMutation({
    mutationFn: (v: { id: string; reason: string }) =>
      unwrap(landProfessionalService.appeal(v.id, v.reason)),
    onSuccess: (next) => {
      queryClient.setQueryData(landProfessionalKeys.mine, next);
      setToast({ message: 'Appeal sent.', variant: 'success' });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  if (mine.isLoading)
    return <div className="h-48 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  if (mine.isError) {
    return (
      <PageErrorState
        title="Your accreditation could not be loaded"
        description={mine.error instanceof Error ? mine.error.message : undefined}
        onRetry={() => mine.refetch()}
        isRetrying={mine.isRefetching}
      />
    );
  }

  const records = mine.data ?? [];
  const available = openRoles(records);
  const today = new Date().toISOString().slice(0, 10);
  const canSubmit =
    role !== '' && licenceNumber.trim().length >= 2 && states.length > 0 && !apply.isPending;

  return (
    <div className="space-y-8">
      {records.length > 0 && (
        <section aria-labelledby="my-accreditation" className="space-y-3">
          <h2 id="my-accreditation" className="text-lg font-semibold text-foreground">
            Your accreditation
          </h2>
          <ul className="space-y-3">
            {records.map((record) => (
              <AccreditationRecord
                key={record.id}
                record={record}
                appealing={appeal.isPending && appeal.variables?.id === record.id}
                onAppeal={(reason) => appeal.mutate({ id: record.id, reason })}
              />
            ))}
          </ul>
        </section>
      )}

      {available.length > 0 && (
        <Card className="p-5">
          <section aria-labelledby="apply-heading">
            <h2
              id="apply-heading"
              className="flex items-center gap-2 text-lg font-semibold text-foreground"
            >
              <BadgeCheck className="h-5 w-5 text-primary" aria-hidden /> Apply for accreditation
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We check your licence against the regulator&rsquo;s register before you can be
              engaged. You will only be offered cases in the states you cover.
            </p>
            <form
              className="mt-5 grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (canSubmit) apply.mutate();
              }}
            >
              <Field label="Role">
                <Select
                  value={role}
                  onValueChange={(value) => setRole(value as LandReviewerRole)}
                  ariaLabel="Role"
                  placeholder="Choose a role"
                  options={available.map((r) => ({
                    value: r,
                    label: LAND_REVIEWER_ROLE_LABELS[r],
                  }))}
                />
              </Field>
              <Field
                label="Licence or registration number"
                htmlFor="licence-number"
                hint={
                  role
                    ? `Checked against the ${LAND_PROFESSIONAL_REGULATORS[role]} register.`
                    : undefined
                }
              >
                <Input
                  id="licence-number"
                  value={licenceNumber}
                  maxLength={100}
                  onChange={(e) => setLicenceNumber(e.target.value)}
                />
              </Field>
              <Field label="Licence expires" hint="Leave blank if it does not expire.">
                <DatePicker
                  value={licenceExpiresAt}
                  onChange={setLicenceExpiresAt}
                  min={today}
                  placeholder="Pick the expiry date"
                />
              </Field>
              <Field label="Licence or practising certificate" hint="PDF or image, up to 20 MB.">
                <DocumentUpload
                  value={credential}
                  onChange={setCredential}
                  accept="application/pdf,image/*"
                  multiple={false}
                  maxSizeMB={20}
                />
              </Field>
              <Field label="Professional indemnity insurer" htmlFor="insurer" hint="Optional.">
                <Input
                  id="insurer"
                  value={insurer}
                  maxLength={200}
                  onChange={(e) => setInsurer(e.target.value)}
                />
              </Field>
              <Field label="Insurance expires" hint="Optional.">
                <DatePicker
                  value={insuranceExpiresAt}
                  onChange={setInsuranceExpiresAt}
                  min={today}
                  placeholder="Pick the expiry date"
                />
              </Field>
              <fieldset className="sm:col-span-2">
                <legend className="text-sm font-medium text-foreground">
                  States you cover{states.length ? ` (${states.length})` : ''}
                </legend>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
                  {NIGERIA_STATES.map((state) => (
                    <label key={state} className="flex items-center gap-2 text-sm text-foreground">
                      <Checkbox
                        checked={states.includes(state)}
                        onCheckedChange={(on) =>
                          setStates((current) =>
                            on ? [...current, state] : current.filter((s) => s !== state)
                          )
                        }
                        aria-label={state}
                      />
                      {state}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={!canSubmit} isLoading={apply.isPending}>
                  Send application
                </Button>
              </div>
            </form>
          </section>
        </Card>
      )}

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
};
