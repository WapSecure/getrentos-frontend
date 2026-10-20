'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { HardHat, Loader2, Star } from 'lucide-react';
import {
  Alert,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  ListSkeleton,
  Pagination,
} from '@getrentos/ui';
import { visitToIso, VisitTimeField } from '@/components/landlord/maintenance/VisitTimeField';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { landlordService } from '@/services/landlordService';
import type { LandlordMaintenanceRequest } from '@/types/landlord';

const PAGE_SIZE = 10;

interface AssignVendorModalProps {
  request: LandlordMaintenanceRequest | null;
  onClose: () => void;
  onAssign: (requestId: string, vendorId: string, scheduledFor?: string) => void;
  /** Shown under the list when assigning fails, e.g. the visit time was not acceptable. */
  error?: string | null;
  /** The vendor currently being assigned, if any, so the row shows in-flight feedback. */
  assigningVendorId?: string | null;
}

export const AssignVendorModal = ({
  request,
  onClose,
  onAssign,
  assigningVendorId = null,
  error = null,
}: AssignVendorModalProps) => {
  const [page, setPage] = useState(1);
  const [visit, setVisit] = useState('');
  const { data, isPending } = useQuery({
    queryKey: [
      ...landlordKeys.vendors,
      { page, pageSize: PAGE_SIZE, assignment: true, activeOnly: true },
    ],
    queryFn: () =>
      unwrap(landlordService.listVendors({ page, pageSize: PAGE_SIZE, activeOnly: true })),
    enabled: !!request,
    placeholderData: keepPreviousData,
  });
  const vendors = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <Dialog open={!!request} onOpenChange={(next) => !next && onClose()}>
      {request && (
        <DialogContent padded={false} className="flex flex-col">
          <div className="p-4 pr-12 border-b border-border flex justify-between items-center gap-3 shrink-0">
            <div className="min-w-0">
              <DialogTitle className="font-semibold text-foreground">Assign Vendor</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {request.issueTitle}
              </DialogDescription>
            </div>
          </div>

          <div className="p-4 space-y-2 overflow-y-auto flex-1">
            <VisitTimeField
              value={visit}
              onChange={setVisit}
              label="Visit date & time (optional)"
            />
            {error && <Alert variant="danger">{error}</Alert>}
            {isPending ? (
              <ListSkeleton rows={3} />
            ) : vendors.length === 0 ? (
              <EmptyState
                icon={HardHat}
                title="No active vendors"
                description="No active vendors in your directory. Add or reactivate one from the Vendors page."
                size="compact"
              />
            ) : (
              vendors.map((vendor) => {
                const isAssigning = assigningVendorId === vendor.id;
                return (
                  <button
                    key={vendor.id}
                    type="button"
                    aria-busy={isAssigning || undefined}
                    onClick={() => onAssign(request.id, vendor.id, visitToIso(visit))}
                    disabled={assigningVendorId !== null}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{vendor.name}</p>
                      <p className="text-xs text-muted-foreground">{vendor.serviceType}</p>
                    </div>
                    {isAssigning ? (
                      <Loader2
                        aria-label="Assigning"
                        className="w-3.5 h-3.5 animate-spin text-primary motion-reduce:animate-none"
                      />
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {vendor.ratingCount > 0 ? (
                          <>
                            <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                            {vendor.rating.toFixed(1)}
                            <span>({vendor.ratingCount})</span>
                          </>
                        ) : (
                          'No ratings yet'
                        )}
                      </div>
                    )}
                  </button>
                );
              })
            )}
            {total > 0 && (
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={total}
                onPageChange={setPage}
                className="pt-3"
              />
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};
