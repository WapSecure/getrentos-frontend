'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Camera,
  CircleAlert,
  ClipboardList,
  MapPin,
  Navigation,
  Send,
} from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  DocumentUpload,
  EmptyState,
  Field,
  NumberInput,
  type PendingUpload,
  RadioGroup,
  Skeleton,
  Textarea,
  type ToastVariant,
  useToast,
} from '@getrentos/ui';
import {
  LAND_BOUNDARY_LABELS,
  LAND_INSPECTION_KIND_LABELS,
  landPoint,
  type InspectorJob,
  type LandBoundaryCondition,
  describeDistance,
} from '@getrentos/shared';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { landKeys } from '@/lib/queryKeys';
import { currentPosition, landWatchService } from '@/services/landWatchService';
import { errorMessage } from '../developer/feedback';

const OPEN = new Set(['ASSIGNED', 'QUERIED']);
const CONDITIONS: LandBoundaryCondition[] = ['INTACT', 'DISTURBED', 'ENCROACHED', 'INCONCLUSIVE'];
const STATUS_WORDS: Record<string, string> = {
  ASSIGNED: 'To do',
  QUERIED: 'Questions to answer',
  SUBMITTED: 'Filed',
  ESCALATED: 'Filed · being checked',
  ACCEPTED: 'Accepted',
  CANCELLED: 'Called off',
  REQUESTED: 'Not yet assigned',
};

/**
 * The inspector's desk on the web. Field work is meant for the phone (camera,
 * GPS, offline capture); this covers filing from a laptop with the browser's
 * location, and seeing what is assigned.
 */
export const InspectorDesk = () => {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get('id');
  const toast = useToast();
  const notify = (message: string, variant: ToastVariant = 'success') =>
    toast.show(message, variant);
  return (
    <div className="space-y-6">
      {id ? (
        <JobDetail id={id} onBack={() => router.push('/land/inspections')} notify={notify} />
      ) : (
        <JobList onOpen={(j) => router.push(`/land/inspections?id=${encodeURIComponent(j)}`)} />
      )}
    </div>
  );
};

const JobList = ({ onOpen }: { onOpen: (id: string) => void }) => {
  const jobs = useQuery({
    queryKey: landKeys.inspectorJobs,
    queryFn: () => unwrap(landWatchService.myJobs()),
  });
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Land inspections</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Visits GetRentos has assigned to you. Capture photos on the land with your location on;
          anything taken away from the land is checked before the owner sees the report.
        </p>
      </div>
      {jobs.isLoading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : jobs.isError && !jobs.data ? (
        <EmptyState
          icon={CircleAlert}
          title="Your inspections could not be loaded"
          description={jobs.error instanceof Error ? jobs.error.message : undefined}
        />
      ) : !jobs.data?.length ? (
        <EmptyState
          icon={ClipboardList}
          title="Nothing assigned"
          description="New inspections appear here."
        />
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {[...jobs.data]
            .sort((a, b) => Number(OPEN.has(b.status)) - Number(OPEN.has(a.status)))
            .map((j) => (
              <li key={j.id}>
                <button
                  type="button"
                  onClick={() => onOpen(j.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left hover:bg-secondary/40"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{j.land.label}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      <span className="font-mono">{j.reference}</span> ·{' '}
                      {LAND_INSPECTION_KIND_LABELS[j.kind]} · {j.land.city}
                      {j.dueBy && ` · due ${formatDate(j.dueBy)}`}
                    </p>
                  </div>
                  <Badge
                    variant={
                      OPEN.has(j.status) ? (j.status === 'QUERIED' ? 'warning' : 'info') : 'neutral'
                    }
                  >
                    {STATUS_WORDS[j.status] ?? j.status}
                  </Badge>
                </button>
              </li>
            ))}
        </ul>
      )}
    </>
  );
};

const JobDetail = ({
  id,
  onBack,
  notify,
}: {
  id: string;
  onBack: () => void;
  notify: (m: string, v?: ToastVariant) => void;
}) => {
  const queryClient = useQueryClient();
  const key = landKeys.inspectorJob(id);
  const job = useQuery({ queryKey: key, queryFn: () => unwrap(landWatchService.job(id)) });
  const refresh = (updated?: InspectorJob) => {
    if (updated) queryClient.setQueryData(key, updated);
    else void queryClient.invalidateQueries({ queryKey: key });
    void queryClient.invalidateQueries({ queryKey: landKeys.inspectorJobs });
  };

  if (job.isLoading) return <Skeleton className="h-96 rounded-2xl" />;
  if (!job.data) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="This inspection could not be loaded"
        description={job.error instanceof Error ? job.error.message : undefined}
      />
    );
  }
  const j = job.data;
  const point = landPoint(j.land.location);
  const open = OPEN.has(j.status);
  return (
    <>
      <div>
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={onBack}
          className="-ml-2"
        >
          Land inspections
        </Button>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{j.land.label}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {j.land.address}, {j.land.city}, {j.land.state}
            </p>
          </div>
          <Badge variant={open ? 'info' : 'neutral'}>{STATUS_WORDS[j.status] ?? j.status}</Badge>
        </div>
      </div>
      {j.staffNote && <Alert variant="warning">GetRentos asks: {j.staffNote}</Alert>}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card static className="space-y-3 p-5">
          <h2 className="font-semibold text-foreground">The visit</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Kind</dt>
              <dd className="text-foreground">{LAND_INSPECTION_KIND_LABELS[j.kind]}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Due</dt>
              <dd className="text-foreground">
                {j.dueBy ? formatDate(j.dueBy) : 'As soon as you can'}
              </dd>
            </div>
          </dl>
          {j.instructions && <p className="text-sm text-foreground">“{j.instructions}”</p>}
          {point && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Navigation className="h-4 w-4" aria-hidden="true" /> Directions to the land
            </a>
          )}
          <Captures job={j} open={open} onAdded={() => refresh()} notify={notify} />
        </Card>
        <ReportForm job={j} open={open} onFiled={refresh} notify={notify} />
      </div>
    </>
  );
};

const Captures = ({
  job,
  open,
  onAdded,
  notify,
}: {
  job: InspectorJob;
  open: boolean;
  onAdded: () => void;
  notify: (m: string, v?: ToastVariant) => void;
}) => {
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const upload = async (files: File[]) => {
    if (!files.length) return;
    setBusy(true);
    const position = await currentPosition();
    let added = 0;
    for (const file of files) {
      try {
        // A photo picked from the library keeps its own time when it has one.
        const taken =
          file.lastModified && Date.now() - file.lastModified < 7 * 86_400_000
            ? file.lastModified
            : Date.now();
        const result = await unwrap(
          landWatchService.addEvidence(job.id, file, {
            capturedAt: new Date(taken).toISOString(),
            lat: position?.lat,
            lng: position?.lng,
          })
        );
        if (!result.duplicate) added += 1;
      } catch (error) {
        notify(errorMessage(error, `Could not upload ${file.name}.`), 'error');
      }
    }
    setBusy(false);
    onAdded();
    if (added)
      notify(
        position
          ? `${added} added with your location.`
          : `${added} added without a location: turn location on.`,
        position ? 'success' : 'error'
      );
  };
  return (
    <div className="border-t border-border pt-3">
      <p className="text-sm font-medium text-foreground">
        Photos and files ({job.evidence?.length ?? job.evidenceCount})
      </p>
      {job.evidence && job.evidence.length > 0 && (
        <ul className="mt-2 grid grid-cols-3 gap-2">
          {job.evidence.map((e) => (
            <li key={e.id}>
              <a href={e.url} target="_blank" rel="noopener noreferrer">
                {e.mimeType.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={e.url}
                    alt={e.fileName}
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex aspect-square items-center justify-center rounded-lg bg-secondary p-2 text-xs">
                    {e.fileName}
                  </span>
                )}
              </a>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {describeDistance(e.distanceM)}
              </p>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <div className="mt-3 space-y-2">
          <DocumentUpload
            value={pending}
            onChange={setPending}
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            multiple
            maxSizeMB={20}
            label="Photos and files from the land"
            hint="Your location is recorded with each one. Take them on the land."
            disabled={busy}
          />
          {pending.length > 0 && (
            <Button
              size="sm"
              icon={<Camera className="h-4 w-4" />}
              isLoading={busy}
              onClick={() => {
                const files = pending.map((p) => p.file);
                setPending([]);
                void upload(files);
              }}
            >
              Add {pending.length} to the inspection
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

const ReportForm = ({
  job,
  open,
  onFiled,
  notify,
}: {
  job: InspectorJob;
  open: boolean;
  onFiled: (job: InspectorJob) => void;
  notify: (m: string, v?: ToastVariant) => void;
}) => {
  const [condition, setCondition] = useState<LandBoundaryCondition | ''>(
    job.report?.boundaryCondition ?? ''
  );
  const [expected, setExpected] = useState(job.report?.beaconsExpected?.toString() ?? '');
  const [found, setFound] = useState(job.report?.beaconsFound?.toString() ?? '');
  const [summary, setSummary] = useState(job.report?.summary ?? '');
  const submit = useMutation({
    mutationFn: async () => {
      const position = await currentPosition();
      return unwrap(
        landWatchService.submit(job.id, {
          boundaryCondition: condition as LandBoundaryCondition,
          beaconsExpected: expected ? Number(expected) : undefined,
          beaconsFound: found ? Number(found) : undefined,
          summary: summary.trim(),
          lat: position?.lat,
          lng: position?.lng,
        })
      );
    },
    onSuccess: (updated) => {
      onFiled(updated);
      notify('Report filed. GetRentos reviews it before the owner sees it.');
    },
    onError: (e) => notify(errorMessage(e, 'Could not file the report.'), 'error'),
  });
  if (!open && job.report) {
    return (
      <Card static className="space-y-2 p-5">
        <h2 className="font-semibold text-foreground">Your report</h2>
        <p className="text-sm text-foreground">
          {job.report.boundaryCondition ? LAND_BOUNDARY_LABELS[job.report.boundaryCondition] : '—'}{' '}
          · filed {formatDate(job.report.submittedAt)}
        </p>
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{job.report.summary}</p>
      </Card>
    );
  }
  if (!open) return null;
  return (
    <Card static className="space-y-4 p-5">
      <h2 className="font-semibold text-foreground">Report</h2>
      <Field label="The boundary" required>
        <RadioGroup
          value={condition}
          onValueChange={setCondition}
          variant="card"
          columns={2}
          options={CONDITIONS.map((c) => ({ value: c, label: LAND_BOUNDARY_LABELS[c] }))}
        />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Beacons on the survey">
          <NumberInput integer value={expected} onValueChange={setExpected} />
        </Field>
        <Field label="Beacons found">
          <NumberInput integer value={found} onValueChange={setFound} />
        </Field>
      </div>
      <Field
        label="What you found"
        required
        hint="What you saw at each boundary, anyone on the land, any building, fencing or dumping."
      >
        <Textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={6}
          maxLength={8000}
          showCount
        />
      </Field>
      <Button
        icon={<Send className="h-4 w-4" />}
        onClick={() => submit.mutate()}
        isLoading={submit.isPending}
        disabled={!condition || summary.trim().length < 20 || submit.isPending}
      >
        File the report
      </Button>
      <p className="text-xs text-muted-foreground">
        Your location is recorded when you file. File from the land.
      </p>
    </Card>
  );
};
