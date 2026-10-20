'use client';

import {
  Pagination,
  Button,
  EmptyState,
  Alert,
  SearchInput,
  useOptimisticMutation,
} from '@getrentos/ui';
import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, HardHat } from 'lucide-react';
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

  // The vendors endpoint does not accept a search param, so search stays client-side.
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
    toggleActiveMutation.mutate(vendor);
  };

  const handleRemoveVendor = (id: string) => {
    setNotice(null);
    removeVendorMutation.mutate(id);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vendors</h1>
          <p className="text-muted-foreground mt-1">
            {total} vendor{total === 1 ? '' : 's'} in your directory
          </p>
        </div>
        <Button variant="primary" onClick={openAddForm} icon={<Plus className="w-4 h-4" />}>
          Add Vendor
        </Button>
      </div>

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
    </>
  );
}
