'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Field,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Input,
  Select,
  useToast,
} from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';
import { adminMaintenanceService } from '@/services/adminMaintenanceService';
import type { AdminWorkOrder } from '@/types/maintenance';

export function AssignVendorDialog({
  order,
  onClose,
}: {
  order: AdminWorkOrder | null;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [vendorId, setVendorId] = useState(order?.assignedVendorId ?? '');
  const [reason, setReason] = useState('');
  const toast = useToast();
  const vendors = useQuery({
    queryKey: ['admin', 'maintenance', 'vendors', 'assignment'],
    queryFn: () => unwrap(adminMaintenanceService.listVendors({ page: 1, pageSize: 100 })),
    enabled: Boolean(order),
  });
  const mutation = useMutation({
    mutationFn: () =>
      unwrap(
        adminMaintenanceService.assignWorkOrder(order!.id, vendorId, reason.trim() || undefined)
      ),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['admin', 'maintenance'] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });
  const options = (vendors.data?.items ?? [])
    .filter((vendor) => vendor.isActive)
    .map((vendor) => ({
      value: vendor.id,
      label: `${vendor.name} · ${vendor.serviceType}`,
      searchText: `${vendor.name} ${vendor.serviceType} ${vendor.phone}`,
    }));

  return (
    <>
      <Dialog open={Boolean(order)} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="p-6">
          <DialogTitle className="font-semibold">Assign vendor</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Choose an active vendor for {order?.issueTitle}. Reassignment is recorded in the audit
            trail.
          </DialogDescription>
          <div className="mt-5 space-y-4">
            <Select
              value={vendorId}
              onValueChange={setVendorId}
              options={options}
              placeholder={vendors.isLoading ? 'Loading vendors…' : 'Select vendor'}
              ariaLabel="Vendor"
              searchPlaceholder="Search name, service or phone…"
              disabled={vendors.isLoading || vendors.isError}
            />
            {vendors.isError && (
              <Alert variant="danger">Vendors could not be loaded. Close and try again.</Alert>
            )}
            <Field label="Assignment note (optional)">
              <Input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Why this vendor is suitable"
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button
                onClick={() => mutation.mutate()}
                disabled={!vendorId}
                isLoading={mutation.isPending}
                loadingText="Assigning…"
              >
                Assign vendor
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
