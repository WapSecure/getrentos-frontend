'use client';

import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Input,
  Select,
  Toast,
} from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';
import { adminMaintenanceService } from '@/services/adminMaintenanceService';
import type { AdminPreventivePlan, AdminSlaPolicy, AdminVendor } from '@/types/maintenance';

type Editable =
  | { kind: 'vendor'; value: AdminVendor }
  | { kind: 'sla'; value: AdminSlaPolicy }
  | { kind: 'plan'; value: AdminPreventivePlan };

export function MaintenanceEditorDialog({
  editor,
  onClose,
}: {
  editor: Editable | null;
  onClose: () => void;
}) {
  const value = editor?.value;
  const client = useQueryClient();
  const [reason, setReason] = useState('');
  const [name, setName] = useState(
    editor?.kind === 'vendor'
      ? editor.value.name
      : editor?.kind === 'plan'
        ? editor.value.title
        : ''
  );
  const [serviceType, setServiceType] = useState(
    editor?.kind === 'vendor' ? editor.value.serviceType : ''
  );
  const [phone, setPhone] = useState(editor?.kind === 'vendor' ? editor.value.phone : '');
  const [response, setResponse] = useState(
    editor?.kind === 'sla' ? String(editor.value.responseTargetMinutes) : ''
  );
  const [resolution, setResolution] = useState(
    editor?.kind === 'sla' ? String(editor.value.resolutionTargetMinutes) : ''
  );
  const [escalation, setEscalation] = useState(
    editor?.kind === 'sla' ? String(editor.value.escalationTargetMinutes) : ''
  );
  const [frequency, setFrequency] = useState(
    editor?.kind === 'plan' ? String(editor.value.frequencyDays) : ''
  );
  const [nextDueAt, setNextDueAt] = useState(
    editor?.kind === 'plan' ? editor.value.nextDueAt.slice(0, 10) : ''
  );
  const [vendorId, setVendorId] = useState(
    editor?.kind === 'plan' ? (editor.value.assignedVendorId ?? '') : ''
  );
  const [error, setError] = useState<string | null>(null);
  const vendors = useQuery({
    queryKey: ['admin', 'maintenance', 'vendors', 'editor'],
    queryFn: () => unwrap(adminMaintenanceService.listVendors({ page: 1, pageSize: 100 })),
    enabled: editor?.kind === 'plan',
  });
  const mutation = useMutation({
    mutationFn: async () => {
      if (!editor) return;
      if (reason.trim().length < 10)
        throw new Error('Provide an administrative reason of at least 10 characters.');
      if (editor.kind === 'vendor')
        return unwrap(
          adminMaintenanceService.updateVendor(editor.value.id, {
            name: name.trim(),
            serviceType: serviceType.trim(),
            phone: phone.trim(),
            reason: reason.trim(),
          })
        );
      if (editor.kind === 'sla')
        return unwrap(
          adminMaintenanceService.updateSlaPolicy(editor.value.id, {
            responseTargetMinutes: Number(response),
            resolutionTargetMinutes: Number(resolution),
            escalationTargetMinutes: Number(escalation),
            reason: reason.trim(),
          })
        );
      return unwrap(
        adminMaintenanceService.updatePreventivePlan(editor.value.id, {
          title: name.trim(),
          frequencyDays: Number(frequency),
          nextDueAt: new Date(`${nextDueAt}T12:00:00.000Z`).toISOString(),
          ...(vendorId ? { assignedVendorId: vendorId } : {}),
          reason: reason.trim(),
        })
      );
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['admin', 'maintenance'] });
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });
  const vendorOptions = (vendors.data?.items ?? [])
    .filter((vendor) => vendor.isActive)
    .map((vendor) => ({
      value: vendor.id,
      label: `${vendor.name} · ${vendor.serviceType}`,
      searchText: `${vendor.name} ${vendor.serviceType} ${vendor.phone}`,
    }));
  const title =
    editor?.kind === 'vendor'
      ? 'Edit vendor'
      : editor?.kind === 'sla'
        ? 'Edit SLA targets'
        : 'Edit preventive plan';

  return (
    <>
      <Dialog open={Boolean(editor)} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogTitle className="font-semibold">{title}</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Changes apply platform-wide and are written to the audit trail.
          </DialogDescription>
          <div className="mt-5 space-y-4">
            {editor?.kind === 'vendor' && (
              <>
                <Field label="Vendor name">
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label="Service type">
                  <Input value={serviceType} onChange={(e) => setServiceType(e.target.value)} />
                </Field>
                <Field label="Phone">
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </Field>
              </>
            )}
            {editor?.kind === 'sla' && (
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Response (minutes)">
                  <Input
                    type="number"
                    min={1}
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                  />
                </Field>
                <Field label="Resolution (minutes)">
                  <Input
                    type="number"
                    min={1}
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                  />
                </Field>
                <Field label="Escalation (minutes)">
                  <Input
                    type="number"
                    min={1}
                    value={escalation}
                    onChange={(e) => setEscalation(e.target.value)}
                  />
                </Field>
              </div>
            )}
            {editor?.kind === 'plan' && (
              <>
                <Field label="Plan title">
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Frequency (days)">
                    <Input
                      type="number"
                      min={1}
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                    />
                  </Field>
                  <Field label="Next service date">
                    <Input
                      type="date"
                      value={nextDueAt}
                      onChange={(e) => setNextDueAt(e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="Assigned vendor">
                  <Select
                    value={vendorId}
                    onValueChange={setVendorId}
                    options={vendorOptions}
                    placeholder="Select an active vendor"
                    ariaLabel="Assigned vendor"
                  />
                </Field>
              </>
            )}
            <Field label="Administrative reason">
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="At least 10 characters"
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button onClick={() => mutation.mutate()} disabled={!value || mutation.isPending}>
                {mutation.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {error && <Toast message={error} variant="error" onClose={() => setError(null)} />}
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
