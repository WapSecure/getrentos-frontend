'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CircleAlert, MapPin, RefreshCw, UserRound } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardSkeleton,
  EmptyState,
  Skeleton,
  useToast,
} from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';
import { useAdminUser } from '../../../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import { landQueryKeys, readLandApiError } from '@/lib/landDiligence';
import { adminLandService } from '@/services/adminLandService';
import { LandDiligenceStatusBadge } from '@/components/admin/land/LandDiligenceStatusBadge';
import {
  LandApprovalBanner,
  LandStaleCaseBanner,
} from '@/components/admin/land/case/LandApprovalBanner';
import { LandAssignmentCard } from '@/components/admin/land/case/LandAssignmentCard';
import { LandConflictsPanel } from '@/components/admin/land/case/LandConflictsPanel';
import { LandDecisionBar } from '@/components/admin/land/case/LandDecisionBar';
import { LandEncumbrancesPanel } from '@/components/admin/land/case/LandEncumbrancesPanel';
import { LandEvidenceSection } from '@/components/admin/land/case/LandEvidenceSection';
import { LandParcelFacts } from '@/components/admin/land/case/LandParcelFacts';
import { LandBoundaryVersionsPanel } from '@/components/admin/land/case/LandBoundaryVersionsPanel';
import { LandReviewersPanel } from '@/components/admin/land/case/LandReviewersPanel';
import { LandRiskPanel } from '@/components/admin/land/case/LandRiskPanel';
import { LandTitleHistoryPanel } from '@/components/admin/land/case/LandTitleHistoryPanel';

/**
 * One land diligence case in full: the parcel, what blocks approval, the
 * checklist and its evidence, integrity registers, outside reviewers, risk,
 * and the decision. Every decision carries the case version; when the API
 * says the case moved on (409) the page asks for a reload before anything else.
 */
export default function AdminLandDiligenceCasePage() {
  const params = useParams<{ propertyId: string }>();
  const propertyId = decodeURIComponent(params.propertyId);
  const user = useAdminUser();
  const canReview = hasAdminPermission(user?.roles, 'verifications.review');
  const canApprove = hasAdminPermission(user?.roles, 'verifications.approve');
  const canSearchUsers = hasAdminPermission(user?.roles, 'users.view');
  const toast = useToast();
  const [stale, setStale] = useState(false);

  const detailQuery = useQuery({
    queryKey: landQueryKeys.case(propertyId),
    queryFn: () => unwrap(adminLandService.getDiligenceDetail(propertyId)),
    enabled: Boolean(propertyId),
  });
  const detail = detailQuery.data;

  const onSuccess = useCallback((message: string) => toast.success(message), [toast]);
  const refetchDetail = detailQuery.refetch;
  const onError = useCallback(
    (error: unknown, fallback: string, options?: { versioned?: boolean }) => {
      const info = readLandApiError(error, fallback);
      const isStale = Boolean(options?.versioned) && info.stale;
      if (isStale) setStale(true);
      // A refused decision usually means the blockers moved: show them as they are now.
      if (options?.versioned && (info.status === 400 || info.status === 403)) {
        void refetchDetail();
      }
      toast.error(
        isStale
          ? 'This case changed since you loaded it. Reload it and review again before deciding.'
          : info.blockers.length
            ? `${info.message}: ${info.blockers.join('; ')}`
            : info.message
      );
    },
    [refetchDetail, toast]
  );

  const reload = async () => {
    await refetchDetail();
    setStale(false);
  };

  const resolveDocumentUrl = async (documentId: string) => {
    const refreshed = await refetchDetail();
    return refreshed.data?.documents.find((document) => document.id === documentId)?.url ?? null;
  };

  if (detailQuery.isLoading) return <CaseSkeleton />;

  if (!detail) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="This case could not be loaded"
        description={
          detailQuery.error instanceof Error
            ? detailQuery.error.message
            : 'The land diligence case was not found.'
        }
        action={
          <div className="flex gap-2">
            <Button
              href="/admin/land/diligence"
              variant="ghost"
              icon={<ArrowLeft className="h-4 w-4" />}
            >
              Back to queue
            </Button>
            <Button
              variant="outline"
              onClick={() => detailQuery.refetch()}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Try again
            </Button>
          </div>
        }
      />
    );
  }

  const panelProps = { propertyId, canReview, canApprove, onError, onSuccess };
  const location = [detail.city, detail.state].filter(Boolean).join(', ');

  return (
    <>
      <Link
        href="/admin/land/diligence"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Diligence queue
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="type-title">{detail.propertyTitle}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {detail.ownerName && (
              <span className="flex items-center gap-1.5">
                <UserRound className="h-3.5 w-3.5" /> {detail.ownerName}
              </span>
            )}
            {location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {location}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LandDiligenceStatusBadge status={detail.diligence.status} />
          <Button
            variant="outline"
            size="sm"
            onClick={reload}
            isLoading={detailQuery.isFetching}
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Reload
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        {stale && <LandStaleCaseBanner onReload={reload} isReloading={detailQuery.isFetching} />}
        <LandApprovalBanner detail={detail} currentUserName={user?.fullName} />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-5">
            <LandParcelFacts detail={detail} />
            <LandBoundaryVersionsPanel propertyId={propertyId} />
            <LandEvidenceSection
              {...panelProps}
              detail={detail}
              onResolveUrl={resolveDocumentUrl}
            />
            <LandConflictsPanel {...panelProps} />
            <LandEncumbrancesPanel {...panelProps} documents={detail.documents} />
            <LandTitleHistoryPanel {...panelProps} documents={detail.documents} />
          </div>
          <div className="min-w-0 space-y-5">
            <LandAssignmentCard {...panelProps} detail={detail} canSearchUsers={canSearchUsers} />
            <LandRiskPanel {...panelProps} />
            <LandReviewersPanel
              {...panelProps}
              checks={detail.diligence.checks ?? []}
              canSearchUsers={canSearchUsers}
            />
            {detail.diligence.findings && (
              <Card>
                <CardContent className="text-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Findings on record
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-foreground">
                    {detail.diligence.findings}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <LandDecisionBar
          key={`${detail.diligence.version ?? 0}`}
          {...panelProps}
          detail={detail}
          currentUserName={user?.fullName}
          stale={stale}
        />
      </div>
    </>
  );
}

function CaseSkeleton() {
  return (
    <div role="status" aria-label="Loading case" className="space-y-5">
      <Skeleton className="h-4 w-32" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-72 max-w-full" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-5">
          <CardSkeleton lines={4} />
          <CardSkeleton lines={6} />
        </div>
        <div className="min-w-0 space-y-5">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}
