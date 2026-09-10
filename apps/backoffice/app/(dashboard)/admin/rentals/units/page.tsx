'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Search } from 'lucide-react';
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  LegacyInput,
  PageErrorState,
  Pagination,
  Select,
  Toast,
} from '@getrentos/ui';
import { ApiError, unwrap } from '@getrentos/shared';
import type { ApiResponse } from '@getrentos/shared';
import { adminRentalService } from '@/services/adminRentalService';
import type { AdminRentalUnit, UnitOccupancyStatus } from '@/types/rental';

const PAGE_SIZE = 20;
type Editor =
  | { kind: 'assign'; unit: AdminRentalUnit; value: string }
  | { kind: 'pricing'; value: string }
  | { kind: 'charge'; amount: string; dueDate: string; category: string; billingCycle: string };
type OperationResult =
  | void
  | { requestedCount: number; updatedCount: number }
  | { requestedCount: number; createdCount: number; skippedUnitIds: string[] };

export default function AdminRentalUnitsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | UnitOccupancyStatus>('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [removeUnit, setRemoveUnit] = useState<AdminRentalUnit | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'rentals', 'units', { search, status, page }],
    queryFn: () => unwrap(adminRentalService.listUnits({
      search: search.trim() || undefined,
      occupancyStatus: status === 'all' ? undefined : status,
      page,
      pageSize: PAGE_SIZE,
    })),
  });
  const items = useMemo(() => query.data?.items ?? [], [query.data?.items]);
  const selectedItems = useMemo(() => items.filter((item) => selected.includes(item.id)), [items, selected]);
  const mutation = useMutation({
    mutationFn: async (action: () => Promise<ApiResponse<OperationResult>>) => unwrap(action()),
    onSuccess: async () => {
      setEditor(null);
      setRemoveUnit(null);
      setSelected([]);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'rentals', 'units'] });
    },
    onError: (error) => setToast({
      message: error instanceof ApiError ? error.message : 'The unit operation could not be completed.',
      variant: 'error',
    }),
  });

  const runEditor = () => {
    if (!editor) return;
    if (editor.kind === 'assign') {
      const name = editor.value.trim();
      if (name.length < 2) return setToast({ message: 'Enter the tenant’s full name.', variant: 'error' });
      mutation.mutate(() => adminRentalService.assignUnitTenant(editor.unit.id, name), {
        onSuccess: () => setToast({ message: 'Tenant assigned and audit trail recorded.', variant: 'success' }),
      });
      return;
    }
    if (selected.length === 0) return;
    if (editor.kind === 'pricing') {
      const amount = Number(editor.value);
      if (!Number.isInteger(amount) || amount < 1) return setToast({ message: 'Enter a valid monthly rent.', variant: 'error' });
      mutation.mutate(() => adminRentalService.bulkUnitPricing(selected, amount), {
        onSuccess: (value) => {
          const result = value as { requestedCount: number; updatedCount: number };
          setToast({ message: `${result.updatedCount} unit price${result.updatedCount === 1 ? '' : 's'} updated.`, variant: 'success' });
        },
      });
      return;
    }
    const amount = Number(editor.amount);
    if (!Number.isInteger(amount) || amount < 1 || !editor.dueDate) return setToast({ message: 'Enter a valid amount and due date.', variant: 'error' });
    mutation.mutate(() => adminRentalService.bulkUnitCharges({ unitIds: selected, amount, dueDate: editor.dueDate, category: editor.category, billingCycle: editor.billingCycle }), {
      onSuccess: (value) => {
        const result = value as { requestedCount: number; createdCount: number; skippedUnitIds: string[] };
        setToast({
          message: `${result.createdCount} charge${result.createdCount === 1 ? '' : 's'} created${result.skippedUnitIds.length ? `; ${result.skippedUnitIds.length} unit(s) skipped because no signed lease exists` : ''}.`,
          variant: 'success',
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Units & tenants</h1>
        <p className="mt-1 text-sm text-muted-foreground">Oversee occupancy, tenant assignments, pricing and lease-backed charges across every landlord.</p>
      </div>
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <div className="relative min-w-[220px] flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <LegacyInput value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search unit, tenant, property or owner…" className="w-full pl-9" />
          </div>
          <Select
            value={status}
            ariaLabel="Filter units by occupancy"
            onValueChange={(value) => { setStatus(value as typeof status); setPage(1); }}
            options={[
              { value: 'all', label: 'All occupancy states' },
              { value: 'VACANT', label: 'Vacant' },
              { value: 'OCCUPIED', label: 'Occupied' },
              { value: 'NOTICE_GIVEN', label: 'Notice given' },
            ]}
          />
          <Button variant="outline" disabled={!selected.length || mutation.isPending} onClick={() => setEditor({ kind: 'pricing', value: '' })}>Bulk pricing</Button>
          <Button disabled={!selected.length || mutation.isPending} onClick={() => setEditor({ kind: 'charge', amount: '', dueDate: '', category: 'RENT', billingCycle: 'MONTHLY' })}>Bulk charge</Button>
        </div>
        {selected.length > 0 && <p className="border-b bg-secondary/30 px-4 py-2 text-sm" aria-live="polite">{selected.length} selected · {selectedItems.filter((item) => item.activeLease).length} have signed leases</p>}
        {query.isError ? (
          <PageErrorState title="Could not load units" description="No unit data is being estimated." onRetry={() => void query.refetch()} isRetrying={query.isFetching} className="min-h-[240px] border-0" />
        ) : query.isLoading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded-lg bg-secondary" />)}</div>
        ) : items.length === 0 ? (
          <EmptyState icon={Building2} title="No units found" description="Try another search or occupancy filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-secondary/40 text-left text-muted-foreground"><tr>
                <th className="p-3"><input type="checkbox" aria-label="Select all units on this page" checked={items.every((item) => selected.includes(item.id))} onChange={(event) => setSelected(event.target.checked ? items.map((item) => item.id) : [])} /></th>
                <th className="p-3">Unit</th><th className="p-3">Owner</th><th className="p-3">Tenant</th><th className="p-3">Rent</th><th className="p-3">Lease / charges</th><th className="p-3 text-right">Actions</th>
              </tr></thead>
              <tbody className="divide-y">
                {items.map((unit) => <tr key={unit.id}>
                  <td className="p-3"><input type="checkbox" aria-label={`Select ${unit.unitName}`} checked={selected.includes(unit.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...new Set([...current, unit.id])] : current.filter((id) => id !== unit.id))} /></td>
                  <td className="p-3"><p className="font-medium">{unit.unitName}</p><p className="text-xs text-muted-foreground">{unit.propertyTitle}</p></td>
                  <td className="p-3">{unit.ownerName}</td>
                  <td className="p-3"><p>{unit.tenantName ?? 'Unassigned'}</p><Badge variant={unit.occupancyStatus === 'VACANT' ? 'neutral' : unit.occupancyStatus === 'OCCUPIED' ? 'success' : 'warning'}>{unit.occupancyStatus.replaceAll('_', ' ')}</Badge></td>
                  <td className="p-3">₦{unit.monthlyRent.toLocaleString()}</td>
                  <td className="p-3"><p>{unit.activeLease ? 'Signed lease' : 'No signed lease'}</p><p className="text-xs text-muted-foreground">{unit.pendingChargeCount} pending charge(s)</p></td>
                  <td className="p-3"><div className="flex justify-end gap-2">
                    {unit.occupancyStatus === 'VACANT' ? <Button size="sm" variant="outline" onClick={() => setEditor({ kind: 'assign', unit, value: '' })}>Assign tenant</Button> : <Button size="sm" variant="outline" disabled={unit.activeLease} title={unit.activeLease ? 'End or expire the signed lease before removing this tenant' : undefined} onClick={() => setRemoveUnit(unit)}>Remove tenant</Button>}
                  </div></td>
                </tr>)}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={query.data?.total ?? 0} onPageChange={setPage} />
      </div>

      {editor && <OperationDialog editor={editor} selectedCount={selected.length} pending={mutation.isPending} onChange={setEditor} onClose={() => setEditor(null)} onConfirm={runEditor} />}
      <ConfirmDialog open={removeUnit !== null} onOpenChange={(open) => { if (!open) setRemoveUnit(null); }} title="Remove tenant from unit?" description="This marks the unit vacant and clears its tenant assignment. The action is blocked when a signed lease exists and is recorded in the audit trail." confirmLabel="Remove tenant" isLoading={mutation.isPending} onConfirm={() => removeUnit && mutation.mutate(() => adminRentalService.removeUnitTenant(removeUnit.id), { onSuccess: () => setToast({ message: 'Tenant removed and unit marked vacant.', variant: 'success' }) })} />
      {toast && <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}
    </div>
  );
}

function OperationDialog({ editor, selectedCount, pending, onChange, onClose, onConfirm }: { editor: Editor; selectedCount: number; pending: boolean; onChange: (editor: Editor) => void; onClose: () => void; onConfirm: () => void }) {
  const title = editor.kind === 'assign' ? 'Assign tenant' : editor.kind === 'pricing' ? 'Update unit pricing' : 'Create lease charges';
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
    <div role="dialog" aria-modal="true" aria-labelledby="unit-operation-title" className="w-full max-w-lg rounded-2xl border bg-card p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
      <h2 id="unit-operation-title" className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{editor.kind === 'assign' ? `Assign a manual tenant to ${editor.unit.unitName}.` : `This affects ${selectedCount} selected unit(s) and will be recorded in the audit trail.`}</p>
      <div className="mt-4 space-y-3">
        {editor.kind === 'assign' && <LegacyInput autoFocus aria-label="Tenant full name" placeholder="Tenant full name" value={editor.value} onChange={(event) => onChange({ ...editor, value: event.target.value })} />}
        {editor.kind === 'pricing' && <LegacyInput autoFocus type="number" min="1" aria-label="New monthly rent" placeholder="New monthly rent (NGN)" value={editor.value} onChange={(event) => onChange({ ...editor, value: event.target.value })} />}
        {editor.kind === 'charge' && <>
          <LegacyInput autoFocus type="number" min="1" aria-label="Charge amount" placeholder="Charge amount (NGN)" value={editor.amount} onChange={(event) => onChange({ ...editor, amount: event.target.value })} />
          <LegacyInput type="date" aria-label="Charge due date" value={editor.dueDate} onChange={(event) => onChange({ ...editor, dueDate: event.target.value })} />
          <Select value={editor.category} ariaLabel="Charge category" onValueChange={(category) => onChange({ ...editor, category })} options={[{ value: 'RENT', label: 'Rent' }, { value: 'SERVICE_CHARGE', label: 'Service charge' }, { value: 'DEPOSIT', label: 'Deposit' }, { value: 'LEVY', label: 'Levy' }]} />
          <Select value={editor.billingCycle} ariaLabel="Billing cycle" onValueChange={(billingCycle) => onChange({ ...editor, billingCycle })} options={[{ value: 'MONTHLY', label: 'Monthly' }, { value: 'QUARTERLY', label: 'Quarterly' }, { value: 'ANNUAL', label: 'Annual' }]} />
          <p className="text-xs text-muted-foreground">Charges are created only for units with signed leases. The result will identify how many selections were skipped.</p>
        </>}
      </div>
      <div className="mt-5 flex justify-end gap-2"><Button variant="outline" disabled={pending} onClick={onClose}>Cancel</Button><Button disabled={pending} onClick={onConfirm}>{pending ? 'Processing…' : 'Confirm'}</Button></div>
    </div>
  </div>;
}
