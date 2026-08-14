'use client';

import { LegacyInput } from '@/components/ui/LegacyInput';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Megaphone } from 'lucide-react';
import { SaleListingCard } from '@/components/owner/listings/SaleListingCard';
import { CreateSaleListingModal } from '@/components/owner/listings/CreateSaleListingModal';
import { ManageListingModal } from '@/components/owner/listings/ManageListingModal';
import { Button } from '@/components/ui/Button';
import { ownerService } from '@/services/ownerService';
import { unwrap } from '@/lib/apiHelpers';
import { ownerKeys } from '@/lib/queryKeys';
import type { SaleListing, SaleListingStatus } from '@/types/owner';

type StatusFilter = 'all' | SaleListingStatus;

export default function OwnerListingsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [manageListing, setManageListing] = useState<SaleListing | null>(null);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ownerKeys.listings,
    queryFn: () => unwrap(ownerService.listListings()),
  });

  const { data: properties = [] } = useQuery({
    queryKey: ownerKeys.properties,
    queryFn: () => unwrap(ownerService.listProperties()),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ownerKeys.listings });

  const createMutation = useMutation({
    mutationFn: (data: {
      propertyId: string;
      price: number;
      listingTitle?: string;
      amenities?: string[];
    }) => unwrap(ownerService.createListing(data)),
    onSuccess: invalidate,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SaleListingStatus }) =>
      unwrap(
        ownerService.setListingStatus(id, status.toUpperCase() as 'PUBLISHED' | 'PAUSED' | 'CLOSED')
      ),
    onSuccess: invalidate,
  });

  const handleCreate = (data: Omit<SaleListing, 'id' | 'createdAt'>) => {
    createMutation.mutate({
      propertyId: data.propertyId,
      price: data.askingPrice,
      listingTitle: data.listingTitle,
      amenities: data.features,
    });
    setIsCreateModalOpen(false);
  };

  const handleChangeStatus = (listingId: string, status: SaleListingStatus) => {
    statusMutation.mutate({ id: listingId, status });
  };

  const verifiedProperties = properties.filter((p) => p.verificationStatus === 'verified');

  const filteredListings = listings.filter((l) => {
    const matchesSearch =
      l.listingTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.propertyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || l.status === filter;
    return matchesSearch && matchesFilter;
  });

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'paused', label: 'Paused' },
    { value: 'closed', label: 'Closed' },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sale Listings</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading
              ? 'Loading…'
              : `${listings.length} listing${listings.length === 1 ? '' : 's'} across your portfolio`}
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4" />
          New Listing
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <LegacyInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or property..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit overflow-x-auto">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                filter === option.value
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {!isLoading && filteredListings.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
            <Megaphone className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {listings.length === 0 ? 'No sale listings yet' : 'No listings match your filters'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {listings.length === 0
              ? 'Create a sale listing for one of your verified properties to start reaching buyers.'
              : 'Try adjusting your search or filter.'}
          </p>
          {listings.length === 0 && (
            <Button variant="primary" className="mt-6" onClick={() => setIsCreateModalOpen(true)}>
              Create Your First Listing
            </Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredListings.map((listing, index) => (
            <SaleListingCard
              key={listing.id}
              listing={listing}
              delay={index * 0.05}
              onClick={() => setManageListing(listing)}
            />
          ))}
        </div>
      )}

      <CreateSaleListingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        verifiedProperties={verifiedProperties}
        onCreate={handleCreate}
      />

      <ManageListingModal
        listing={manageListing}
        onClose={() => setManageListing(null)}
        onChangeStatus={handleChangeStatus}
      />
    </>
  );
}
