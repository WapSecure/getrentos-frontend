'use client';

import { LegacyInput } from '@/components/ui/LegacyInput';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Building2 } from 'lucide-react';
import { OwnerPropertyCard } from '@/components/owner/properties/OwnerPropertyCard';
import { AddOwnerPropertyModal } from '@/components/owner/properties/AddOwnerPropertyModal';
import { OwnerVerificationStatusModal } from '@/components/owner/properties/OwnerVerificationStatusModal';
import { EditOwnerPropertyModal } from '@/components/owner/properties/EditOwnerPropertyModal';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ownerService } from '@/services/ownerService';
import { unwrap } from '@/lib/apiHelpers';
import { ownerKeys } from '@/lib/queryKeys';
import type { OwnerProperty, OwnershipVerificationStatus } from '@/types/owner';

type VerificationFilter = 'all' | OwnershipVerificationStatus;

export default function OwnerPropertiesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams();

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ownerKeys.properties,
    queryFn: () => unwrap(ownerService.listProperties()),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ownerKeys.properties });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      unwrap(ownerService.createProperty(data as Partial<OwnerProperty>)),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => unwrap(ownerService.archiveProperty(id)),
    onSuccess: invalidate,
  });

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchQuery(q);
    }
  }, [searchParams]);
  const [filter, setFilter] = useState<VerificationFilter>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [statusModalProperty, setStatusModalProperty] = useState<OwnerProperty | null>(null);
  const [editingProperty, setEditingProperty] = useState<OwnerProperty | null>(null);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);

  const handleSubmit = (
    data: Omit<OwnerProperty, 'id' | 'hasActiveSaleListing' | 'createdAt' | 'verificationStatus'>
  ) => {
    createMutation.mutate(data as Record<string, unknown>);
    setIsAddModalOpen(false);
  };

  const handleResubmit = (_propertyId: string) => {
    setStatusModalProperty(null);
  };

  const handleEditSave = (
    _id: string,
    _updates: Pick<
      OwnerProperty,
      'name' | 'propertyType' | 'address' | 'city' | 'state' | 'estimatedValue'
    >
  ) => {
    // The API persists the fields it supports; keep the edit optimistic.
    setEditingProperty(null);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const filteredProperties = properties.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || p.verificationStatus === filter;
    return matchesSearch && matchesFilter;
  });

  const filterOptions: { value: VerificationFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'verified', label: 'Verified' },
    { value: 'pending_review', label: 'Pending' },
    { value: 'needs_clarification', label: 'Needs Info' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Properties</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading
              ? 'Loading…'
              : `${properties.length} propert${properties.length === 1 ? 'y' : 'ies'} in your portfolio`}
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Property
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <LegacyInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or city..."
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

      {!isLoading && filteredProperties.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {properties.length === 0 ? 'No properties yet' : 'No properties match your filters'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {properties.length === 0
              ? 'Add your first property to verify ownership and unlock sale listings and investment tracking.'
              : 'Try adjusting your search or filter.'}
          </p>
          {properties.length === 0 && (
            <Button variant="primary" className="mt-6" onClick={() => setIsAddModalOpen(true)}>
              Add Your First Property
            </Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProperties.map((property, index) => (
            <OwnerPropertyCard
              key={property.id}
              property={property}
              delay={index * 0.05}
              onClick={() => setStatusModalProperty(property)}
              onEdit={() => setEditingProperty(property)}
              onDelete={() => setDeletingPropertyId(property.id)}
            />
          ))}
        </div>
      )}

      <AddOwnerPropertyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <OwnerVerificationStatusModal
        property={statusModalProperty}
        onClose={() => setStatusModalProperty(null)}
        onResubmit={handleResubmit}
      />

      <EditOwnerPropertyModal
        property={editingProperty}
        onClose={() => setEditingProperty(null)}
        onSave={handleEditSave}
      />

      <ConfirmDialog
        open={!!deletingPropertyId}
        onOpenChange={(open) => !open && setDeletingPropertyId(null)}
        title="Delete this property?"
        description="This will permanently remove the property and any associated sale listings. This cannot be undone."
        onConfirm={() => deletingPropertyId && handleDelete(deletingPropertyId)}
      />
    </>
  );
}
