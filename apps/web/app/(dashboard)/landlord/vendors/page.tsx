'use client';

import { LegacyInput, Pagination } from '@getrentos/ui';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, HardHat, Search } from 'lucide-react';
import { VendorCard } from '@/components/landlord/vendors/VendorCard';
import { AddVendorModal } from '@/components/landlord/vendors/AddVendorModal';
import { Button } from '@getrentos/ui';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import type { Vendor } from '@/types/landlord';

const PAGE_SIZE = 10;

export default function LandlordVendorsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // The vendors endpoint does not accept a search param, so search stays client-side.
  const { data } = useQuery({
    queryKey: [...landlordKeys.vendors, { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(landlordService.listVendors({ page, pageSize: PAGE_SIZE })),
  });
  const vendors = data?.items ?? [];
  const total = data?.total ?? 0;

  const invalidateVendors = () => queryClient.invalidateQueries({ queryKey: landlordKeys.vendors });

  const addVendorMutation = useMutation({
    mutationFn: (data: Omit<Vendor, 'id' | 'rating' | 'jobsCompleted'>) =>
      unwrap(landlordService.addVendor(data)),
    onSuccess: invalidateVendors,
  });

  const removeVendorMutation = useMutation({
    mutationFn: (id: string) => unwrap(landlordService.removeVendor(id)),
    onSuccess: invalidateVendors,
  });

  const handleAddVendor = (data: Omit<Vendor, 'id' | 'rating' | 'jobsCompleted'>) =>
    addVendorMutation.mutate(data);

  const handleRemoveVendor = (id: string) => removeVendorMutation.mutate(id);

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
        <Button variant="primary" className="gap-2" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Vendor
        </Button>
      </div>

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

      {filteredVendors.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <HardHat className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">No vendors found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVendors.map((vendor, index) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              delay={index * 0.05}
              onRemove={handleRemoveVendor}
            />
          ))}
        </div>
      )}

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}

      <AddVendorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddVendor}
      />
    </>
  );
}
