'use client';

import { LegacyInput, Pagination, Toast, type ToastVariant } from '@getrentos/ui';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Building2 } from 'lucide-react';
import { OwnerPropertyCard } from '@/components/owner/properties/OwnerPropertyCard';
import {
  AddOwnerPropertyModal,
  type OwnerPropertySubmissionResult,
} from '@/components/owner/properties/AddOwnerPropertyModal';
import { OwnerVerificationStatusModal } from '@/components/owner/properties/OwnerVerificationStatusModal';
import { EditOwnerPropertyModal } from '@/components/owner/properties/EditOwnerPropertyModal';
import { Button } from '@getrentos/ui';
import { ConfirmDialog } from '@getrentos/ui';
import { ownerService } from '@/services/ownerService';
import { landService } from '@/services/landService';
import { unwrap } from '@/lib/apiHelpers';
import { ownerKeys } from '@/lib/queryKeys';
import type { OwnerProperty, OwnershipVerificationStatus } from '@/types/owner';
import type { LandOwnershipProofInput } from '@/types/land';

type VerificationFilter = 'all' | OwnershipVerificationStatus;

const PAGE_SIZE = 10;

export default function OwnerPropertiesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ownerKeys.properties });

  const createMutation = useMutation({
    mutationFn: async ({
      property,
      ownershipProofs,
    }: {
      property: Partial<OwnerProperty>;
      ownershipProofs: LandOwnershipProofInput[];
    }) => {
      const created = await unwrap(ownerService.createProperty(property));
      const uploads = await Promise.allSettled(
        ownershipProofs.map((proof) => unwrap(landService.submitOwnershipProof(created.id, proof)))
      );
      return {
        propertyId: created.id,
        failedProofCount: uploads.filter((upload) => upload.status === 'rejected').length,
      } satisfies OwnerPropertySubmissionResult;
    },
    onSuccess: ({ failedProofCount }) => {
      invalidate();
      setToast({
        message:
          failedProofCount > 0
            ? 'Property created. Some documents need to be uploaded again from its verification status.'
            : 'Property and ownership documents submitted for verification.',
        variant: failedProofCount > 0 ? 'warning' : 'success',
      });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => unwrap(ownerService.archiveProperty(id)),
    onSuccess: invalidate,
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<OwnerProperty> }) =>
      unwrap(ownerService.updateProperty(id, updates)),
    onSuccess: () => {
      invalidate();
      setToast({ message: 'Property details updated.', variant: 'success' });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchQuery(q);
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [filter, setFilter] = useState<VerificationFilter>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [statusModalProperty, setStatusModalProperty] = useState<OwnerProperty | null>(null);
  const [editingProperty, setEditingProperty] = useState<OwnerProperty | null>(null);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [
      ...ownerKeys.properties,
      {
        search: debouncedSearch,
        verificationStatus: filter === 'all' ? undefined : filter,
        page,
        pageSize: PAGE_SIZE,
      },
    ],
    queryFn: () =>
      unwrap(
        ownerService.listProperties({
          search: debouncedSearch || undefined,
          verificationStatus: filter === 'all' ? undefined : filter,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
  });
  const properties = data?.items ?? [];
  const total = data?.total ?? 0;

  const handleSubmit = async (
    data: Omit<OwnerProperty, 'id' | 'hasActiveSaleListing' | 'createdAt' | 'verificationStatus'>,
    ownershipProofs: LandOwnershipProofInput[]
  ): Promise<OwnerPropertySubmissionResult> => {
    const result = await createMutation.mutateAsync({ property: data, ownershipProofs });
    return result;
  };

  const handleResubmit = async (propertyId: string, proof: LandOwnershipProofInput) => {
    await unwrap(landService.submitOwnershipProof(propertyId, proof));
    invalidate();
    setToast({ message: 'Updated ownership evidence submitted for review.', variant: 'success' });
    setStatusModalProperty(null);
  };

  const handleEditSave = async (
    id: string,
    updates: Pick<
      OwnerProperty,
      'name' | 'propertyType' | 'address' | 'city' | 'state' | 'estimatedValue'
    >
  ) => {
    await updateMutation.mutateAsync({ id, updates });
    setEditingProperty(null);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

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
              : `${total} propert${total === 1 ? 'y' : 'ies'} in your portfolio`}
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
              onClick={() => {
                setFilter(option.value);
                setPage(1);
              }}
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

      {!isLoading && properties.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {total === 0 ? 'No properties yet' : 'No properties match your filters'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {total === 0
              ? 'Add your first property to verify ownership and unlock sale listings and investment tracking.'
              : 'Try adjusting your search or filter.'}
          </p>
          {total === 0 && (
            <Button variant="primary" className="mt-6" onClick={() => setIsAddModalOpen(true)}>
              Add Your First Property
            </Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((property, index) => (
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

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
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

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
}
