'use client';

import { useQuery } from '@tanstack/react-query';
import { TriangleAlert } from 'lucide-react';
import { Badge, EmptyState } from '@getrentos/ui';
import { estateResidentService } from '@/services/estateResidentService';
import { unwrap } from '@/lib/apiHelpers';
import { estateResidentKeys } from '@/lib/queryKeys';
import type { Violation } from '@/types/estate';

const statusVariant: Record<Violation['status'], 'warning' | 'danger' | 'success' | 'neutral'> = {
  reported: 'warning',
  warning_issued: 'danger',
  resolved: 'success',
  dismissed: 'neutral',
};

const statusLabels: Record<Violation['status'], string> = {
  reported: 'Reported',
  warning_issued: 'Warning Issued',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

const categoryLabels: Record<Violation['category'], string> = {
  noise: 'Noise',
  unauthorized_parking: 'Unauthorized Parking',
  pet_violation: 'Pet Violation',
  property_maintenance: 'Property Maintenance',
  other: 'Other',
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(value)
  );

export default function ResidentViolationsPage() {
  const { data: violations, isLoading } = useQuery({
    queryKey: estateResidentKeys.violations,
    queryFn: () => unwrap(estateResidentService.listMyViolations()),
  });

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Violations</h1>
        <p className="text-muted-foreground mt-1">
          {violations?.length ?? 0} violations reported against your household
        </p>
      </div>

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : !violations || violations.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12">
          <EmptyState
            icon={TriangleAlert}
            title="No violations"
            description="Nothing has been reported against your household."
          />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {violations.map((violation) => (
            <div key={violation.id} className="p-4">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {categoryLabels[violation.category]}
                </p>
                <Badge variant={statusVariant[violation.status]}>
                  {statusLabels[violation.status]}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Reported {formatDate(violation.createdAt)}
              </p>
              <p className="text-sm text-foreground mt-2">{violation.description}</p>
              {violation.resolutionNotes && (
                <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">
                  {statusLabels[violation.status]}: {violation.resolutionNotes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
