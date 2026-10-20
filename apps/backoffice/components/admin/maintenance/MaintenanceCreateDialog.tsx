'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  DatePicker,
  Field,
  NumberInput,
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

export type CreateKind = 'vendor' | 'sla' | 'plan';

export function MaintenanceCreateDialog({
  kind,
  open,
  onClose,
}: {
  kind: CreateKind;
  open: boolean;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({
    priority: 'MEDIUM',
    category: 'OTHER',
    emergency: 'false',
  });
  const toast = useToast();
  const options = useQuery({
    queryKey: ['admin', 'maintenance', 'configuration-options'],
    queryFn: () => unwrap(adminMaintenanceService.configurationOptions()),
    enabled: open,
  });
  const property = options.data?.properties.find((item) => item.id === form.propertyId);
  const set = (key: string) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const mutation = useMutation({
    mutationFn: async () => {
      if (kind === 'vendor')
        return unwrap(
          adminMaintenanceService.createVendor({
            landlordId: form.landlordId,
            name: form.name?.trim(),
            serviceType: form.serviceType?.trim(),
            phone: form.phone?.trim(),
          })
        );
      if (kind === 'sla')
        return unwrap(
          adminMaintenanceService.createSlaPolicy({
            propertyId: form.propertyId,
            priority: form.priority,
            responseTargetMinutes: Number(form.response),
            resolutionTargetMinutes: Number(form.resolution),
            escalationTargetMinutes: Number(form.escalation),
            emergencyRoutingEnabled: form.emergency === 'true',
          })
        );
      return unwrap(
        adminMaintenanceService.createPreventivePlan({
          propertyId: form.propertyId,
          ...(form.unitId ? { unitId: form.unitId } : {}),
          ...(form.assetId ? { assetId: form.assetId } : {}),
          ...(form.vendorId ? { assignedVendorId: form.vendorId } : {}),
          title: form.name?.trim(),
          category: form.category,
          frequencyDays: Number(form.frequency),
          nextDueAt: new Date(`${form.nextDueAt}T12:00:00.000Z`).toISOString(),
        })
      );
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['admin', 'maintenance'] });
      setForm({ priority: 'MEDIUM', category: 'OTHER', emergency: 'false' });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });
  const propertyOptions = useMemo(
    () =>
      (options.data?.properties ?? []).map((item) => ({
        value: item.id,
        label: `${item.title} · ${item.city}, ${item.state}`,
        searchText: `${item.title} ${item.city} ${item.state}`,
      })),
    [options.data]
  );
  const title =
    kind === 'vendor'
      ? 'Add vendor'
      : kind === 'sla'
        ? 'Create SLA policy'
        : 'Create preventive plan';

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
        <DialogContent className="p-6">
          <DialogTitle className="font-semibold">{title}</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Select linked records using searchable fields. The new configuration becomes visible
            immediately.
          </DialogDescription>
          <div className="mt-5 max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            {kind === 'vendor' && (
              <>
                <Field label="Landlord">
                  <Select
                    value={form.landlordId}
                    onValueChange={set('landlordId')}
                    options={(options.data?.landlords ?? []).map((item) => ({
                      value: item.id,
                      label: `${item.legalName} · ${item.email}`,
                      searchText: `${item.legalName} ${item.email}`,
                    }))}
                    placeholder="Select landlord"
                    ariaLabel="Landlord"
                  />
                </Field>
                <Field label="Vendor name">
                  <Input value={form.name ?? ''} onChange={(e) => set('name')(e.target.value)} />
                </Field>
                <Field label="Service type">
                  <Input
                    value={form.serviceType ?? ''}
                    onChange={(e) => set('serviceType')(e.target.value)}
                  />
                </Field>
                <Field label="Phone">
                  <Input value={form.phone ?? ''} onChange={(e) => set('phone')(e.target.value)} />
                </Field>
              </>
            )}
            {kind !== 'vendor' && (
              <Field label="Property">
                <Select
                  value={form.propertyId}
                  onValueChange={(value) => {
                    setForm((current) => ({
                      ...current,
                      propertyId: value,
                      unitId: '',
                      assetId: '',
                    }));
                  }}
                  options={propertyOptions}
                  placeholder="Select property"
                  ariaLabel="Property"
                />
              </Field>
            )}
            {kind === 'sla' && (
              <>
                <Field label="Priority">
                  <Select
                    value={form.priority}
                    onValueChange={set('priority')}
                    options={['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((value) => ({
                      value,
                      label: value,
                    }))}
                    ariaLabel="Priority"
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Response minutes">
                    <NumberInput value={form.response ?? ''} onValueChange={set('response')} />
                  </Field>
                  <Field label="Resolution minutes">
                    <NumberInput value={form.resolution ?? ''} onValueChange={set('resolution')} />
                  </Field>
                  <Field label="Escalation minutes">
                    <NumberInput value={form.escalation ?? ''} onValueChange={set('escalation')} />
                  </Field>
                </div>
                <Field label="Emergency routing">
                  <Select
                    value={form.emergency}
                    onValueChange={set('emergency')}
                    options={[
                      { value: 'false', label: 'Disabled' },
                      { value: 'true', label: 'Enabled' },
                    ]}
                    ariaLabel="Emergency routing"
                  />
                </Field>
              </>
            )}
            {kind === 'plan' && (
              <>
                <Field label="Plan title">
                  <Input value={form.name ?? ''} onChange={(e) => set('name')(e.target.value)} />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Category">
                    <Select
                      value={form.category}
                      onValueChange={set('category')}
                      options={[
                        'PLUMBING',
                        'ELECTRICAL',
                        'INTERNET',
                        'SECURITY',
                        'APPLIANCES',
                        'OTHER',
                      ].map((value) => ({ value, label: value }))}
                      ariaLabel="Category"
                    />
                  </Field>
                  <Field label="Frequency days">
                    <NumberInput value={form.frequency ?? ''} onValueChange={set('frequency')} />
                  </Field>
                </div>
                <Field label="Next service date">
                  <DatePicker value={form.nextDueAt ?? ''} onChange={set('nextDueAt')} />
                </Field>
                <Field label="Unit (optional)">
                  <Select
                    value={form.unitId}
                    onValueChange={set('unitId')}
                    options={(property?.units ?? []).map((item) => ({
                      value: item.id,
                      label: item.unitName,
                    }))}
                    placeholder="No specific unit"
                    ariaLabel="Unit"
                  />
                </Field>
                <Field label="Asset (optional)">
                  <Select
                    value={form.assetId}
                    onValueChange={set('assetId')}
                    options={(property?.homeAssets ?? []).map((item) => ({
                      value: item.id,
                      label: item.name,
                    }))}
                    placeholder="No specific asset"
                    ariaLabel="Asset"
                  />
                </Field>
                <Field label="Vendor (optional)">
                  <Select
                    value={form.vendorId}
                    onValueChange={set('vendorId')}
                    options={(options.data?.vendors ?? []).map((item) => ({
                      value: item.id,
                      label: `${item.name} · ${item.serviceType}`,
                      searchText: `${item.name} ${item.serviceType} ${item.phone}`,
                    }))}
                    placeholder="Unassigned"
                    ariaLabel="Vendor"
                  />
                </Field>
              </>
            )}
            {options.isError && (
              <Alert variant="danger">Configuration options could not be loaded.</Alert>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button
                onClick={() => mutation.mutate()}
                disabled={options.isLoading || options.isError}
                isLoading={mutation.isPending}
                loadingText="Creating…"
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
