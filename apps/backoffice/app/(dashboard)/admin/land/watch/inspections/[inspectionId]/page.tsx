'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Camera,
  CircleAlert,
  ClipboardCheck,
  MapPin,
  ShieldAlert,
  UserPlus,
} from 'lucide-react';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  PageLoadingState,
  Select,
  Textarea,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import {
  boundaryTone,
  formatDate,
  LAND_BOUNDARY_LABELS,
  LAND_INSPECTION_KIND_LABELS,
  landPoint,
  unwrap,
  type StaffInspection,
  describeDistance,
} from '@getrentos/shared';
import { useAdminUser } from '../../../../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import { humaniseEnum, landQueryKeys, readLandApiError } from '@/lib/landDiligence';
import { adminLandProfessionalService } from '@/services/adminLandProfessionalService';
import { adminLandWatchService } from '@/services/adminLandWatchService';
import { Fact, LandCaseSection, PanelMessage } from '@/components/admin/land/case/shared';

const AWAITING_STAFF = new Set(['SUBMITTED', 'ESCALATED']);

/** One inspection: who, when, where they stood, what they captured, and the decision. */
export default function AdminLandInspectionPage() {
  const params = useParams<{ inspectionId: string }>();
  const id = decodeURIComponent(params.inspectionId);
  const queryClient = useQueryClient();
  const user = useAdminUser();
  const canView = hasAdminPermission(user?.roles, 'verifications.review');
  const canDecide = hasAdminPermission(user?.roles, 'verifications.approve');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const [note, setNote] = useState('');
  const key = landQueryKeys.watchInspection(id);
  const detail = useQuery({
    queryKey: key,
    queryFn: () => unwrap(adminLandWatchService.inspection(id)),
    enabled: canView,
  });

  const done = (updated: StaffInspection, message: string) => {
    queryClient.setQueryData(key, updated);
    void queryClient.invalidateQueries({ queryKey: landQueryKeys.watchRoot });
    setNote('');
    setToast({ message, variant: 'success' });
  };
  const failed = (e: unknown, fallback: string) =>
    setToast({ message: readLandApiError(e, fallback).message, variant: 'error' });
  const accept = useMutation({
    mutationFn: () => unwrap(adminLandWatchService.accept(id, note)),
    onSuccess: (d) => done(d, 'Accepted; the owner can see the report.'),
    onError: (e) => failed(e, 'Could not accept the report.'),
  });
  const query = useMutation({
    mutationFn: () => unwrap(adminLandWatchService.query(id, note.trim())),
    onSuccess: (d) => done(d, 'Sent back to the inspector.'),
    onError: (e) => failed(e, 'Could not send it back.'),
  });
  const cancel = useMutation({
    mutationFn: () => unwrap(adminLandWatchService.cancel(id, note.trim())),
    onSuccess: (d) => done(d, 'Inspection called off.'),
    onError: (e) => failed(e, 'Could not cancel it.'),
  });

  if (!canView) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="You do not have access to Land Watch"
        description="It needs the verifications review permission."
      />
    );
  }
  if (detail.isLoading) return <PageLoadingState />;
  const i = detail.data;
  if (detail.isError || !i) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="This inspection could not be loaded"
        description={detail.error instanceof Error ? detail.error.message : undefined}
      />
    );
  }
  const point = landPoint(i.land.location);
  const r = i.report;
  const closed = i.status === 'ACCEPTED' || i.status === 'CANCELLED';

  return (
    <>
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
      <Link
        href="/admin/land/watch"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Land Watch
      </Link>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="type-title">{i.land.label}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-mono">{i.reference}</span> · {LAND_INSPECTION_KIND_LABELS[i.kind]}{' '}
            · {i.land.address}, {i.land.city}, {i.land.state}
          </p>
        </div>
        <Badge
          variant={
            i.status === 'ESCALATED' ? 'danger' : i.status === 'ACCEPTED' ? 'success' : 'info'
          }
        >
          {humaniseEnum(i.status)}
        </Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          {i.integrityFlags.length > 0 && (
            <LandCaseSection
              title="Integrity checks"
              icon={ShieldAlert}
              description="Why this report was routed to staff before the owner sees it."
            >
              <ul className="space-y-1.5 text-sm text-foreground">
                {i.integrityFlags.map((f, n) => (
                  <li key={`${f.code}-${n}`}>
                    • {f.message}{' '}
                    <span className="font-mono text-xs text-muted-foreground">({f.code})</span>
                  </li>
                ))}
              </ul>
            </LandCaseSection>
          )}
          <LandCaseSection title="Report" icon={ClipboardCheck}>
            {!r ? (
              <PanelMessage>Nothing filed yet.</PanelMessage>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Fact
                    label="Boundary"
                    value={
                      r.boundaryCondition ? (
                        <Badge variant={boundaryTone(r.boundaryCondition)}>
                          {LAND_BOUNDARY_LABELS[r.boundaryCondition]}
                        </Badge>
                      ) : (
                        '—'
                      )
                    }
                  />
                  <Fact
                    label="Beacons"
                    value={
                      r.beaconsExpected != null
                        ? `${r.beaconsFound ?? '—'} of ${r.beaconsExpected}`
                        : '—'
                    }
                  />
                  <Fact label="Filed from" value={describeDistance(r.distanceM)} />
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm text-foreground">{r.summary}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Filed {formatDate(r.submittedAt)}
                </p>
              </>
            )}
          </LandCaseSection>
          <LandCaseSection
            title="Captures"
            icon={Camera}
            description="Each kept with its SHA-256, device time, server time and distance from the land."
          >
            {!i.evidence?.length ? (
              <PanelMessage>No captures.</PanelMessage>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {i.evidence.map((e) => (
                  <li key={e.id} className="rounded-xl border border-border p-2 text-xs">
                    <a href={e.url} target="_blank" rel="noopener noreferrer">
                      {e.mimeType.startsWith('image/') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={e.url}
                          alt={e.fileName}
                          className="aspect-video w-full rounded-lg object-cover"
                        />
                      ) : (
                        <span className="text-primary hover:underline">{e.fileName}</span>
                      )}
                    </a>
                    <p className="mt-1.5 text-foreground">
                      {describeDistance(e.distanceM)}
                      {e.capturedOffline && ' · captured offline'}
                    </p>
                    <p className="text-muted-foreground">
                      Taken {formatDate(e.capturedAt)} · received {formatDate(e.receivedAt)}
                    </p>
                    <p className="font-mono text-muted-foreground">{e.fileHash.slice(0, 16)}…</p>
                  </li>
                ))}
              </ul>
            )}
          </LandCaseSection>
        </div>

        <div className="space-y-5">
          <LandCaseSection title="The land" icon={MapPin}>
            <div className="grid gap-3">
              <Fact label="Requested" value={formatDate(i.createdAt)} />
              {i.instructions && <Fact label="Instructions" value={i.instructions} />}
              {point ? (
                <a
                  href={`https://www.google.com/maps?q=${point.lat},${point.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Open on the map (
                  {'ring' in (i.land.location ?? {}) ? 'surveyed boundary' : 'pin only'})
                </a>
              ) : (
                <PanelMessage>
                  The land has no boundary or pin, so locations cannot be checked.
                </PanelMessage>
              )}
            </div>
          </LandCaseSection>
          <AssignInspector
            inspection={i}
            disabled={closed || !['REQUESTED', 'ASSIGNED'].includes(i.status)}
            onDone={done}
            onFailed={failed}
          />
          <LandCaseSection title="Decision">
            {i.staffNote && (
              <p className="mb-2 text-sm text-muted-foreground">Last note: {i.staffNote}</p>
            )}
            {closed ? (
              <PanelMessage>
                {i.status === 'ACCEPTED'
                  ? `Accepted ${i.reviewedAt ? formatDate(i.reviewedAt) : ''}.`
                  : 'Called off.'}
              </PanelMessage>
            ) : (
              <div className="space-y-2">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Note (required to query or cancel; shown to the owner when accepting)"
                />
                <div className="flex flex-wrap gap-2">
                  {canDecide && AWAITING_STAFF.has(i.status) && (
                    <Button size="sm" isLoading={accept.isPending} onClick={() => accept.mutate()}>
                      Accept report
                    </Button>
                  )}
                  {AWAITING_STAFF.has(i.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={note.trim().length < 5}
                      isLoading={query.isPending}
                      onClick={() => query.mutate()}
                    >
                      Send back with questions
                    </Button>
                  )}
                  {canDecide && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={note.trim().length < 5}
                      isLoading={cancel.isPending}
                      onClick={() => cancel.mutate()}
                    >
                      Call off
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  An inspector cannot accept their own report.
                </p>
              </div>
            )}
          </LandCaseSection>
        </div>
      </div>
    </>
  );
}

function AssignInspector({
  inspection,
  disabled,
  onDone,
  onFailed,
}: {
  inspection: StaffInspection;
  disabled: boolean;
  onDone: (i: StaffInspection, m: string) => void;
  onFailed: (e: unknown, f: string) => void;
}) {
  const [inspectorId, setInspectorId] = useState('');
  const [dueBy, setDueBy] = useState('');
  const pros = useQuery({
    queryKey: ['admin', 'land', 'professionals', 'list', 'ACCREDITED', 'INSPECTOR'],
    queryFn: () =>
      unwrap(adminLandProfessionalService.list({ status: 'ACCREDITED', role: 'INSPECTOR' })),
    enabled: !disabled,
  });
  // Only inspectors who practise in the land's state can be engaged.
  const options = (pros.data ?? [])
    .filter((p) =>
      p.practiceStates.some((s) => s.toLowerCase() === inspection.land.state.toLowerCase())
    )
    .map((p) => ({ value: p.userId, label: `${p.name} · ${p.practiceStates.join(', ')}` }));
  const assign = useMutation({
    mutationFn: () =>
      unwrap(
        adminLandWatchService.assign(
          inspection.id,
          inspectorId,
          dueBy ? new Date(dueBy).toISOString() : undefined
        )
      ),
    onSuccess: (d) => onDone(d, 'Inspector assigned and told.'),
    onError: (e) => onFailed(e, 'Could not assign that inspector.'),
  });
  return (
    <LandCaseSection title="Inspector" icon={UserPlus}>
      <p className="mb-3 text-sm text-foreground">
        {inspection.inspector
          ? `${inspection.inspector.legalName}${inspection.assignedAt ? ` · since ${formatDate(inspection.assignedAt)}` : ''}`
          : 'Not assigned'}
      </p>
      {!disabled && (
        <div className="space-y-2">
          <Select
            value={inspectorId}
            onValueChange={setInspectorId}
            ariaLabel="Inspector"
            placeholder={
              pros.isLoading
                ? 'Loading…'
                : options.length
                  ? `Accredited in ${inspection.land.state}`
                  : `Nobody accredited in ${inspection.land.state}`
            }
            disabled={!options.length}
            options={options}
          />
          <Input
            type="date"
            value={dueBy}
            onChange={(e) => setDueBy(e.target.value)}
            aria-label="Due by"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={!inspectorId || assign.isPending}
            isLoading={assign.isPending}
            onClick={() => assign.mutate()}
          >
            {inspection.inspector ? 'Reassign' : 'Assign'}
          </Button>
        </div>
      )}
    </LandCaseSection>
  );
}
