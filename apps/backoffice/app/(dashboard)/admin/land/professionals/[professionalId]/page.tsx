'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BadgeCheck, BarChart3, CircleAlert, FileText, Gavel } from 'lucide-react';
import {
  Badge,
  Button,
  EmptyState,
  PageLoadingState,
  Textarea,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { formatDate, unwrap } from '@getrentos/shared';
import { useAdminUser } from '../../../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import { readLandApiError } from '@/lib/landDiligence';
import {
  adminLandProfessionalService,
  landProfessionalKeys,
} from '@/services/adminLandProfessionalService';
import {
  LAND_PROFESSIONAL_ROLE_LABELS,
  LAND_PROFESSIONAL_STATUS_LABELS,
  LAND_PROFESSIONAL_STATUS_VARIANT,
  type AdminLandProfessional,
} from '@/types/landProfessional';
import { Fact, LandCaseSection, PanelMessage } from '@/components/admin/land/case/shared';

type Action = 'accredit' | 'reject' | 'suspend' | 'reinstate';

const ACTION_COPY: Record<Action, { label: string; done: string; placeholder: string }> = {
  accredit: {
    label: 'Accredit',
    done: 'Accredited; they can now be engaged.',
    placeholder: 'What you checked, e.g. "SURCON register searched 15 Oct 2026: licence current."',
  },
  reject: {
    label: 'Reject',
    done: 'Application rejected; they were told why.',
    placeholder: 'Why the application cannot be accepted.',
  },
  suspend: {
    label: 'Suspend',
    done: 'Suspended and withdrawn from live cases.',
    placeholder: 'Why, e.g. a failed audit or a complaint upheld.',
  },
  reinstate: {
    label: 'Reinstate',
    done: 'Suspension lifted.',
    placeholder: 'Why the suspension is lifted.',
  },
};

const actionsFor = (p: AdminLandProfessional): Action[] =>
  p.status === 'APPLIED'
    ? ['accredit', 'reject']
    : p.status === 'EXPIRED'
      ? ['accredit']
      : p.status === 'ACCREDITED'
        ? ['suspend']
        : p.status === 'SUSPENDED'
          ? ['reinstate']
          : [];

/** One professional: credential, decision, engagements and audit record. */
export default function AdminLandProfessionalPage() {
  const params = useParams<{ professionalId: string }>();
  const id = decodeURIComponent(params.professionalId);
  const queryClient = useQueryClient();
  const user = useAdminUser();
  const canView = hasAdminPermission(user?.roles, 'verifications.review');
  const canDecide = hasAdminPermission(user?.roles, 'verifications.approve');
  const [note, setNote] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const detail = useQuery({
    queryKey: landProfessionalKeys.detail(id),
    queryFn: () => unwrap(adminLandProfessionalService.detail(id)),
    enabled: canView,
  });

  const act = useMutation({
    mutationFn: (action: Action) => unwrap(adminLandProfessionalService[action](id, note.trim())),
    onSuccess: (updated, action) => {
      queryClient.setQueryData(landProfessionalKeys.detail(id), updated);
      void queryClient.invalidateQueries({
        queryKey: landProfessionalKeys.root,
        refetchType: 'none',
      });
      setNote('');
      setToast({ message: ACTION_COPY[action].done, variant: 'success' });
    },
    onError: (error) =>
      setToast({
        message: readLandApiError(error, 'That did not go through.').message,
        variant: 'error',
      }),
  });

  if (!canView) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="You do not have access to land professionals"
        description="This needs the verifications review permission."
      />
    );
  }
  if (detail.isLoading) return <PageLoadingState />;
  const p = detail.data;
  if (!p) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="Professional not found"
        description="It may have been removed."
      />
    );
  }
  const actions = actionsFor(p);
  const decidedBy = [p.decidedByName, p.decidedAt && formatDate(p.decidedAt)]
    .filter(Boolean)
    .join(', ');
  const perf = p.performance;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/land/professionals"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Land professionals
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="type-title">{p.name}</h1>
        <Badge variant="info">{LAND_PROFESSIONAL_ROLE_LABELS[p.role]}</Badge>
        <Badge variant={LAND_PROFESSIONAL_STATUS_VARIANT[p.status]}>
          {LAND_PROFESSIONAL_STATUS_LABELS[p.status]}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <LandCaseSection title="Credential" icon={BadgeCheck}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Fact label="Email" value={p.email} />
              <Fact label="Regulator" value={p.regulator} />
              <Fact label="Licence number" value={p.licenceNumber} />
              <Fact
                label="Licence expires"
                value={p.licenceExpiresAt ? formatDate(p.licenceExpiresAt) : 'Not given'}
              />
              <Fact label="States covered" value={p.practiceStates.join(', ')} />
              <Fact
                label="Indemnity insurance"
                value={
                  p.insurer
                    ? `${p.insurer}${p.insuranceExpiresAt ? `, to ${formatDate(p.insuranceExpiresAt)}` : ''}`
                    : 'None given'
                }
              />
            </div>
            {p.credentialUrl ? (
              <a
                href={p.credentialUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <FileText className="h-4 w-4" aria-hidden /> Open uploaded credential
              </a>
            ) : (
              <div className="mt-4">
                <PanelMessage>No credential uploaded; ask for one before accrediting.</PanelMessage>
              </div>
            )}
            {p.credentialFileHash && (
              <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
                SHA-256 {p.credentialFileHash}
              </p>
            )}
          </LandCaseSection>

          <LandCaseSection title="Engagements" icon={BarChart3}>
            <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Fact label="Engaged" value={perf.engagements} />
              <Fact label="Reported" value={`${perf.completed} (${perf.onTime} on time)`} />
              <Fact label="Withdrawn" value={perf.revoked} />
              <Fact
                label="Audits"
                value={`${perf.audited} done, ${perf.auditFindings} findings, ${perf.auditFailures} failed`}
              />
            </div>
            {p.engagements.length === 0 ? (
              <PanelMessage>Not engaged on any case yet.</PanelMessage>
            ) : (
              <ul className="divide-y divide-border">
                {p.engagements.map((e) => (
                  <li
                    key={e.seatId}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                  >
                    <Link
                      href={`/admin/land/diligence/${encodeURIComponent(e.propertyId)}`}
                      className="min-w-0 text-sm text-foreground hover:underline"
                    >
                      {e.propertyTitle}
                      <span className="block text-xs text-muted-foreground">
                        {e.state}
                        {e.completedAt ? ` · reported ${formatDate(e.completedAt)}` : ''}
                        {e.dueAt && !e.completedAt ? ` · due ${formatDate(e.dueAt)}` : ''}
                      </span>
                    </Link>
                    <div className="flex gap-1.5">
                      {e.audit && (
                        <Badge
                          variant={
                            e.audit.outcome === 'FAIL'
                              ? 'danger'
                              : e.audit.outcome === 'FINDINGS'
                                ? 'warning'
                                : e.audit.outcome === 'PASS'
                                  ? 'success'
                                  : 'neutral'
                          }
                        >
                          audit {e.audit.outcome?.toLowerCase() ?? 'pending'}
                        </Badge>
                      )}
                      <Badge variant="neutral">{e.status.toLowerCase()}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </LandCaseSection>
        </div>

        <aside className="space-y-6">
          <LandCaseSection title="Decision" icon={Gavel}>
            <div className="space-y-3">
              {p.decisionNote && (
                <PanelMessage>
                  {p.decisionNote}
                  {decidedBy && ` (${decidedBy})`}
                </PanelMessage>
              )}
              {p.status === 'SUSPENDED' && (
                <PanelMessage>
                  Suspended{p.suspendedAt ? ` ${formatDate(p.suspendedAt)}` : ''}:{' '}
                  {p.suspendedReason}
                </PanelMessage>
              )}
              {p.appealReason && (
                <div className="rounded-xl border border-warning/40 bg-warning/5 p-3 text-sm">
                  <p className="font-medium text-foreground">
                    Appeal{p.appealedAt ? ` · ${formatDate(p.appealedAt)}` : ''}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-foreground">{p.appealReason}</p>
                </div>
              )}
              {actions.length > 0 &&
                (canDecide ? (
                  <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                    <Textarea
                      rows={4}
                      maxLength={2000}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      aria-label="Decision note"
                      placeholder={ACTION_COPY[actions[0]].placeholder}
                    />
                    <div className="flex flex-wrap gap-2">
                      {actions.map((action) => (
                        <Button
                          key={action}
                          variant={
                            action === 'reject' || action === 'suspend' ? 'danger' : 'primary'
                          }
                          disabled={note.trim().length < 5 || act.isPending}
                          isLoading={act.isPending && act.variables === action}
                          onClick={() => act.mutate(action)}
                        >
                          {ACTION_COPY[action].label}
                        </Button>
                      ))}
                    </div>
                  </form>
                ) : (
                  <PanelMessage>Deciding needs the verifications approve permission.</PanelMessage>
                ))}
            </div>
          </LandCaseSection>
        </aside>
      </div>
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
