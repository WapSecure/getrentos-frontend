'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileCheck,
  FileX,
  Loader2,
  Phone,
  Users,
} from 'lucide-react';
import { Button, LegacyInput, LegacySelect } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { landlordService } from '@/services/landlordService';
import { CreditSummaryView } from '@/components/shared/credit/CreditSummaryView';
import type {
  AffordabilityBand,
  ReferenceOutcome,
  ScreeningFlagLevel,
  ScreeningReference,
} from '@/types/landlord';

const flagStyle: Record<
  ScreeningFlagLevel,
  { icon: React.ElementType; className: string; label: string }
> = {
  concern: { icon: AlertOctagon, className: 'text-red-600 dark:text-red-400', label: 'Concern' },
  watch: {
    icon: AlertTriangle,
    className: 'text-amber-600 dark:text-amber-400',
    label: 'Worth a look',
  },
  ok: { icon: CheckCircle2, className: 'text-green-600 dark:text-green-400', label: 'Fine' },
};

const bandLabel: Record<AffordabilityBand, { text: string; className: string }> = {
  comfortable: {
    text: 'Comfortable',
    className: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  },
  stretched: {
    text: 'A stretch',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  },
  high: { text: 'High', className: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
  unknown: { text: 'Can’t tell', className: 'bg-secondary text-muted-foreground' },
};

const outcomeLabel: Record<ReferenceOutcome, string> = {
  not_contacted: 'Not contacted',
  confirmed: 'Confirmed',
  concern: 'Concern raised',
  unreachable: 'Couldn’t reach',
};

const outcomeClass: Record<ReferenceOutcome, string> = {
  not_contacted: 'bg-secondary text-muted-foreground',
  confirmed: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  concern: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  unreachable: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
    {children}
  </h4>
);

const ReferenceRow = ({
  reference,
  applicationId,
}: {
  reference: ScreeningReference;
  applicationId: string;
}) => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<ReferenceOutcome>(
    reference.status === 'not_contacted' ? 'confirmed' : reference.status
  );
  const [note, setNote] = useState(reference.note ?? '');

  const save = useMutation({
    mutationFn: () =>
      unwrap(
        landlordService.updateReferenceCheck(applicationId, reference.id, {
          status,
          note: note.trim() || undefined,
        })
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: landlordKeys.applicationScreening(applicationId),
      });
      setEditing(false);
    },
  });

  return (
    <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-white/5 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-foreground font-medium">
            {reference.name}{' '}
            <span className="text-xs text-muted-foreground font-normal">
              ({reference.relationship})
            </span>
          </p>
          <a
            href={`tel:${reference.phone}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
          >
            <Phone className="w-3 h-3" />
            {reference.phone}
          </a>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${outcomeClass[reference.status]}`}
        >
          {outcomeLabel[reference.status]}
        </span>
      </div>

      {reference.note && !editing && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          “{reference.note}”
          {reference.checkedAt && <span> · {formatDate(reference.checkedAt)}</span>}
        </p>
      )}

      {editing ? (
        <div className="mt-2 space-y-2">
          <LegacySelect
            value={status}
            onChange={(event) => setStatus(event.target.value as ReferenceOutcome)}
            aria-label="Outcome"
            className="w-full px-2 py-1.5 rounded-lg border border-border bg-card text-sm text-foreground"
          >
            {(Object.keys(outcomeLabel) as ReferenceOutcome[]).map((key) => (
              <option key={key} value={key}>
                {outcomeLabel[key]}
              </option>
            ))}
          </LegacySelect>
          <LegacyInput
            type="text"
            value={note}
            maxLength={500}
            onChange={(event) => setNote(event.target.value)}
            placeholder="What did they say? (optional)"
            className="w-full px-2 py-1.5 rounded-lg border border-border bg-card text-sm text-foreground"
          />
          {save.isError && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400">
              {save.error instanceof Error
                ? save.error.message
                : 'We could not save that. Please try again.'}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => save.mutate()}
              isLoading={save.isPending}
            >
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(false)}
              disabled={save.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-1.5 text-xs font-medium text-primary hover:underline"
        >
          {reference.status === 'not_contacted' ? 'Record outcome' : 'Update outcome'}
        </button>
      )}
    </div>
  );
};

/** Everything a landlord needs to weigh an application, with what the applicant shared opened up. */
export const ScreeningPanel = ({
  applicationId,
  employmentStatus,
}: {
  applicationId: string;
  employmentStatus: string;
}) => {
  const { data, isPending, isError } = useQuery({
    queryKey: landlordKeys.applicationScreening(applicationId),
    queryFn: () => unwrap(landlordService.getApplicationScreening(applicationId)),
  });

  if (isPending) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <p role="alert" className="text-sm text-red-600 dark:text-red-400">
        We could not load the screening report for this applicant. Please close this and try again.
      </p>
    );
  }

  const { affordability, standing, history } = data;
  const band = bandLabel[affordability.band];

  return (
    <div className="space-y-5">
      <div>
        <SectionTitle>At a glance</SectionTitle>
        <ul className="space-y-1.5">
          {data.flags.map((flag) => {
            const style = flagStyle[flag.level];
            const Icon = style.icon;
            return (
              <li key={flag.text} className="flex items-start gap-2 text-sm text-foreground">
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${style.className}`} aria-hidden="true" />
                <span>
                  <span className="sr-only">{style.label}: </span>
                  {flag.text}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="p-3 rounded-lg border border-border">
        <div className="flex items-center justify-between gap-2 mb-2">
          <SectionTitle>Can they afford it?</SectionTitle>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${band.className}`}>
            {band.text}
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm tabular-nums">
          <div>
            <dd className="font-medium text-foreground">
              {formatCurrency(affordability.monthlyIncome)} / month
            </dd>
            <dt className="text-xs text-muted-foreground">
              Declared income (
              {affordability.incomeEvidenced ? 'evidence attached' : 'not evidenced'})
            </dt>
          </div>
          <div>
            <dd className="font-medium text-foreground">
              {affordability.annualRent
                ? `${formatCurrency(affordability.annualRent)} / year`
                : '—'}
            </dd>
            <dt className="text-xs text-muted-foreground">
              Rent
              {affordability.monthlyRent
                ? ` (${formatCurrency(affordability.monthlyRent)} a month)`
                : ''}
            </dt>
          </div>
        </dl>
        <p className="mt-2 text-xs text-muted-foreground">
          {affordability.available
            ? affordability.rentToIncomePercent != null
              ? `A year's rent is ${affordability.rentToIncomePercent}% of a year's declared income.`
              : 'No income was declared, so this can’t be worked out.'
            : affordability.reason}{' '}
          Employment: {employmentStatus}.
        </p>
      </div>

      <div className="p-3 rounded-lg border border-border">
        <SectionTitle>Earlier tenancies</SectionTitle>
        {standing.shared ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Platform trust score</p>
                <p className="font-medium text-foreground">{standing.trustScore}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Signed leases</p>
                <p className="font-medium text-foreground">{standing.signedLeaseCount}</p>
              </div>
              {history && history.onTimeRatePercent !== null && (
                <div>
                  <p className="text-xs text-muted-foreground">Paid on time</p>
                  <p className="font-medium text-foreground">
                    {history.onTimeRatePercent}%{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      of {history.paymentsCount} payments
                    </span>
                  </p>
                </div>
              )}
              {history && history.landlordReviewAverage !== null && (
                <div>
                  <p className="text-xs text-muted-foreground">Rated by earlier landlords</p>
                  <p className="font-medium text-foreground">
                    {history.landlordReviewAverage} / 5{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({history.landlordReviewCount})
                    </span>
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                [standing.identityVerified, 'Identity verified'],
                [standing.emailVerified, 'Email verified'],
                [standing.phoneVerified, 'Phone verified'],
              ].map(
                ([on, label]) =>
                  on && (
                    <span
                      key={label as string}
                      className="text-xs px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                    >
                      {label as string}
                    </span>
                  )
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            This applicant hasn&apos;t opted in to share their earlier tenancy history.
          </p>
        )}
      </div>

      {(data.references.length > 0 || data.nextOfKin) && (
        <div>
          <SectionTitle>
            <span className="inline-flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              References &amp; next of kin
            </span>
          </SectionTitle>
          <div className="space-y-1.5">
            {data.nextOfKin && (
              <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-white/5 text-sm">
                <p className="text-foreground font-medium">
                  {data.nextOfKin.name}{' '}
                  <span className="text-xs text-muted-foreground font-normal">
                    ({data.nextOfKin.relationship || 'Next of kin'})
                  </span>
                </p>
                {data.nextOfKin.phone && (
                  <p className="text-xs text-muted-foreground">{data.nextOfKin.phone}</p>
                )}
              </div>
            )}
            {data.references.map((reference) => (
              <ReferenceRow
                key={reference.id}
                reference={reference}
                applicationId={applicationId}
              />
            ))}
          </div>
        </div>
      )}

      {data.creditCheck.latest ? (
        <div className="p-3 rounded-lg border border-border">
          <SectionTitle>Verified credit check</SectionTitle>
          <CreditSummaryView check={data.creditCheck.latest} />
          <p className="mt-2 text-xs text-muted-foreground">
            Shared by the applicant on {formatDate(data.creditCheck.latest.sharedAt)} and removed on{' '}
            {formatDate(data.creditCheck.latest.expiresAt)}. They can take it back at any time.
          </p>
        </div>
      ) : (
        data.creditCheck.available && (
          <p className="text-xs text-muted-foreground">
            The applicant can share a verified credit check from their application. It appears here
            once they do.
          </p>
        )
      )}

      <div>
        <SectionTitle>Documents the applicant shared</SectionTitle>
        <div className="space-y-1.5">
          {data.documents.map((doc) => (
            <div
              key={doc.name}
              className="flex items-center justify-between gap-2 p-2 rounded-lg bg-gray-50 dark:bg-white/5"
            >
              <span className="text-sm text-foreground">
                {doc.name}
                {!doc.required && (
                  <span className="ml-1.5 text-xs text-muted-foreground">optional</span>
                )}
              </span>
              {doc.uploaded ? (
                doc.url ? (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-green-600" />
                    Open
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <FileCheck className="w-3.5 h-3.5" /> Attached
                  </span>
                )
              ) : (
                <span
                  className={`inline-flex items-center gap-1 text-xs ${doc.required ? 'text-red-500' : 'text-muted-foreground'}`}
                >
                  <FileX className="w-3.5 h-3.5" /> {doc.required ? 'Missing' : 'Not provided'}
                </span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Links expire after 15 minutes. Files are the applicant&apos;s own; nothing here has been
          checked against a credit bureau.
        </p>
      </div>
    </div>
  );
};
