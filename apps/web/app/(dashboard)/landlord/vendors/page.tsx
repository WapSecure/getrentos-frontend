'use client';

import { LegacyInput, Pagination } from '@getrentos/ui';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, HardHat, Search } from 'lucide-react';
import { VendorCard } from '@/components/landlord/vendors/VendorCard';
import { VendorFormModal } from '@/components/landlord/vendors/VendorFormModal';
import { VendorDetailModal } from '@/components/landlord/vendors/VendorDetailModal';
import { Button } from '@getrentos/ui';
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
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: [...landlordKeys.vendors, { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(landlordService.listVendors({ page, pageSize: PAGE_SIZE })),
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
    updateVendorMutation.mutate({ id: vendor.id, updates: { isActive: !vendor.isActive } });
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
        <Button variant="primary" className="gap-2" onClick={openAddForm}>
          <Plus className="w-4 h-4" />
          Add Vendor
        </Button>
      </div>

      {notice && (
        <div
          role="alert"
          className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300"
        >
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="font-medium hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <LegacyInput
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search vendors..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <ListState
        items={filteredVendors}
        query={{ isPending, isError, refetch }}
        errorTitle="We couldn't load your vendors"
        empty={
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <HardHat className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No vendors found</p>
          </div>
        }
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
