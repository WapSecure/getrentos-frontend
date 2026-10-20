'use client';

import { useState } from 'react';
import Link from 'next/link';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileText, Hammer } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  CurrencyInput,
  DatePicker,
  DescriptionList,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DocumentUpload,
  Field,
  Input,
  ListSkeleton,
  QueryState,
  Select,
  Skeleton,
  Textarea,
  useToast,
  type PendingUpload,
} from '@getrentos/ui';
import {
  formatCurrency,
  formatDate,
  LAND_WATCH_JOB_KIND_LABELS,
  LAND_WATCH_JOB_STATUS_LABELS,
  unwrap,
  type LandWatchJobQuote,
  type LandWatchJobStatus,
  type StaffLandWatchJob,
} from '@getrentos/shared';
import { readLandApiError } from '@/lib/landDiligence';
import { adminLandWatchService } from '@/services/adminLandWatchService';

const jobKeys = {
  list: ['admin', 'land', 'watch', 'jobs'] as const,
  filtered: (filter: string) => ['admin', 'land', 'watch', 'jobs', filter] as const,
  one: (id: string) => ['admin', 'land', 'watch', 'job', id] as const,
};

type Filter = 'open' | LandWatchJobStatus;
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'open', label: 'Open jobs' },
  ...(Object.keys(LAND_WATCH_JOB_STATUS_LABELS) as LandWatchJobStatus[]).map((status) => ({
    value: status,
    label: LAND_WATCH_JOB_STATUS_LABELS[status].label,
  })),
];

const QUOTE_STATUS_TONE: Record<LandWatchJobQuote['status'], 'info' | 'success' | 'neutral'> = {
  OFFERED: 'info',
  ACCEPTED: 'success',
  DECLINED: 'neutral',
  WITHDRAWN: 'neutral',
};

const ageOf = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return 'today';
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

function JobStatusBadge({ status }: { status: LandWatchJobStatus }) {
  const { label, tone } = LAND_WATCH_JOB_STATUS_LABELS[status];
  return <Badge variant={tone}>{label}</Badge>;
}

/** Vendor jobs owners asked for on Managed watches: post quotes, track the work, record proof. */
export function LandWatchJobs() {
  const [filter, setFilter] = useState<Filter>('open');
  const [openId, setOpenId] = useState<string | null>(null);
  const query = useQuery({
    queryKey: jobKeys.filtered(filter),
    queryFn: () => unwrap(adminLandWatchService.jobs(filter === 'open' ? undefined : filter)),
    placeholderData: keepPreviousData,
  });
  const items = query.data ?? [];
  const opened = items.find((j) => j.id === openId);

  return (
    <>
      <div className="mb-4 w-56">
        <Select
          value={filter}
          onValueChange={(v) => setFilter(v as Filter)}
          ariaLabel="Job status"
          options={FILTERS}
        />
      </div>
      <QueryState
        isLoading={query.isLoading}
        loading={<ListSkeleton rows={4} />}
        isError={query.isError && !query.data}
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
        errorTitle="Vendor jobs could not be loaded"
        errorDescription={query.error instanceof Error ? query.error.message : undefined}
        isEmpty={items.length === 0}
        empty={{
          icon: Hammer,
          title: filter === 'open' ? 'No open vendor jobs' : 'Nothing here',
          description:
            filter === 'open'
              ? 'Jobs owners request on Managed watches show here.'
              : 'No vendor jobs match this filter.',
        }}
      >
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {items.map((j) => (
            <li key={j.id}>
              <button
                type="button"
                onClick={() => setOpenId(j.id)}
                className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {LAND_WATCH_JOB_KIND_LABELS[j.kind]} · {j.land.label}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    <span className="font-mono">{j.reference}</span> · {j.land.city}, {j.land.state}{' '}
                    · opened {ageOf(j.createdAt)}
                  </p>
                </div>
                <JobStatusBadge status={j.status} />
              </button>
            </li>
          ))}
        </ul>
      </QueryState>
      {openId && <JobDialog jobId={openId} fromList={opened} onClose={() => setOpenId(null)} />}
    </>
  );
}

type Mode = 'detail' | 'quote' | 'proof' | 'complete' | 'cancel';

function JobDialog({
  jobId,
  fromList,
  onClose,
}: {
  jobId: string;
  fromList?: StaffLandWatchJob;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>('detail');
  const query = useQuery({
    queryKey: jobKeys.one(jobId),
    queryFn: () => unwrap(adminLandWatchService.job(jobId)),
    placeholderData: fromList,
  });
  const job = query.data;

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent size="lg">
        {!job ? (
          query.isError ? (
            <>
              <DialogTitle className="text-lg font-semibold text-foreground">
                The job could not be loaded
              </DialogTitle>
              <Alert variant="danger" className="mt-4">
                {readLandApiError(query.error, 'Try again.').message}
              </Alert>
              <div className="mt-6 flex justify-end">
                <Button
                  variant="outline"
                  isLoading={query.isFetching}
                  onClick={() => void query.refetch()}
                >
                  Retry
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogTitle className="sr-only">Loading the job</DialogTitle>
              <div className="space-y-3">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-24 w-full" />
              </div>
            </>
          )
        ) : mode === 'detail' ? (
          <JobDetail job={job} onMode={setMode} />
        ) : (
          <JobForm job={job} mode={mode} onBack={() => setMode('detail')} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function useJobRefresh(jobId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: jobKeys.list }),
      queryClient.invalidateQueries({ queryKey: jobKeys.one(jobId) }),
    ]);
}

function JobDetail({ job, onMode }: { job: StaffLandWatchJob; onMode: (mode: Mode) => void }) {
  const toast = useToast();
  const refresh = useJobRefresh(job.id);
  const failed = (e: unknown, fallback: string) =>
    toast.error(readLandApiError(e, fallback).message);
  const start = useMutation({
    mutationFn: () => unwrap(adminLandWatchService.startJob(job.id)),
    onSuccess: async () => {
      await refresh();
      toast.success('Marked as started.');
    },
    onError: (e) => failed(e, 'Could not mark the job started.'),
  });
  const withdraw = useMutation({
    mutationFn: (quoteId: string) => unwrap(adminLandWatchService.withdrawQuote(job.id, quoteId)),
    onSuccess: async () => {
      await refresh();
      toast.success('Quote withdrawn.');
    },
    onError: (e) => failed(e, 'Could not withdraw the quote.'),
  });

  const s = job.status;
  const canQuote = s === 'REQUESTED' || s === 'QUOTED';
  const canProof = s === 'IN_PROGRESS' || s === 'COMPLETED';
  const canCancel = s === 'REQUESTED' || s === 'QUOTED' || s === 'APPROVED' || s === 'IN_PROGRESS';
  const noProof = job.proof.length === 0;

  const timeline = [
    { label: 'Requested', value: formatDate(job.createdAt) },
    { label: 'Quote accepted', value: job.acceptedAt ? formatDate(job.acceptedAt) : null },
    { label: 'Started', value: job.startedAt ? formatDate(job.startedAt) : null },
    { label: 'Completed', value: job.completedAt ? formatDate(job.completedAt) : null },
    ...(job.cancelledAt ? [{ label: 'Cancelled', value: formatDate(job.cancelledAt) }] : []),
  ];

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2 pr-8">
        <div className="min-w-0">
          <DialogTitle className="text-lg font-semibold text-foreground">
            {LAND_WATCH_JOB_KIND_LABELS[job.kind]} · {job.land.label}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            <span className="font-mono">{job.reference}</span> · {job.land.city}, {job.land.state}
          </DialogDescription>
        </div>
        <JobStatusBadge status={job.status} />
      </div>

      <p className="mt-4 whitespace-pre-wrap text-sm text-foreground">{job.description}</p>
      {job.cancelReason && (
        <Alert variant="neutral" className="mt-3">
          Cancelled: {job.cancelReason}
        </Alert>
      )}
      {job.completionNote && (
        <Alert variant="success" className="mt-3">
          {job.completionNote}
        </Alert>
      )}
      {job.checkInspectionId && (
        <Link
          href={`/admin/land/watch/inspections/${encodeURIComponent(job.checkInspectionId)}`}
          className="mt-2 inline-block text-sm text-primary hover:underline"
        >
          The independent check of this work
        </Link>
      )}

      <DescriptionList className="mt-4" columns={2} items={timeline} emptyValue="—" />

      <section className="mt-5">
        <h3 className="text-sm font-semibold text-foreground">Quotes</h3>
        {job.quotes.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">No quotes posted yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {job.quotes.map((q) => (
              <li key={q.id} className="rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {q.vendorName} · {formatCurrency(q.amountNaira)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {q.vendorPhone ?? 'No phone'} · posted {formatDate(q.createdAt)}
                      {q.validUntil && ` · valid until ${formatDate(q.validUntil)}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={QUOTE_STATUS_TONE[q.status]}>
                      {q.status.charAt(0) + q.status.slice(1).toLowerCase()}
                    </Badge>
                    {s === 'QUOTED' && q.status === 'OFFERED' && (
                      <Button
                        size="xs"
                        variant="ghost"
                        disabled={withdraw.isPending}
                        isLoading={withdraw.isPending && withdraw.variables === q.id}
                        onClick={() => withdraw.mutate(q.id)}
                      >
                        Withdraw
                      </Button>
                    )}
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{q.scope}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-5">
        <h3 className="text-sm font-semibold text-foreground">Proof of work</h3>
        {noProof ? (
          <p className="mt-1 text-sm text-muted-foreground">No proof uploaded yet.</p>
        ) : (
          <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {job.proof.map((p) => (
              <li key={p.id} className="min-w-0">
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-xl border border-border hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {p.mimeType.startsWith('image/') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.url} alt={p.fileName} className="h-24 w-full object-cover" />
                  ) : (
                    <span className="flex h-24 items-center justify-center bg-secondary">
                      <FileText className="h-8 w-8 text-muted-foreground" aria-hidden />
                    </span>
                  )}
                  <span className="block truncate px-2 py-1 text-xs text-foreground">
                    {p.fileName}
                  </span>
                </a>
                {p.note && <p className="mt-1 text-xs text-muted-foreground">{p.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {s === 'IN_PROGRESS' && noProof && (
        <p className="mt-4 text-sm text-muted-foreground">
          Upload at least one proof file before recording the job as complete.
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        {canCancel && (
          <Button variant="ghost" onClick={() => onMode('cancel')}>
            Cancel job
          </Button>
        )}
        {canQuote && (
          <Button variant="outline" onClick={() => onMode('quote')}>
            Add a quote
          </Button>
        )}
        {canProof && (
          <Button variant="outline" onClick={() => onMode('proof')}>
            Upload proof
          </Button>
        )}
        {s === 'APPROVED' && (
          <Button isLoading={start.isPending} onClick={() => start.mutate()}>
            Mark started
          </Button>
        )}
        {s === 'IN_PROGRESS' && (
          <Button disabled={noProof} onClick={() => onMode('complete')}>
            Complete
          </Button>
        )}
      </div>
    </>
  );
}

const FORM_TITLES: Record<Exclude<Mode, 'detail'>, { title: string; description: string }> = {
  quote: {
    title: 'Add a quote',
    description: 'The owner sees the vendor, amount and scope; the phone only once they accept.',
  },
  proof: {
    title: 'Upload proof',
    description: 'Photos or a PDF of the work (up to 20 MB). The owner sees these.',
  },
  complete: {
    title: 'Record the job as complete',
    description: 'The owner is told the work is done and can book an independent check.',
  },
  cancel: {
    title: 'Cancel this job',
    description: 'The owner is told why. This cannot be undone.',
  },
};

function JobForm({
  job,
  mode,
  onBack,
}: {
  job: StaffLandWatchJob;
  mode: Exclude<Mode, 'detail'>;
  onBack: () => void;
}) {
  const toast = useToast();
  const refresh = useJobRefresh(job.id);
  const [vendorName, setVendorName] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [scope, setScope] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [files, setFiles] = useState<PendingUpload[]>([]);
  const [text, setText] = useState('');

  const submit = useMutation({
    mutationFn: () => {
      switch (mode) {
        case 'quote':
          return unwrap(
            adminLandWatchService.addQuote(job.id, {
              vendorName: vendorName.trim(),
              ...(vendorPhone.trim() ? { vendorPhone: vendorPhone.trim() } : {}),
              amountNaira: Number(amount),
              scope: scope.trim(),
              ...(validUntil ? { validUntil: new Date(validUntil).toISOString() } : {}),
            })
          );
        case 'proof':
          return unwrap(adminLandWatchService.addJobProof(job.id, files[0].file, text));
        case 'complete':
          return unwrap(adminLandWatchService.completeJob(job.id, text.trim()));
        case 'cancel':
          return unwrap(adminLandWatchService.cancelJob(job.id, text.trim()));
      }
    },
    onSuccess: async () => {
      await refresh();
      toast.success(
        mode === 'quote'
          ? 'Quote posted; the owner was told.'
          : mode === 'proof'
            ? 'Proof uploaded.'
            : mode === 'complete'
              ? 'Job recorded as complete.'
              : 'Job cancelled.'
      );
      onBack();
    },
    onError: (e) => toast.error(readLandApiError(e, 'Could not save that.').message),
  });

  const textOk =
    mode === 'complete'
      ? text.trim().length >= 10
      : mode === 'cancel'
        ? text.trim().length >= 5
        : true;
  const valid =
    mode === 'quote'
      ? vendorName.trim().length >= 2 && Number(amount) >= 1 && scope.trim().length >= 10
      : mode === 'proof'
        ? files.length > 0
        : textOk;
  const { title, description } = FORM_TITLES[mode];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) submit.mutate();
      }}
    >
      <DialogTitle className="text-lg font-semibold text-foreground">{title}</DialogTitle>
      <DialogDescription className="mt-1 text-sm text-muted-foreground">
        {job.reference} · {description}
      </DialogDescription>

      <div className="mt-5 space-y-4">
        {mode === 'quote' && (
          <>
            <Field label="Vendor name" required>
              <Input
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                maxLength={120}
              />
            </Field>
            <Field label="Vendor phone" hint="Shown to the owner once they accept this quote.">
              <Input
                type="tel"
                value={vendorPhone}
                onChange={(e) => setVendorPhone(e.target.value)}
                maxLength={30}
              />
            </Field>
            <Field label="Amount" required hint="The owner pays the vendor directly.">
              <CurrencyInput prefix="₦" value={amount} onValueChange={setAmount} />
            </Field>
            <Field label="Scope of work" required>
              <Textarea
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                rows={4}
                minLength={10}
                maxLength={2000}
                showCount
              />
            </Field>
            <Field label="Valid until">
              <DatePicker value={validUntil} onChange={setValidUntil} clearable />
            </Field>
          </>
        )}
        {mode === 'proof' && (
          <>
            <DocumentUpload
              value={files}
              onChange={setFiles}
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              multiple={false}
              maxSizeMB={20}
              label="Proof file"
              hint="Images or PDF, up to 20 MB."
            />
            <Field label="Note">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                maxLength={1000}
                showCount
              />
            </Field>
          </>
        )}
        {(mode === 'complete' || mode === 'cancel') && (
          <Field label={mode === 'complete' ? 'What was done' : 'Reason'} required>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              maxLength={mode === 'complete' ? 2000 : 1000}
              showCount
            />
          </Field>
        )}
      </div>

      <div className="mt-6 flex flex-wrap justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          icon={<ArrowLeft className="h-4 w-4" />}
          disabled={submit.isPending}
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          type="submit"
          variant={mode === 'cancel' ? 'danger' : 'primary'}
          disabled={!valid}
          isLoading={submit.isPending}
        >
          {mode === 'quote'
            ? 'Post quote'
            : mode === 'proof'
              ? 'Upload'
              : mode === 'complete'
                ? 'Record complete'
                : 'Cancel job'}
        </Button>
      </div>
    </form>
  );
}
