'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, UserCheck, ChevronRight } from 'lucide-react';
import { Badge, Card } from '@getrentos/ui';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import type { RenterInspection } from '@/types/renter';
import { InspectionAcknowledgeModal } from './InspectionAcknowledgeModal';

const typeLabels: Record<RenterInspection['type'], string> = {
  move_in: 'Move-in',
  move_out: 'Move-out',
  periodic: 'Periodic',
  other: 'Inspection',
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(value)
  );

export function InspectionsSection() {
  const queryClient = useQueryClient();
  const [activeInspectionId, setActiveInspectionId] = useState<string | null>(null);

  const { data: inspections = [] } = useQuery({
    queryKey: renterKeys.inspections,
    queryFn: () => unwrap(renterService.listInspections()),
  });

  const acknowledge = useMutation({
    mutationFn: (id: string) => unwrap(renterService.acknowledgeInspection(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: renterKeys.inspections });
    },
  });

  if (inspections.length === 0) return null;

  const activeInspection = inspections.find((i) => i.id === activeInspectionId) || null;
  const pendingCount = inspections.filter((i) => !i.acknowledgedAt).length;

  return (
    <Card static hover={false}>
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-semibold text-foreground">Home inspections</h2>
            <p className="text-sm text-muted-foreground">
              {pendingCount > 0
                ? `${pendingCount} record${pendingCount === 1 ? '' : 's'} awaiting your review`
                : 'All records reviewed'}
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-border">
        {inspections.slice(0, 4).map((inspection) => (
          <button
            key={inspection.id}
            onClick={() => setActiveInspectionId(inspection.id)}
            className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-secondary/60 sm:px-6"
          >
            <span className="min-w-0 flex-1">
              <span className="truncate text-sm font-medium text-foreground">
                {typeLabels[inspection.type]} · {formatDate(inspection.scheduledDate)}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground truncate">
                {inspection.propertyAddress}
              </span>
            </span>
            {inspection.acknowledgedAt ? (
              <Badge variant="success" icon={<UserCheck className="h-3 w-3" />}>
                Reviewed
              </Badge>
            ) : (
              <Badge variant="warning">Needs review</Badge>
            )}
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>

      <InspectionAcknowledgeModal
        inspection={activeInspection}
        onClose={() => setActiveInspectionId(null)}
        onAcknowledge={(id) => acknowledge.mutate(id)}
        isAcknowledging={acknowledge.isPending}
      />
    </Card>
  );
}
