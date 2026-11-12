'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BadgeCheck, Clock, FileText, XCircle } from '@sureground/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  ListSkeleton,
  PageErrorState,
  PageHeader,
  Textarea,
  useToast,
} from '@sureground/ui';
import { formatDate, unwrap } from '@sureground/shared';
import { useAdminUser } from '../../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import {
  STATUS_BADGE,
  adminDevelopmentsService,
  type AdminDevelopment,
  type AdminDevelopmentCheck,
  type DevelopmentCheckResult,
} from '@/services/adminDevelopmentsService';

const TITLE_LABEL: Record<string, string> = {
  CERTIFICATE_OF_OCCUPANCY: 'Certificate of Occupancy',
  GOVERNOR_CONSENT: "Governor's consent",
};

const DOC_KIND_LABEL: Record<string, string> = {
  SITE_TITLE: 'Title document',
  BUILDING_APPROVAL: 'Building plan approval',
  DIRECTOR_ID: "Director's ID",
  OTHER_APPROVAL: 'Other approval',
};

export default function DevelopmentCheckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const user = useAdminUser();
  const canAct = hasAdminPermission(user?.roles, 'verifications.approve');
  const queryClient = useQueryClient();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [backNote, setBackNote] = useState('');
  const key = ['admin', 'developments', 'detail', id];
  const query = useQuery({
    queryKey: key,
    queryFn: () => unwrap(adminDevelopmentsService.get(id)),
  });

  const act = async (label: string, call: () => Promise<AdminDevelopment>, done: string) => {
    setBusy(label);
    try {
      queryClient.setQueryData(key, await call());
      toast.success(done);
    } catch (e) {
      toast.error((e as Error).message || 'That did not save.');
      void queryClient.invalidateQueries({ queryKey: key });
    } finally {
      setBusy(null);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'developments'], exact: false });
    }
  };

  const openDocument = async (docId: string) => {
    try {
      const { url } = await unwrap(adminDevelopmentsService.documentUrl(id, docId));
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      toast.error((e as Error).message || 'Could not open the document.');
    }
  };

  if (query.isLoading) return <ListSkeleton variant="cards" />;
  if (query.isError || !query.data)
    return (
      <PageErrorState
        title="Could not load this development"
        description={(query.error as Error | null)?.message}
        onRetry={() => query.refetch()}
      />
    );
  const d = query.data;
  const firm = d.developer;
  const reviewable = d.status === 'IN_REVIEW' || d.status === 'LIVE';

  return (
    <>
      <Link
        href="/admin/developments"
        className="mb-2 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Development checks
      </Link>
      <PageHeader
        title={d.name}
        description={[d.location.addressLine, d.location.lga, d.location.city, d.location.state]
          .filter(Boolean)
          .join(', ')}
        actions={
          <Badge variant={STATUS_BADGE[d.status].variant}>{STATUS_BADGE[d.status].label}</Badge>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          {d.checks.map((check) => (
            <CheckCard
              key={check.kind}
              check={check}
              canAct={canAct && reviewable}
              busy={busy === check.kind}
              onRecord={(result, confirmed, note) =>
                act(
                  check.kind,
                  () =>
                    unwrap(
                      adminDevelopmentsService.recordCheck(d, check.kind, result, confirmed, note)
                    ),
                  result === 'PASSED'
                    ? `${check.label}: passed.`
                    : result === 'FAILED'
                      ? `${check.label}: did not pass. The developer sees your note.`
                      : `${check.label}: back to not checked.`
                )
              }
            />
          ))}

          <Card className="p-5">
            <h2 className="font-medium text-foreground">Go live</h2>
            {d.status === 'LIVE' ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Live since {d.liveAt ? formatDate(d.liveAt) : 'now'}. Any check you set back, or any
                change the developer makes to the evidence, takes it off the public pages.
              </p>
            ) : d.liveBlockers.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {d.liveBlockers.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                All four checks passed. Putting it live shows it on the public pages, with what was
                checked and the statement that buyers pay the developer directly.
              </p>
            )}
            {canAct && (
              <div className="mt-4 space-y-3">
                {d.status === 'IN_REVIEW' && (
                  <Button
                    variant="primary"
                    disabled={d.liveBlockers.length > 0 || !!busy}
                    onClick={() =>
                      act(
                        'publish',
                        () => unwrap(adminDevelopmentsService.publish(d)),
                        'It is live.'
                      )
                    }
                  >
                    Put it live
                  </Button>
                )}
                {reviewable && (
                  <>
                    <Textarea
                      value={backNote}
                      maxLength={500}
                      onChange={(e) => setBackNote(e.target.value)}
                      placeholder="What the developer needs to change (they see this)"
                      aria-label="Note to the developer"
                    />
                    <Button
                      variant="outline"
                      disabled={backNote.trim().length < 10 || !!busy}
                      onClick={() =>
                        act(
                          'back',
                          () =>
                            unwrap(adminDevelopmentsService.requestChanges(d.id, backNote.trim())),
                          d.status === 'LIVE'
                            ? 'Taken down and sent back to the developer.'
                            : 'Sent back to the developer.'
                        )
                      }
                    >
                      {d.status === 'LIVE'
                        ? 'Take down and send back'
                        : 'Send back to the developer'}
                    </Button>
                  </>
                )}
              </div>
            )}
            {!canAct && (
              <p className="mt-3 text-xs text-muted-foreground">
                Recording checks and putting a development live need the verification approval
                permission.
              </p>
            )}
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="p-5 text-sm">
            <h2 className="font-medium text-foreground">Developer</h2>
            <dl className="mt-2 space-y-1 text-muted-foreground">
              <div>{firm.name}</div>
              {firm.registeredName && <div>Registered as {firm.registeredName}</div>}
              {firm.registrationNumber && <div>{firm.registrationNumber}</div>}
              <div>
                Business verification: {firm.kybStatus ?? 'not started'}
                {firm.kybDecidedAt ? `, ${formatDate(firm.kybDecidedAt)}` : ''}
              </div>
              {firm.agencyStatus && <div>Firm status: {firm.agencyStatus}</div>}
              {firm.cacVerifiedAt ? (
                <div>
                  CAC registry lookup {formatDate(firm.cacVerifiedAt)}: {firm.verifiedLegalName}
                  {firm.verifiedDirectors.length
                    ? `; directors ${firm.verifiedDirectors.join(', ')}`
                    : ''}
                </div>
              ) : (
                <div>No CAC registry lookup on file. Check the certificate under Agencies.</div>
              )}
            </dl>
          </Card>

          <Card className="p-5 text-sm">
            <h2 className="font-medium text-foreground">What the developer states</h2>
            <dl className="mt-2 space-y-1 text-muted-foreground">
              <div>
                Title: {d.titleType ? (TITLE_LABEL[d.titleType] ?? d.titleType) : 'not given'}
                {d.titleReference ? `, ${d.titleReference}` : ''}
              </div>
              <div>
                Permit: {d.planPermitReference ?? 'not given'}
                {d.planPermitAuthority ? ` (${d.planPermitAuthority})` : ''}
              </div>
              <div>Directors: {d.directors.length ? d.directors.join(', ') : 'none listed'}</div>
              <div>
                {d.unitTypes.length} unit types, {d.paymentPlan.instalments.length} payment plan
                lines, {d.photos.length} photos
              </div>
            </dl>
          </Card>

          <Card className="p-5 text-sm">
            <h2 className="font-medium text-foreground">Documents</h2>
            {d.documents.length === 0 ? (
              <p className="mt-2 text-muted-foreground">None uploaded.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {d.documents.map((doc) => (
                  <li key={doc.id}>
                    <Button
                      variant="link"
                      icon={<FileText className="h-4 w-4 shrink-0" aria-hidden />}
                      onClick={() => openDocument(doc.id)}
                    >
                      {DOC_KIND_LABEL[doc.kind] ?? doc.kind}: {doc.label}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Each opening is kept in the audit log.
            </p>
          </Card>
        </aside>
      </div>
    </>
  );
}

function CheckCard({
  check,
  canAct,
  busy,
  onRecord,
}: {
  check: AdminDevelopmentCheck;
  canAct: boolean;
  busy: boolean;
  onRecord: (result: DevelopmentCheckResult, confirmed: string[], note?: string) => void;
}) {
  const [confirmed, setConfirmed] = useState<string[]>(check.confirmedItems);
  const [note, setNote] = useState('');
  const missing = check.checklist.filter((i) => i.required && !confirmed.includes(i.key));
  const toggle = (key: string, on: boolean) =>
    setConfirmed(on ? [...confirmed, key] : confirmed.filter((k) => k !== key));

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="font-medium text-foreground">{check.label}</h2>
        {check.result === 'PASSED' ? (
          <Badge variant="success" icon={<BadgeCheck className="h-3.5 w-3.5" />}>
            Passed
          </Badge>
        ) : check.result === 'FAILED' ? (
          <Badge variant="danger" icon={<XCircle className="h-3.5 w-3.5" />}>
            Did not pass
          </Badge>
        ) : (
          <Badge variant="neutral" icon={<Clock className="h-3.5 w-3.5" />}>
            Not checked
          </Badge>
        )}
      </div>
      {check.checkedAt && (
        <p className="mt-1 text-xs text-muted-foreground">
          {formatDate(check.checkedAt)}
          {check.checkedByName ? ` by ${check.checkedByName}` : ''}
          {check.note ? `. ${check.note}` : ''}
        </p>
      )}
      {check.evidenceGap && (
        <Alert variant="warning" className="mt-3">
          {check.evidenceGap}
        </Alert>
      )}
      <ul className="mt-3 space-y-2">
        {check.checklist.map((item) => (
          <li key={item.key}>
            <Checkbox
              checked={confirmed.includes(item.key)}
              disabled={!canAct}
              onCheckedChange={(on) => toggle(item.key, on === true)}
              label={`${item.label}${item.required ? '' : ' (optional)'}`}
            />
          </li>
        ))}
      </ul>
      {canAct && (
        <div className="mt-4 space-y-2">
          <Textarea
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
            placeholder="How you checked it, or what failed (a failed check's note goes to the developer)"
            aria-label={`Note for ${check.label}`}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              disabled={busy || missing.length > 0 || !!check.evidenceGap}
              onClick={() => onRecord('PASSED', confirmed, note)}
            >
              Mark as passed
            </Button>
            <Button
              variant="outline"
              disabled={busy || note.trim().length === 0}
              onClick={() => onRecord('FAILED', [], note)}
            >
              Did not pass
            </Button>
            {check.result !== 'PENDING' && (
              <Button variant="ghost" disabled={busy} onClick={() => onRecord('PENDING', [], note)}>
                Back to not checked
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
