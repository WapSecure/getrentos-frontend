'use client';

import { formatLocation } from '@sureground/shared';
import { useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Clock,
  ExternalLink,
  FileText,
  Plus,
  Send,
  Trash2,
  Upload,
  XCircle,
} from '@sureground/icons';
import {
  DEVELOPMENT_STAGES,
  DEVELOPMENT_STAGE_LABEL,
  type DevelopmentStage,
} from '@sureground/shared/showroom';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardSkeleton,
  CurrencyInput,
  DatePicker,
  Field,
  IconButton,
  Input,
  NumberInput,
  PageErrorState,
  PageHeader,
  Select,
  Textarea,
  useToast,
} from '@sureground/ui';
import { NIGERIA_STATES } from '@/lib/constants/locations';
import { formatDate } from '@/lib/format';
import { DevelopmentPaymentNotice } from '@/components/showroom/DevelopmentAssurance';
import {
  DEVELOPMENT_STATUS_LABEL,
  DOCUMENT_KIND_LABEL,
  developmentsService,
  type DeveloperDevelopment,
  type DevelopmentDocumentKind,
  type DevelopmentFields,
  type DevelopmentPhotoKind,
  type DevelopmentTitleType,
  type InstalmentInput,
  type UnitTypeInput,
} from '@/services/developmentsService';
import { DevelopmentEnquiriesInbox } from './DevelopmentEnquiriesInbox';
import { DEVELOPMENTS_KEY, STATUS_VARIANT } from './DevelopmentsListView';

const STATE_OPTIONS = NIGERIA_STATES.map((s) => ({ value: s, label: s }));
const STAGE_OPTIONS = DEVELOPMENT_STAGES.map((s) => ({
  value: s,
  label: DEVELOPMENT_STAGE_LABEL[s],
}));
const TITLE_OPTIONS: { value: DevelopmentTitleType; label: string }[] = [
  { value: 'CERTIFICATE_OF_OCCUPANCY', label: 'Certificate of Occupancy (C of O)' },
  { value: 'GOVERNOR_CONSENT', label: "Governor's consent" },
];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
].map((label, i) => ({ value: String(i + 1).padStart(2, '0'), label }));
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 12 }, (_, i) => String(THIS_YEAR - 1 + i)).map((y) => ({
  value: y,
  label: y,
}));
const DOC_KIND_OPTIONS = (Object.keys(DOCUMENT_KIND_LABEL) as DevelopmentDocumentKind[]).map(
  (k) => ({ value: k, label: DOCUMENT_KIND_LABEL[k] })
);
const PHOTO_KIND_OPTIONS: { value: DevelopmentPhotoKind; label: string }[] = [
  { value: 'SITE_PHOTO', label: 'Photo of the site (dated)' },
  { value: 'RENDER', label: "Artist's impression" },
];
const TODAY = () => new Date().toISOString().slice(0, 10);

const keyOf = (id: string) => [...DEVELOPMENTS_KEY, id] as const;
const num = (v: string) => (v.trim() === '' ? undefined : Number(v));

type Result = { success: boolean; data?: DeveloperDevelopment; error?: string };

/** One editor for a firm's development: details, evidence for the four checks, media, units and payment plan. */
export function DevelopmentEditorView({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const query = useQuery({
    queryKey: keyOf(id),
    queryFn: async () => {
      const res = await developmentsService.get(id);
      if (!res.success || !res.data)
        throw new Error(res.error || 'Could not load this development.');
      return res.data;
    },
  });

  /** Every change returns the whole development; put it straight into the cache. */
  const run = async (call: () => Promise<Result>, done: string) => {
    const res = await call();
    if (!res.success || !res.data) {
      toast.error(res.error || 'That did not save. Try again.');
      return false;
    }
    queryClient.setQueryData(keyOf(id), res.data);
    void queryClient.invalidateQueries({ queryKey: DEVELOPMENTS_KEY, exact: true });
    toast.success(done);
    return true;
  };

  if (query.isLoading) return <CardSkeleton />;
  if (query.isError || !query.data)
    return (
      <PageErrorState
        title="Could not load this development"
        description={(query.error as Error | null)?.message}
        onRetry={() => query.refetch()}
      />
    );
  const d = query.data;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/agency/developments"
        className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Developments
      </Link>
      <PageHeader
        title={d.name}
        description={formatLocation(d.location.city, d.location.state)}
        actions={
          <Badge variant={STATUS_VARIANT[d.status]}>{DEVELOPMENT_STATUS_LABEL[d.status]}</Badge>
        }
      />
      <StatusCard d={d} run={run} />
      <DevelopmentEnquiriesInbox developmentId={d.id} />
      <DetailsCard key={`details-${d.updatedAt}`} d={d} run={run} />
      <EvidenceCard key={`evidence-${d.updatedAt}`} d={d} run={run} />
      <DocumentsCard d={d} run={run} />
      <PhotosCard d={d} run={run} />
      <UnitTypesCard key={`units-${d.updatedAt}`} d={d} run={run} />
      <PaymentPlanCard key={`plan-${d.updatedAt}`} d={d} run={run} />
    </div>
  );
}

type Run = (call: () => Promise<Result>, done: string) => Promise<boolean>;

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function StatusCard({ d, run }: { d: DeveloperDevelopment; run: Run }) {
  const [busy, setBusy] = useState(false);
  const act = async (call: () => Promise<Result>, done: string) => {
    setBusy(true);
    await run(call, done);
    setBusy(false);
  };
  const canSubmit =
    d.status === 'DRAFT' || d.status === 'CHANGES_REQUESTED' || d.status === 'WITHDRAWN';
  return (
    <Section
      title="Checks before going live"
      description="Sureground staff check these four things. Your development is public only while all four have passed."
    >
      {d.firmKybStatus !== 'APPROVED' && (
        <Alert variant="warning" className="mb-4">
          Your firm&apos;s business verification is not approved yet, so this development cannot go
          to Sureground.{' '}
          <Link href="/agency/setup" className="font-medium underline">
            Finish business verification
          </Link>
        </Alert>
      )}
      {d.status === 'CHANGES_REQUESTED' && d.reviewNote && (
        <Alert variant="warning" className="mb-4">
          Sureground asked for changes: {d.reviewNote}
        </Alert>
      )}
      <ul className="space-y-2 text-sm">
        {d.checks.map((c) => (
          <li key={c.kind} className="flex items-start gap-3">
            {c.result === 'PASSED' ? (
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
            ) : c.result === 'FAILED' ? (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
            ) : (
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            )}
            <div>
              <p className="font-medium text-foreground">
                {c.label}:{' '}
                <span className="font-normal text-muted-foreground">
                  {c.result === 'PASSED'
                    ? 'passed'
                    : c.result === 'FAILED'
                      ? 'did not pass'
                      : 'not checked yet'}
                  {c.checkedAt ? `, ${formatDate(c.checkedAt)}` : ''}
                </span>
              </p>
              {c.note && <p className="text-muted-foreground">{c.note}</p>}
            </div>
          </li>
        ))}
      </ul>

      {canSubmit && d.submissionGaps.length > 0 && (
        <div className="mt-4 rounded-lg border border-border bg-secondary/40 p-4 text-sm">
          <p className="font-medium text-foreground">Still needed before you can send it</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            {d.submissionGaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {canSubmit && (
          <Button
            icon={<Send className="h-4 w-4" aria-hidden />}
            disabled={!d.isPrincipal || d.submissionGaps.length > 0 || busy}
            onClick={() =>
              act(() => developmentsService.submit(d.id), 'Sent to Sureground for the four checks.')
            }
          >
            Send to Sureground
          </Button>
        )}
        {d.status === 'LIVE' && (
          <Button
            href={`/developments/${d.id}`}
            variant="outline"
            icon={<ExternalLink className="h-4 w-4" aria-hidden />}
          >
            View the public page
          </Button>
        )}
        {(d.status === 'IN_REVIEW' || d.status === 'LIVE') && (
          <Button
            variant="outline"
            disabled={!d.isPrincipal || busy}
            onClick={() =>
              act(() => developmentsService.withdraw(d.id), 'Withdrawn. It is no longer public.')
            }
          >
            Withdraw
          </Button>
        )}
      </div>
      {!d.isPrincipal && (
        <p className="mt-2 text-xs text-muted-foreground">
          Only your firm&apos;s principal can send a development to Sureground or withdraw it.
        </p>
      )}
      {d.status === 'LIVE' && (
        <p className="mt-2 text-xs text-muted-foreground">
          Changing the title, the site address, the permit or the directors takes it off the public
          pages until Sureground checks it again.
        </p>
      )}
    </Section>
  );
}

function DetailsCard({ d, run }: { d: DeveloperDevelopment; run: Run }) {
  const [f, setF] = useState({
    name: d.name,
    summary: d.summary ?? '',
    addressLine: d.location.addressLine,
    city: d.location.city,
    state: d.location.state,
    lga: d.location.lga ?? '',
    stage: d.stage,
    completionMonth: d.expectedCompletion?.slice(5, 7) ?? '',
    completionYear: d.expectedCompletion?.slice(0, 4) ?? '',
    salesEmail: d.salesEmail ?? '',
    salesPhone: d.salesPhone ?? '',
  });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    const completion =
      f.completionMonth && f.completionYear ? `${f.completionYear}-${f.completionMonth}` : null;
    const fields: DevelopmentFields = {
      name: f.name,
      summary: f.summary || null,
      addressLine: f.addressLine,
      city: f.city,
      state: f.state,
      lga: f.lga || null,
      stage: f.stage,
      expectedCompletion: completion,
      salesEmail: f.salesEmail.trim() || null,
      salesPhone: f.salesPhone.trim() || null,
    };
    setSaving(true);
    await run(() => developmentsService.update(d.id, fields), 'Details saved.');
    setSaving(false);
  };
  return (
    <Section
      title="Details"
      description="The stage and expected completion show on the page as your statement."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required>
          <Input
            value={f.name}
            maxLength={120}
            onChange={(e) => setF({ ...f, name: e.target.value })}
          />
        </Field>
        <Field label="Stage">
          <Select
            value={f.stage}
            onValueChange={(v) => setF({ ...f, stage: v as DevelopmentStage })}
            options={STAGE_OPTIONS}
            searchable={false}
          />
        </Field>
        <Field label="About the development" className="sm:col-span-2">
          <Textarea
            value={f.summary}
            maxLength={2000}
            rows={4}
            onChange={(e) => setF({ ...f, summary: e.target.value })}
          />
        </Field>
        <Field
          label="Site address"
          required
          hint="Changing it sends the title check back to Sureground."
        >
          <Input
            value={f.addressLine}
            maxLength={200}
            onChange={(e) => setF({ ...f, addressLine: e.target.value })}
          />
        </Field>
        <Field label="LGA">
          <Input
            value={f.lga}
            maxLength={80}
            onChange={(e) => setF({ ...f, lga: e.target.value })}
          />
        </Field>
        <Field label="City or area" required>
          <Input
            value={f.city}
            maxLength={80}
            onChange={(e) => setF({ ...f, city: e.target.value })}
          />
        </Field>
        <Field label="State">
          <Select
            value={f.state}
            onValueChange={(v) => setF({ ...f, state: v })}
            options={STATE_OPTIONS}
          />
        </Field>
        <Field label="Expected completion, month">
          <Select
            value={f.completionMonth}
            onValueChange={(v) => setF({ ...f, completionMonth: v })}
            options={MONTHS}
            placeholder="Month"
            clearable
            searchable={false}
          />
        </Field>
        <Field label="Expected completion, year">
          <Select
            value={f.completionYear}
            onValueChange={(v) => setF({ ...f, completionYear: v })}
            options={YEARS}
            placeholder="Year"
            clearable
            searchable={false}
          />
        </Field>
        <Field label="Sales email" hint="Shown on the public page so buyers can reach you.">
          <Input
            type="email"
            value={f.salesEmail}
            maxLength={200}
            onChange={(e) => setF({ ...f, salesEmail: e.target.value })}
          />
        </Field>
        <Field label="Sales phone">
          <Input
            type="tel"
            value={f.salesPhone}
            maxLength={20}
            onChange={(e) => setF({ ...f, salesPhone: e.target.value })}
          />
        </Field>
      </div>
      <Button className="mt-4" onClick={save} isLoading={saving} loadingText="Saving">
        Save details
      </Button>
    </Section>
  );
}

function EvidenceCard({ d, run }: { d: DeveloperDevelopment; run: Run }) {
  const [titleType, setTitleType] = useState<string>(d.titleType ?? '');
  const [titleReference, setTitleReference] = useState(d.titleReference ?? '');
  const [permit, setPermit] = useState(d.planPermitReference ?? '');
  const [authority, setAuthority] = useState(
    d.planPermitAuthority ?? (d.location.state === 'Lagos' ? 'LASPPPA' : '')
  );
  const [directors, setDirectors] = useState<string[]>(d.directors.length ? d.directors : ['']);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    await run(
      () =>
        developmentsService.update(d.id, {
          titleType: (titleType || null) as DevelopmentTitleType | null,
          titleReference: titleReference.trim() || null,
          planPermitReference: permit.trim() || null,
          planPermitAuthority: authority.trim() || null,
          directors: directors.map((n) => n.trim()).filter(Boolean),
        }),
      'Saved. Any check these details cover goes back to Sureground.'
    );
    setSaving(false);
  };
  return (
    <Section
      title="Title, permit and directors"
      description="Sureground checks these against your documents. Changing one sends its check back to pending."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title to the site" required>
          <Select
            value={titleType}
            onValueChange={setTitleType}
            options={TITLE_OPTIONS}
            placeholder="Choose the title"
            searchable={false}
          />
        </Field>
        <Field label="Title reference number" required>
          <Input
            value={titleReference}
            maxLength={200}
            onChange={(e) => setTitleReference(e.target.value)}
          />
        </Field>
        <Field label="Building plan approval (permit) number" required>
          <Input value={permit} maxLength={200} onChange={(e) => setPermit(e.target.value)} />
        </Field>
        <Field label="Issued by" required hint="LASPPPA in Lagos.">
          <Input value={authority} maxLength={200} onChange={(e) => setAuthority(e.target.value)} />
        </Field>
      </div>
      <fieldset className="mt-4 space-y-2">
        <legend className="text-sm font-medium text-foreground">
          Directors, as on the CAC record
        </legend>
        {directors.map((name, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={name}
              maxLength={200}
              aria-label={`Director ${i + 1}`}
              onChange={(e) =>
                setDirectors(directors.map((n, j) => (j === i ? e.target.value : n)))
              }
            />
            <IconButton
              label={`Remove director ${i + 1}`}
              icon={<Trash2 className="h-4 w-4" aria-hidden />}
              onClick={() => setDirectors(directors.filter((_, j) => j !== i))}
            />
          </div>
        ))}
        {directors.length < 12 && (
          <Button
            variant="outline"
            size="sm"
            icon={<Plus className="h-4 w-4" aria-hidden />}
            onClick={() => setDirectors([...directors, ''])}
          >
            Add a director
          </Button>
        )}
      </fieldset>
      <Button className="mt-4" onClick={save} isLoading={saving} loadingText="Saving">
        Save title, permit and directors
      </Button>
    </Section>
  );
}

function DocumentsCard({ d, run }: { d: DeveloperDevelopment; run: Run }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const [kind, setKind] = useState<DevelopmentDocumentKind>('SITE_TITLE');
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const directorOptions = d.directors.map((n) => ({ value: n, label: n }));
  const upload = async (file: File | undefined) => {
    if (!file) return;
    const name = kind === 'DIRECTOR_ID' ? label : label.trim() || DOCUMENT_KIND_LABEL[kind];
    if (!name) {
      toast.error('Choose the director this ID belongs to.');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    setBusy(true);
    const ok = await run(
      () => developmentsService.addDocument(d.id, file, kind, name),
      'Document added.'
    );
    if (ok) setLabel('');
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  };
  return (
    <Section
      title="Documents"
      description="Private. Only Sureground staff see them, to make the checks. The public page never shows a document."
    >
      {d.documents.length > 0 && (
        <ul className="mb-4 divide-y divide-border rounded-lg border border-border text-sm">
          {d.documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-3 p-3">
              <span className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 truncate">
                  <span className="font-medium text-foreground">
                    {DOCUMENT_KIND_LABEL[doc.kind]}
                  </span>
                  <span className="text-muted-foreground">
                    {' '}
                    · {doc.label} · {doc.fileName}
                  </span>
                </span>
              </span>
              <IconButton
                size="sm"
                label={`Remove ${doc.fileName}`}
                icon={<Trash2 className="h-4 w-4" aria-hidden />}
                onClick={() =>
                  run(() => developmentsService.removeDocument(d.id, doc.id), 'Document removed.')
                }
              />
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Document">
          <Select
            value={kind}
            onValueChange={(v) => {
              setKind(v as DevelopmentDocumentKind);
              setLabel('');
            }}
            options={DOC_KIND_OPTIONS}
            searchable={false}
          />
        </Field>
        {kind === 'DIRECTOR_ID' ? (
          <Field
            label="Director"
            hint={directorOptions.length ? undefined : 'Add the directors above first.'}
          >
            <Select
              value={label}
              onValueChange={setLabel}
              options={directorOptions}
              placeholder="Choose a director"
            />
          </Field>
        ) : (
          <Field label="Name it" hint="For example, Certificate of Occupancy, or LASPPPA permit.">
            <Input value={label} maxLength={200} onChange={(e) => setLabel(e.target.value)} />
          </Field>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        onChange={(e) => upload(e.target.files?.[0])}
      />
      <Button
        className="mt-4"
        variant="outline"
        isLoading={busy}
        loadingText="Uploading"
        icon={<Upload className="h-4 w-4" aria-hidden />}
        onClick={() => fileRef.current?.click()}
      >
        Upload a PDF or photo
      </Button>
    </Section>
  );
}

function PhotosCard({ d, run }: { d: DeveloperDevelopment; run: Run }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<DevelopmentPhotoKind>('SITE_PHOTO');
  const [takenOn, setTakenOn] = useState(TODAY());
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    const ok = await run(
      () =>
        developmentsService.addPhoto(
          d.id,
          file,
          kind,
          caption,
          kind === 'SITE_PHOTO' ? `${takenOn}T12:00:00.000Z` : undefined
        ),
      'Photo added.'
    );
    if (ok) setCaption('');
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  };
  return (
    <Section
      title="Photos"
      description="Site photos show with the date they were taken, as a progress gallery. Artist's impressions are labelled as impressions."
    >
      {d.photos.length > 0 && (
        <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {d.photos.map((p) => (
            <li key={p.id} className="space-y-1 text-xs">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted">
                {p.url && (
                  // eslint-disable-next-line @next/next/no-img-element -- short-lived signed storage URL
                  <img src={p.url} alt={p.caption ?? ''} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex items-start justify-between gap-1">
                <span className="text-muted-foreground">
                  {p.kind === 'RENDER'
                    ? "Artist's impression"
                    : `Taken ${p.capturedAt ? formatDate(p.capturedAt) : ''}`}
                  {p.caption ? ` · ${p.caption}` : ''}
                </span>
                <IconButton
                  size="sm"
                  label="Remove this photo"
                  icon={<Trash2 className="h-3.5 w-3.5" aria-hidden />}
                  onClick={() =>
                    run(() => developmentsService.removePhoto(d.id, p.id), 'Photo removed.')
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Kind">
          <Select
            value={kind}
            onValueChange={(v) => setKind(v as DevelopmentPhotoKind)}
            options={PHOTO_KIND_OPTIONS}
            searchable={false}
          />
        </Field>
        {kind === 'SITE_PHOTO' && (
          <Field label="Date taken" required>
            <DatePicker value={takenOn} onChange={setTakenOn} max={TODAY()} />
          </Field>
        )}
        <Field label="Caption">
          <Input value={caption} maxLength={140} onChange={(e) => setCaption(e.target.value)} />
        </Field>
      </div>
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => upload(e.target.files?.[0])}
      />
      <Button
        className="mt-4"
        variant="outline"
        isLoading={busy}
        loadingText="Uploading"
        icon={<Upload className="h-4 w-4" aria-hidden />}
        onClick={() => fileRef.current?.click()}
      >
        Add a photo
      </Button>
    </Section>
  );
}

type UnitRow = {
  id?: string;
  name: string;
  bedrooms: string;
  bathrooms: string;
  sizeSqm: string;
  price: number;
  total: string;
  available: string;
};

function UnitTypesCard({ d, run }: { d: DeveloperDevelopment; run: Run }) {
  const [rows, setRows] = useState<UnitRow[]>(
    d.unitTypes.map((u) => ({
      id: u.id,
      name: u.name,
      bedrooms: u.bedrooms?.toString() ?? '',
      bathrooms: u.bathrooms?.toString() ?? '',
      sizeSqm: u.sizeSqm?.toString() ?? '',
      price: u.priceFromNaira ?? 0,
      total: u.unitsTotal?.toString() ?? '',
      available: u.unitsAvailable?.toString() ?? '',
    }))
  );
  const [saving, setSaving] = useState(false);
  const set = (i: number, patch: Partial<UnitRow>) =>
    setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const save = async () => {
    const unitTypes: UnitTypeInput[] = rows
      .filter((r) => r.name.trim())
      .map((r) => ({
        ...(r.id ? { id: r.id } : {}),
        name: r.name.trim(),
        bedrooms: num(r.bedrooms),
        bathrooms: num(r.bathrooms),
        sizeSqm: num(r.sizeSqm),
        priceFromNaira: r.price > 0 ? r.price : undefined,
        unitsTotal: num(r.total),
        unitsAvailable: num(r.available),
      }));
    setSaving(true);
    await run(() => developmentsService.replaceUnitTypes(d.id, unitTypes), 'Unit types saved.');
    setSaving(false);
  };
  return (
    <Section
      title="Unit types"
      description="Shown as you state them. Sureground does not check prices or sizes."
    >
      <div className="space-y-4">
        {rows.map((r, i) => (
          <div
            key={r.id ?? `new-${i}`}
            className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-4"
          >
            <Field label="Name" className="sm:col-span-2">
              <Input
                value={r.name}
                maxLength={200}
                onChange={(e) => set(i, { name: e.target.value })}
              />
            </Field>
            <Field label="From (₦)">
              <CurrencyInput value={r.price} onValueChange={(price) => set(i, { price })} />
            </Field>
            <Field label="Size (m²)">
              <NumberInput value={r.sizeSqm} onValueChange={(sizeSqm) => set(i, { sizeSqm })} />
            </Field>
            <Field label="Bedrooms">
              <NumberInput
                integer
                value={r.bedrooms}
                onValueChange={(bedrooms) => set(i, { bedrooms })}
              />
            </Field>
            <Field label="Bathrooms">
              <NumberInput
                integer
                value={r.bathrooms}
                onValueChange={(bathrooms) => set(i, { bathrooms })}
              />
            </Field>
            <Field label="Units in total">
              <NumberInput integer value={r.total} onValueChange={(total) => set(i, { total })} />
            </Field>
            <Field label="Units available">
              <NumberInput
                integer
                value={r.available}
                onValueChange={(available) => set(i, { available })}
              />
            </Field>
            <div className="sm:col-span-4">
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 className="h-4 w-4" aria-hidden />}
                onClick={() => setRows(rows.filter((_, j) => j !== i))}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          icon={<Plus className="h-4 w-4" aria-hidden />}
          onClick={() =>
            setRows([
              ...rows,
              {
                name: '',
                bedrooms: '',
                bathrooms: '',
                sizeSqm: '',
                price: 0,
                total: '',
                available: '',
              },
            ])
          }
        >
          Add a unit type
        </Button>
        <Button onClick={save} isLoading={saving} loadingText="Saving">
          Save unit types
        </Button>
      </div>
    </Section>
  );
}

type PlanRow = {
  label: string;
  amount: number;
  percent: string;
  dueWhen: string;
  unitTypeId: string;
};
const ALL_UNITS = '__all__';

function PaymentPlanCard({ d, run }: { d: DeveloperDevelopment; run: Run }) {
  const [note, setNote] = useState(d.paymentPlan.note ?? '');
  const [rows, setRows] = useState<PlanRow[]>(
    d.paymentPlan.instalments.map((i) => ({
      label: i.label,
      amount: i.amountNaira ?? 0,
      percent: i.percent?.toString() ?? '',
      dueWhen: i.dueWhen ?? '',
      unitTypeId: i.unitTypeId ?? ALL_UNITS,
    }))
  );
  const [saving, setSaving] = useState(false);
  const unitOptions = [
    { value: ALL_UNITS, label: 'All unit types' },
    ...d.unitTypes.map((u) => ({ value: u.id, label: u.name })),
  ];
  const set = (i: number, patch: Partial<PlanRow>) =>
    setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const save = async () => {
    const instalments: InstalmentInput[] = rows
      .filter((r) => r.label.trim())
      .map((r) => ({
        label: r.label.trim(),
        ...(r.unitTypeId !== ALL_UNITS ? { unitTypeId: r.unitTypeId } : {}),
        ...(r.amount > 0 ? { amountNaira: r.amount } : {}),
        ...(num(r.percent) !== undefined ? { percent: num(r.percent) } : {}),
        ...(r.dueWhen.trim() ? { dueWhen: r.dueWhen.trim() } : {}),
      }));
    setSaving(true);
    await run(
      () => developmentsService.replacePaymentPlan(d.id, note.trim() || null, instalments),
      'Payment plan saved.'
    );
    setSaving(false);
  };
  return (
    <Section
      title="Payment plan"
      description="Each line is shown exactly as you write it. Sureground does not add up, check or collect any of it."
    >
      <DevelopmentPaymentNotice compact />
      <div className="mt-4 space-y-4">
        {rows.map((r, i) => (
          <div key={i} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-4">
            <Field label="Instalment" className="sm:col-span-2">
              <Input
                value={r.label}
                maxLength={200}
                placeholder="Initial deposit"
                onChange={(e) => set(i, { label: e.target.value })}
              />
            </Field>
            <Field label="When it is due" className="sm:col-span-2">
              <Input
                value={r.dueWhen}
                maxLength={200}
                placeholder="On signing"
                onChange={(e) => set(i, { dueWhen: e.target.value })}
              />
            </Field>
            <Field label="Amount (₦)">
              <CurrencyInput value={r.amount} onValueChange={(amount) => set(i, { amount })} />
            </Field>
            <Field label="Or share of the price (%)">
              <NumberInput value={r.percent} onValueChange={(percent) => set(i, { percent })} />
            </Field>
            <Field label="Applies to" className="sm:col-span-2">
              <Select
                value={r.unitTypeId}
                onValueChange={(unitTypeId) => set(i, { unitTypeId })}
                options={unitOptions}
                searchable={false}
              />
            </Field>
            <div className="sm:col-span-4">
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 className="h-4 w-4" aria-hidden />}
                onClick={() => setRows(rows.filter((_, j) => j !== i))}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Field label="Anything else about payment, in your words" className="mt-4">
        <Textarea
          value={note}
          maxLength={2000}
          rows={3}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>
      {rows.length === 0 && (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4" aria-hidden /> No instalments yet.
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          icon={<Plus className="h-4 w-4" aria-hidden />}
          onClick={() =>
            setRows([
              ...rows,
              { label: '', amount: 0, percent: '', dueWhen: '', unitTypeId: ALL_UNITS },
            ])
          }
        >
          Add an instalment
        </Button>
        <Button onClick={save} isLoading={saving} loadingText="Saving">
          Save payment plan
        </Button>
      </div>
    </Section>
  );
}
