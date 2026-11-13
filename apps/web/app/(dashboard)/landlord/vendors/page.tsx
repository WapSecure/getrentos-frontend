'use client';

import {
  Pagination,
  Button,
  ConfirmDialog,
  EmptyState,
  Alert,
  SearchInput,
  useOptimisticMutation,
  useToast,
  PageHeader,
} from '@sureground/ui';
import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, HardHat } from '@sureground/icons';
import { VendorCard } from '@/components/landlord/vendors/VendorCard';
import { VendorFormModal } from '@/components/landlord/vendors/VendorFormModal';
import { VendorDetailModal } from '@/components/landlord/vendors/VendorDetailModal';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { ListState } from '@/components/shared/ListState';
import type { Vendor, VendorInput } from '@/types/landlord';

const PAGE_SIZE = 10;

export default function LandlordVendorsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [viewing, setViewing] = useState<Vendor | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<{
    kind: 'remove' | 'deactivate';
    vendor: Vendor;
  } | null>(null);
  const toast = useToast();

  // The endpoint takes no search param, so search is client-side.
  const vendorsKey = [...landlordKeys.vendors, { page, pageSize: PAGE_SIZE }];
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: vendorsKey,
    queryFn: () => unwrap(landlordService.listVendors({ page, pageSize: PAGE_SIZE })),
    placeholderData: keepPreviousData,
  });
  const vendors = useMemo(() => data?.items ?? [], [data]);
  const total = data?.total ?? 0;

  const invalidateVendors = () => queryClient.invalidateQueries({ queryKey: landlordKeys.vendors });

  const failed = (error: unknown) =>
    setNotice(
      error instanceof Error ? error.message : 'We could not complete that. Please try again.'
    );

  const addVendorMutation = useMutation({
    mutationFn: (data: VendorInput) => unwrap(landlordService.addVendor(data)),
    onSuccess: invalidateVendors,
    onError: failed,
  });

  const updateVendorMutation = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<VendorInput> & { isActive?: boolean };
    }) => unwrap(landlordService.updateVendor(id, updates)),
    onSuccess: invalidateVendors,
    onError: failed,
  });

  const toggleActiveMutation = useOptimisticMutation({
    mutationFn: (vendor: Vendor) =>
      unwrap(landlordService.updateVendor(vendor.id, { isActive: !vendor.isActive })),
    patches: () => [
      {
        queryKey: vendorsKey,
        update: (old, vendor) => {
          const page = old as NonNullable<typeof data>;
          return {
            ...page,
            items: page.items.map((v) =>
              v.id === vendor.id ? { ...v, isActive: !vendor.isActive } : v
            ),
          };
        },
      },
    ],
    invalidate: [landlordKeys.vendors],
    errorMessage: 'We could not update this vendor. Please try again.',
  });

  const removeVendorMutation = useMutation({
    mutationFn: (id: string) => unwrap(landlordService.removeVendor(id)),
    onSuccess: invalidateVendors,
    onError: failed,
  });

  const openAddForm = () => {
    setEditing(null);
    setIsFormOpen(true);
  };

  const openEditForm = (vendor: Vendor) => {
    setEditing(vendor);
    setIsFormOpen(true);
  };

  const handleSaveVendor = (data: VendorInput) => {
    setNotice(null);
    if (editing) updateVendorMutation.mutate({ id: editing.id, updates: data });
    else addVendorMutation.mutate(data);
  };

  const handleToggleActive = (vendor: Vendor) => {
    setNotice(null);
    if (vendor.isActive) setConfirming({ kind: 'deactivate', vendor });
    else toggleActiveMutation.mutate(vendor);
  };

  const handleRemoveVendor = (id: string) => {
    setNotice(null);
    const vendor = vendors.find((v) => v.id === id);
    if (vendor) setConfirming({ kind: 'remove', vendor });
  };

  const confirmAction = async () => {
    if (!confirming) return;
    const { kind, vendor } = confirming;
    if (kind === 'remove') await removeVendorMutation.mutateAsync(vendor.id);
    else await toggleActiveMutation.mutateAsync(vendor);
    toast.success(
      kind === 'remove' ? `"${vendor.name}" removed.` : `"${vendor.name}" deactivated.`
    );
  };

  const filteredVendors = useMemo(
    () =>
      vendors.filter(
        (v) =>
          v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.serviceType.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [vendors, searchQuery]
  );

  return (
    <>
      <PageHeader
        eyebrow="Property care"
        title="Vendors"
        description={
          <>
            {total} vendor{total === 1 ? '' : 's'} in your directory
          </>
        }
        actions={
          <Button variant="primary" onClick={openAddForm} icon={<Plus className="w-4 h-4" />}>
            Add vendor
          </Button>
        }
      />

      {notice && (
        <Alert variant="warning" className="mb-4" onDismiss={() => setNotice(null)}>
          {notice}
        </Alert>
      )}

      <SearchInput
        value={searchQuery}
        onValueChange={setSearchQuery}
        placeholder="Search vendors..."
        className="max-w-sm mb-6"
      />

      <ListState
        items={filteredVendors}
        query={{ isPending, isError, refetch }}
        errorTitle="We couldn't load your vendors"
        empty={<EmptyState icon={HardHat} title="No vendors found" />}
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVendors.map((vendor, index) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              delay={index * 0.05}
              onOpen={setViewing}
              onEdit={openEditForm}
              onToggleActive={handleToggleActive}
              onRemove={handleRemoveVendor}
            />
          ))}
        </div>
      </ListState>

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}

      <VendorFormModal
        isOpen={isFormOpen}
        vendor={editing}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveVendor}
      />

      <VendorDetailModal vendor={viewing} onClose={() => setViewing(null)} />

      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={(open) => {
          if (!open) setConfirming(null);
        }}
        title={
          confirming?.kind === 'deactivate' ? 'Deactivate this vendor?' : 'Remove this vendor?'
        }
        description={
          !confirming
            ? ''
            : confirming.kind === 'deactivate'
              ? `"${confirming.vendor.name}" is marked inactive. You can reactivate them from their card at any time.`
              : `"${confirming.vendor.name}" is removed from your vendor directory. This can't be undone.`
        }
        confirmLabel={confirming?.kind === 'deactivate' ? 'Deactivate' : 'Remove'}
        onConfirm={confirmAction}
        isLoading={removeVendorMutation.isPending || toggleActiveMutation.isPending}
      />
    </>
  );
}
