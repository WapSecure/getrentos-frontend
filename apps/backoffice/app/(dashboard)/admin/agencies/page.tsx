'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Briefcase, FileText, BadgeCheck } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
  useToast,
  PageHeader,
} from '@getrentos/ui';
import { formatDate, unwrap } from '@getrentos/shared';
import { useAdminUser } from '../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import { adminAgencyService, type AdminAgency } from '@/services/adminAgencyService';

type Filter = 'SUBMITTED' | 'PENDING' | 'ALL';

const STATUS_BADGE: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }
> = {
  ACTIVE: { label: 'Verified', variant: 'success' },
  PENDING_KYB: { label: 'Pending verification', variant: 'warning' },
  SUSPENDED: { label: 'Suspended', variant: 'danger' },
  RESTRICTED: { label: 'Restricted', variant: 'warning' },
  OFFBOARDING: { label: 'Offboarding', variant: 'neutral' },
  CLOSED: { label: 'Closed', variant: 'neutral' },
};

const TYPE_LABEL = {
  BUSINESS_NAME: 'Business name',
  LIMITED_COMPANY: 'Limited company',
  INCORPORATED_TRUSTEES: 'Incorporated trustees',
} as const;

/**
 * Property management firms' business verification (KYB). A firm can set up
 * while pending, but cannot receive payouts or appear to owners until approved.
 * The reviewer checks the CAC certificate against the registered name and number.
 */
export default function AdminAgenciesPage() {
  const queryClient = useQueryClient();
  const user = useAdminUser();
  const canDecide = hasAdminPermission(user?.roles, 'verifications.approve');
  const [filter, setFilter] = useState<Filter>('SUBMITTED');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const toast = useToast();
  const [pendingAction, setPendingAction] = useState<{
    agency: AdminAgency;
    action: 'APPROVE' | 'REJECT' | 'SUSPENDED' | 'ACTIVE';
  } | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'agencies', filter],
    queryFn: () => unwrap(adminAgencyService.list(filter)),
    placeholderData: keepPreviousData,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'agencies'] });
  const onError = (e: Error) => toast.error(e.message || 'Something went wrong.');

  const decide = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'APPROVE' | 'REJECT' }) =>
      unwrap(adminAgencyService.decide(id, decision, notes[id]?.trim() || undefined)),
    onSuccess: (_r, { id, decision }) => {
      setPendingAction(null);
      setNotes((n) => ({ ...n, [id]: '' }));
      refresh();
      toast.success(decision === 'APPROVE' ? 'Firm verified.' : 'Sent back to the firm.');
    },
    onError,
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'SUSPENDED' | 'ACTIVE' }) =>
      unwrap(adminAgencyService.setStatus(id, status, notes[id]?.trim() ?? '')),
    onSuccess: (_r, { id, status }) => {
      setPendingAction(null);
      setNotes((n) => ({ ...n, [id]: '' }));
      refresh();
      toast.success(status === 'SUSPENDED' ? 'Firm suspended.' : 'Firm restored.');
    },
    onError,
  });

  const openCertificate = async (id: string) => {
    try {
      const { url } = await unwrap(adminAgencyService.certificate(id));
      window.open(url, '_blank', 'noopener');
    } catch (e) {
      onError(e as Error);
    }
  };

  const items = query.data ?? [];
  const actionPending = decide.isPending || setStatus.isPending;

  return (
    <>
      <PageHeader
        title="Agencies"
        description="Verify property management firms’ CAC registration. Pending firms can set up, but cannot receive payouts or appear to owners until verified."
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList className="mb-4">
          <TabsTrigger value="SUBMITTED">To review</TabsTrigger>
          <TabsTrigger value="PENDING">Not yet submitted</TabsTrigger>
          <TabsTrigger value="ALL">All firms</TabsTrigger>
        </TabsList>
      </Tabs>

      {query.isLoading ? (
        <ListSkeleton variant="cards" />
      ) : query.isError && !query.data ? (
        <PageErrorState
          title="Could not load agencies"
          description={(query.error as Error).message}
          onRetry={() => query.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={filter === 'SUBMITTED' ? 'Nothing to review' : 'No firms here'}
          description={
            filter === 'SUBMITTED'
              ? 'Firms appear here when they submit their CAC certificate.'
              : 'No property management firms match this view.'
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((a: AdminAgency) => {
            const badge = STATUS_BADGE[a.status] ?? STATUS_BADGE.PENDING_KYB;
            const p = a.profile;
            const note = notes[a.organizationId] ?? '';
            const reviewable = p?.kybStatus === 'SUBMITTED';
            return (
              <Card key={a.organizationId} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{a.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.ownerName}
                      {a.ownerEmail ? ` · ${a.ownerEmail}` : ''} · joined {formatDate(a.createdAt)}{' '}
                      · team {a.teamSize} · {a.activeEngagements} active engagement
                      {a.activeEngagements === 1 ? '' : 's'}
                    </p>
                  </div>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>

                {reviewable && !a.kybChecks.clean ? (
                  <Alert
                    variant="warning"
                    title="Needs a reason and a second officer to verify"
                    className="mt-4"
                  >
                    <ul className="list-disc space-y-0.5 pl-4">
                      {kybCheckProblems(a.kybChecks).map((problem) => (
                        <li key={problem}>{problem}</li>
                      ))}
                    </ul>
                  </Alert>
                ) : null}

                {p ? (
                  <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    <Row label="Registered name" value={p.registeredName} />
                    <Row
                      label="CAC number"
                      value={`${p.registrationNumber} · ${TYPE_LABEL[p.businessType]}`}
                    />
                    {p.verifiedLegalName ? (
                      <div className="sm:col-span-2 flex items-start gap-1.5">
                        <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        <p className="text-sm text-foreground">
                          CAC-verified: <span className="font-medium">{p.verifiedLegalName}</span>
                          {p.cacVerifiedAt ? (
                            <span className="text-muted-foreground">
                              {' '}
                              · {formatDate(p.cacVerifiedAt)}
                            </span>
                          ) : null}
                        </p>
                      </div>
                    ) : (
                      <p className="sm:col-span-2 text-xs text-muted-foreground">
                        Name not auto-verified against CAC (verify the certificate manually).
                      </p>
                    )}
                    <Row label="Address" value={`${p.registeredAddress}, ${p.state}`} />
                    <Row label="Contact" value={`${p.contactEmail} · ${p.contactPhone}`} />
                    <div className="sm:col-span-2">
                      {p.certificateFileName ? (
                        <Button
                          variant="link"
                          onClick={() => openCertificate(a.organizationId)}
                          className="gap-1.5 font-normal"
                        >
                          <FileText className="h-4 w-4" /> {p.certificateFileName}
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No certificate uploaded
                        </span>
                      )}
                    </div>
                    {p.kybDecisionNote && (
                      <p className="text-xs text-muted-foreground sm:col-span-2">
                        Last decision note: {p.kybDecisionNote}
                      </p>
                    )}
                  </dl>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    No registration details on file (created before verification existed).
                  </p>
                )}

                {canDecide && (reviewable || a.status === 'ACTIVE' || a.status === 'SUSPENDED') && (
                  <div className="mt-4 space-y-2 border-t border-border pt-4">
                    <Textarea
                      value={note}
                      onChange={(e) =>
                        setNotes((n) => ({ ...n, [a.organizationId]: e.target.value }))
                      }
                      placeholder={
                        reviewable
                          ? a.kybChecks.clean
                            ? 'Note to the firm (required to send back), e.g. RC number does not match the certificate'
                            : 'Why this firm can still be verified (required), e.g. board letter authorising the submitter'
                          : 'Reason (required)'
                      }
                      className="min-h-[64px]"
                      aria-label={`Note for ${a.name}`}
                    />
                    <div className="flex flex-wrap gap-2">
                      {reviewable && (
                        <>
                          <Button
                            onClick={() => setPendingAction({ agency: a, action: 'APPROVE' })}
                            disabled={
                              actionPending || (!a.kybChecks.clean && note.trim().length < 10)
                            }
                          >
                            Verify firm
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setPendingAction({ agency: a, action: 'REJECT' })}
                            disabled={actionPending || note.trim().length < 10}
                          >
                            Send back
                          </Button>
                        </>
                      )}
                      {a.status === 'ACTIVE' && (
                        <Button
                          variant="outline"
                          onClick={() => setPendingAction({ agency: a, action: 'SUSPENDED' })}
                          disabled={actionPending || note.trim().length < 10}
                        >
                          Suspend
                        </Button>
                      )}
                      {a.status === 'SUSPENDED' && (
                        <Button
                          variant="outline"
                          onClick={() => setPendingAction({ agency: a, action: 'ACTIVE' })}
                          disabled={actionPending || note.trim().length < 10}
                        >
                          Restore
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && !actionPending && setPendingAction(null)}
        title={
          pendingAction?.action === 'APPROVE'
            ? 'Verify this firm?'
            : pendingAction?.action === 'REJECT'
              ? 'Send this verification back?'
              : pendingAction?.action === 'SUSPENDED'
                ? 'Suspend this firm?'
                : 'Restore this firm?'
        }
        description={
          pendingAction
            ? `${pendingAction.agency.name} will be ${
                pendingAction.action === 'APPROVE'
                  ? 'verified and allowed to receive payouts and appear to owners'
                  : pendingAction.action === 'REJECT'
                    ? 'returned for corrected registration information'
                    : pendingAction.action === 'SUSPENDED'
                      ? 'suspended from active platform operations'
                      : 'restored to active platform operations'
              }. The decision and note are recorded in the audit trail.`
            : ''
        }
        confirmLabel={
          pendingAction?.action === 'APPROVE'
            ? 'Verify firm'
            : pendingAction?.action === 'REJECT'
              ? 'Send back'
              : pendingAction?.action === 'SUSPENDED'
                ? 'Suspend firm'
                : 'Restore firm'
        }
        isLoading={actionPending}
        onConfirm={() => {
          if (!pendingAction) return;
          if (pendingAction.action === 'APPROVE' || pendingAction.action === 'REJECT') {
            decide.mutate({
              id: pendingAction.agency.organizationId,
              decision: pendingAction.action,
            });
          } else {
            setStatus.mutate({
              id: pendingAction.agency.organizationId,
              status: pendingAction.action,
            });
          }
        }}
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}

/** Plain-language reasons a firm's checks are not clean (security gap ID-14). */
function kybCheckProblems(checks: AdminAgency['kybChecks']): string[] {
  const problems: string[] = [];
  if (!checks.registryConfirmed)
    problems.push('The CAC registry did not confirm this registration number.');
  if (checks.registryNameMatches === false)
    problems.push('The registered name at CAC differs from the name the firm gave.');
  if (checks.directorCheck === 'NOT_A_DIRECTOR')
    problems.push('The person who applied is not a listed director of this company.');
  if (checks.directorCheck === 'NOT_CHECKED' && checks.registryConfirmed)
    problems.push(
      'The applicant’s identity is not verified, so we could not match them to a director.'
    );
  return problems;
}
