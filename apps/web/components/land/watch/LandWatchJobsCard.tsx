'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Hammer, Phone, Plus, ShieldCheck } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  ListSkeleton,
  Select,
  Textarea,
  type BadgeVariant,
  type ToastVariant,
} from '@getrentos/ui';
import {
  LAND_WATCH_JOB_KIND_LABELS,
  LAND_WATCH_JOB_PAYMENT_NOTE,
  LAND_WATCH_JOB_STATUS_LABELS,
  type LandWatchDetail,
  type LandWatchJob,
  type LandWatchJobKind,
  type LandWatchJobQuote,
  type LandWatchJobQuoteStatus,
} from '@getrentos/shared';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency, formatDate } from '@/lib/format';
import { landKeys } from '@/lib/queryKeys';
import { landWatchService } from '@/services/landWatchService';
import { errorMessage } from '../developer/feedback';

type Notify = (message: string, variant?: ToastVariant) => void;

const JOB_KINDS: LandWatchJobKind[] = [
  'FENCING',
  'CLEARING',
  'SECURITY',
  'BEACON_REPLACEMENT',
  'SURVEY',
  'OTHER',
];
const CANCELLABLE = new Set<LandWatchJob['status']>(['REQUESTED', 'QUOTED', 'APPROVED']);
const QUOTE_STATUS: Record<LandWatchJobQuoteStatus, { label: string; tone: BadgeVariant }> = {
  OFFERED: { label: 'Offered', tone: 'info' },
  ACCEPTED: { label: 'Accepted', tone: 'success' },
  DECLINED: { label: 'Declined', tone: 'neutral' },
  WITHDRAWN: { label: 'Withdrawn', tone: 'neutral' },
};
const isExpired = (q: LandWatchJobQuote) =>
  q.validUntil != null && new Date(q.validUntil).getTime() < Date.now();

/**
 * Vendor work on a Managed watch: the owner asks for a job, GetRentos posts
 * vendors' quotes, the owner accepts one and pays the vendor directly, and
 * the finished work comes back with proof.
 */
export const LandWatchJobsCard = ({
  watch,
  notify,
}: {
  watch: LandWatchDetail;
  notify: Notify;
}) => {
  const queryClient = useQueryClient();
  const key = landKeys.watchJobs(watch.id);
  const jobs = useQuery({
    queryKey: key,
    queryFn: () => unwrap(landWatchService.jobs(watch.id)),
  });
  const [asking, setAsking] = useState(false);
  const managed = watch.tier === 'MANAGED';
  const canAsk = managed && watch.status === 'ACTIVE';

  const saved = (job: LandWatchJob, message: string) => {
    queryClient.setQueryData<LandWatchJob[]>(key, (prev) =>
      prev?.some((j) => j.id === job.id)
        ? prev.map((j) => (j.id === job.id ? job : j))
        : [job, ...(prev ?? [])]
    );
    // The watch key is a prefix of the jobs key, so this refreshes both.
    void queryClient.invalidateQueries({ queryKey: landKeys.watch(watch.id) });
    notify(message);
  };
  const failed = (error: unknown, fallback: string) =>
    notify(errorMessage(error, fallback), 'error');

  const items = jobs.data ?? [];
  return (
    <Card static className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold text-foreground">
          <Hammer className="h-5 w-5 text-primary" aria-hidden="true" /> Vendor work
        </h2>
        {canAsk && (
          <Button
            size="sm"
            variant="outline"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setAsking(true)}
          >
            Ask for work
          </Button>
        )}
      </div>
      {!managed && (
        <p className="mt-3 text-sm text-muted-foreground">
          Vendor coordination (fencing, clearing, security, beacons) comes with Managed. Change the
          level above to use it.
        </p>
      )}
      {jobs.isLoading ? (
        <ListSkeleton rows={2} bare label="Loading vendor work" className="mt-4" />
      ) : jobs.isError && !jobs.data ? (
        <Alert
          variant="danger"
          className="mt-4"
          title="Vendor work could not be loaded"
          action={
            <Button
              size="sm"
              variant="outline"
              isLoading={jobs.isFetching}
              onClick={() => void jobs.refetch()}
            >
              Try again
            </Button>
          }
        >
          {errorMessage(jobs.error, 'Please try again.')}
        </Alert>
      ) : items.length === 0 ? (
        managed && (
          <p className="mt-3 text-sm text-muted-foreground">
            No work asked for yet. Ask for fencing, clearing, security or other work and GetRentos
            will bring you vendors&apos; quotes.
          </p>
        )
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {items.map((job) => (
            <JobItem key={job.id} watchId={watch.id} job={job} onSaved={saved} onFailed={failed} />
          ))}
        </ul>
      )}
      <RequestJobDialog
        open={asking}
        watchId={watch.id}
        onClose={() => setAsking(false)}
        onSaved={saved}
        onFailed={failed}
      />
    </Card>
  );
};

interface JobActions {
  onSaved: (job: LandWatchJob, message: string) => void;
  onFailed: (error: unknown, fallback: string) => void;
}

const RequestJobDialog = ({
  open,
  watchId,
  onClose,
  onSaved,
  onFailed,
}: JobActions & { open: boolean; watchId: string; onClose: () => void }) => {
  const [kind, setKind] = useState<LandWatchJobKind | ''>('');
  const [description, setDescription] = useState('');
  const request = useMutation({
    mutationFn: () =>
      unwrap(
        landWatchService.requestJob(watchId, {
          kind: kind as LandWatchJobKind,
          description: description.trim(),
        })
      ),
    onSuccess: (job) => {
      setKind('');
      setDescription('');
      onClose();
      onSaved(job, 'Asked. GetRentos will find vendors and post their quotes here.');
    },
    onError: (e) => onFailed(e, 'Could not ask for the work.'),
  });
  const tooShort = description.trim().length < 10;
  return (
    <Dialog open={open} onOpenChange={(next) => !next && !request.isPending && onClose()}>
      <DialogContent size="md">
        <DialogTitle className="text-lg font-semibold text-foreground">Ask for work</DialogTitle>
        <DialogDescription className="mt-1 text-sm text-muted-foreground">
          GetRentos finds vendors and posts their quotes. You choose one and pay the vendor
          directly.
        </DialogDescription>
        <div className="mt-4 space-y-4">
          <Field label="Kind of work" required>
            <Select
              value={kind}
              onValueChange={(v) => setKind(v as LandWatchJobKind)}
              ariaLabel="Kind of work"
              placeholder="Choose"
              options={JOB_KINDS.map((k) => ({ value: k, label: LAND_WATCH_JOB_KIND_LABELS[k] }))}
            />
          </Field>
          <Field
            label="What needs doing"
            required
            hint="At least 10 characters: where on the land, how much, and anything the vendor should know."
          >
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
              showCount
              placeholder="e.g. Block fence along the north boundary, about 60 metres, with a gate"
            />
          </Field>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={request.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => request.mutate()}
            isLoading={request.isPending}
            disabled={!kind || tooShort || request.isPending}
          >
            Ask for quotes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const JobItem = ({
  watchId,
  job,
  onSaved,
  onFailed,
}: JobActions & { watchId: string; job: LandWatchJob }) => {
  const status = LAND_WATCH_JOB_STATUS_LABELS[job.status];
  const [accepting, setAccepting] = useState<LandWatchJobQuote | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const accept = useMutation({
    mutationFn: (quoteId: string) => unwrap(landWatchService.acceptQuote(watchId, job.id, quoteId)),
    onSuccess: (j) => {
      setAccepting(null);
      onSaved(j, 'Quote accepted. The vendor’s number is now on the job.');
    },
    onError: (e) => onFailed(e, 'Could not accept the quote.'),
  });
  const decline = useMutation({
    mutationFn: (quoteId: string) =>
      unwrap(landWatchService.declineQuote(watchId, job.id, quoteId)),
    onSuccess: (j) => onSaved(j, 'Quote declined.'),
    onError: (e) => onFailed(e, 'Could not decline the quote.'),
  });
  const check = useMutation({
    mutationFn: () => unwrap(landWatchService.requestJobCheck(watchId, job.id)),
    onSuccess: (j) => onSaved(j, 'Independent check booked. An inspector will look at the work.'),
    onError: (e) => onFailed(e, 'Could not book the check.'),
  });

  const accepted = job.quotes.find((q) => q.status === 'ACCEPTED');
  const busy = accept.isPending || decline.isPending;
  const dates = [
    `Asked ${formatDate(job.createdAt)}`,
    job.acceptedAt && `vendor chosen ${formatDate(job.acceptedAt)}`,
    job.startedAt && `started ${formatDate(job.startedAt)}`,
    job.completedAt && `done ${formatDate(job.completedAt)}`,
    job.cancelledAt && `cancelled ${formatDate(job.cancelledAt)}`,
  ].filter(Boolean);

  return (
    <li className="space-y-3 py-4 text-sm first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-foreground">{LAND_WATCH_JOB_KIND_LABELS[job.kind]}</p>
          <p className="text-xs text-muted-foreground">
            {job.reference} · {dates.join(' · ')}
          </p>
        </div>
        <Badge variant={status.tone}>{status.label}</Badge>
      </div>
      <p className="break-words text-muted-foreground">{job.description}</p>
      {job.status === 'CANCELLED' && job.cancelReason && (
        <p className="text-foreground">Reason: {job.cancelReason}</p>
      )}

      {job.quotes.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Quotes
          </h3>
          <ul className="space-y-2">
            {job.quotes.map((q) => {
              const tone = QUOTE_STATUS[q.status];
              const expired = isExpired(q);
              const open = job.status === 'QUOTED' && q.status === 'OFFERED';
              return (
                <li key={q.id} className="rounded-xl border border-border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{q.vendorName}</p>
                      <p className="text-base font-semibold text-foreground">
                        {formatCurrency(q.amountNaira)}
                      </p>
                    </div>
                    <Badge variant={expired && q.status === 'OFFERED' ? 'neutral' : tone.tone}>
                      {expired && q.status === 'OFFERED' ? 'Expired' : tone.label}
                    </Badge>
                  </div>
                  <p className="mt-1 whitespace-pre-line break-words text-muted-foreground">
                    {q.scope}
                  </p>
                  {q.validUntil && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Valid until {formatDate(q.validUntil)}
                    </p>
                  )}
                  {open && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" disabled={expired || busy} onClick={() => setAccepting(q)}>
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        isLoading={decline.isPending && decline.variables === q.id}
                        onClick={() => decline.mutate(q.id)}
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {accepted && job.status !== 'CANCELLED' && (
        <Alert variant="info" title={`Your vendor: ${accepted.vendorName}`}>
          {accepted.vendorPhone && (
            <a
              href={`tel:${accepted.vendorPhone}`}
              className="mb-1 inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              {accepted.vendorPhone}
            </a>
          )}
          <p>{LAND_WATCH_JOB_PAYMENT_NOTE}</p>
        </Alert>
      )}

      {(job.proof.length > 0 || job.completionNote) && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Proof of work
          </h3>
          {job.proof.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {job.proof.map((p) => (
                <li key={p.id} className="w-24">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    title={p.note ?? p.fileName}
                  >
                    {p.mimeType.startsWith('image/') ? (
                      // eslint-disable-next-line @next/next/no-img-element -- short-lived signed link
                      <img
                        src={p.url}
                        alt={p.note ?? p.fileName}
                        loading="lazy"
                        className="h-24 w-24 rounded-lg border border-border object-cover"
                      />
                    ) : (
                      <span className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-border bg-secondary p-2 text-center text-xs text-muted-foreground">
                        <FileText className="h-6 w-6" aria-hidden="true" />
                        <span className="line-clamp-2 break-all">{p.fileName}</span>
                      </span>
                    )}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          {job.completionNote && (
            <p className="whitespace-pre-line break-words text-foreground">{job.completionNote}</p>
          )}
        </div>
      )}

      {job.status === 'COMPLETED' &&
        (job.checkInspectionId ? (
          <p className="flex items-center gap-1.5 text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            Independent check booked. Its report will appear under Inspections.
          </p>
        ) : (
          <Button
            size="sm"
            variant="outline"
            icon={<ShieldCheck className="h-4 w-4" />}
            isLoading={check.isPending}
            onClick={() => check.mutate()}
          >
            Ask for an independent check
          </Button>
        ))}

      {CANCELLABLE.has(job.status) && (
        <Button size="sm" variant="ghost" onClick={() => setCancelling(true)}>
          Cancel this job…
        </Button>
      )}

      <ConfirmDialog
        open={accepting != null}
        onOpenChange={(next) => !next && !accept.isPending && setAccepting(null)}
        title="Accept this quote?"
        tone="primary"
        description={
          accepting
            ? `${accepting.vendorName} will do the work for ${formatCurrency(accepting.amountNaira)}. ${LAND_WATCH_JOB_PAYMENT_NOTE}`
            : ''
        }
        confirmLabel="Accept quote"
        isLoading={accept.isPending}
        onConfirm={() => (accepting ? accept.mutateAsync(accepting.id) : undefined)}
      />
      <CancelJobDialog
        open={cancelling}
        watchId={watchId}
        job={job}
        onClose={() => setCancelling(false)}
        onSaved={onSaved}
        onFailed={onFailed}
      />
    </li>
  );
};

const CancelJobDialog = ({
  open,
  watchId,
  job,
  onClose,
  onSaved,
  onFailed,
}: JobActions & { open: boolean; watchId: string; job: LandWatchJob; onClose: () => void }) => {
  const [reason, setReason] = useState('');
  const cancel = useMutation({
    mutationFn: () => unwrap(landWatchService.cancelJob(watchId, job.id, reason.trim())),
    onSuccess: (j) => {
      setReason('');
      onClose();
      onSaved(j, 'Job cancelled.');
    },
    onError: (e) => onFailed(e, 'Could not cancel the job.'),
  });
  return (
    <Dialog open={open} onOpenChange={(next) => !next && !cancel.isPending && onClose()}>
      <DialogContent size="sm">
        <DialogTitle className="text-lg font-semibold text-foreground">
          Cancel {LAND_WATCH_JOB_KIND_LABELS[job.kind].toLowerCase()}?
        </DialogTitle>
        <DialogDescription className="mt-1 text-sm text-muted-foreground">
          {job.status === 'APPROVED'
            ? 'You have chosen a vendor. Tell them yourself too; anything already paid is between you and the vendor.'
            : 'GetRentos stops looking for vendors and any open quotes are closed.'}
        </DialogDescription>
        <div className="mt-4">
          <Field label="Why" required hint="At least 5 characters.">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={1000}
              showCount
            />
          </Field>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={cancel.isPending}>
            Keep it
          </Button>
          <Button
            variant="danger"
            onClick={() => cancel.mutate()}
            isLoading={cancel.isPending}
            disabled={reason.trim().length < 5 || cancel.isPending}
          >
            Cancel job
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
