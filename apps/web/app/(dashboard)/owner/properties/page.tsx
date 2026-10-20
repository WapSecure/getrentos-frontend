'use client';

import {
  Pagination,
  Button,
  ConfirmDialog,
  SearchInput,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  Skeleton,
  useToast,
} from '@getrentos/ui';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Building2 } from 'lucide-react';
import { OwnerPropertyCard } from '@/components/owner/properties/OwnerPropertyCard';
import {
  AddOwnerPropertyModal,
  type OwnerPropertySubmissionResult,
} from '@/components/owner/properties/AddOwnerPropertyModal';
import { OwnerVerificationStatusModal } from '@/components/owner/properties/OwnerVerificationStatusModal';
import { EditOwnerPropertyModal } from '@/components/owner/properties/EditOwnerPropertyModal';
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
  const toast = useToast();

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
      toast.show(
        failedProofCount > 0
          ? 'Property created. Some documents need to be uploaded again from its verification status.'
          : 'Property and ownership documents submitted for verification.',
        failedProofCount > 0 ? 'warning' : 'success'
      );
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
      toast.success('Property details updated.');
    },
    onError: (reason: Error) => toast.error(reason.message),
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

  const { data, isLoading, isError, refetch } = useQuery({
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
    placeholderData: keepPreviousData,
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
    toast.success('Updated ownership evidence submitted for review.');
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
          <div className="text-muted-foreground mt-1">
            {isLoading || (isError && !data) ? (
              <Skeleton className="h-5 w-48" />
            ) : (
              `${total} propert${total === 1 ? 'y' : 'ies'} in your portfolio`
            )}
          </div>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsAddModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Add Property
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput
          value={searchQuery}
          onValueChange={setSearchQuery}
          placeholder="Search by name or city..."
          className="flex-1 max-w-sm"
        />
        <div className="flex gap-1 p-1 bg-secondary rounded-lg max-w-full w-fit overflow-x-auto">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={filter === option.value}
              onClick={() => {
                setFilter(option.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                filter === option.value
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <ListSkeleton rows={6} variant="cards" label="Loading properties" />
      ) : isError && !data ? (
        <PageErrorState
          headingLevel="h2"
          title="We couldn't load your properties"
          onRetry={() => void refetch()}
        />
      ) : properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={total === 0 ? 'No properties yet' : 'No properties match your filters'}
          description={
            total === 0
              ? 'Add your first property to verify ownership and unlock sale listings and investment tracking.'
              : 'Try adjusting your search or filter.'
          }
          action={
            total === 0 ? (
              <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
                Add Your First Property
              </Button>
            ) : undefined
          }
        />
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
        onVerified={invalidate}
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
