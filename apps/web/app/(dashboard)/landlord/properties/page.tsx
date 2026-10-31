'use client';

import {
  Button,
  ConfirmDialog,
  EmptyState,
  PageErrorState,
  Pagination,
  SearchInput,
  Skeleton,
  ToggleChip,
  useToast,
  hasSessionDraft,
} from '@getrentos/ui';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Building2 } from 'lucide-react';
import { PropertyCard } from '@/components/landlord/properties/PropertyCard';
import {
  ADD_PROPERTY_DRAFT_KEY,
  AddPropertyModal,
  type LandlordPropertySubmission,
} from '@/components/landlord/properties/AddPropertyModal';
import { EditPropertyModal } from '@/components/landlord/properties/EditPropertyModal';
import { LandlordVerificationStatusModal } from '@/components/landlord/properties/LandlordVerificationStatusModal';
import { landlordService } from '@/services/landlordService';
import { landService } from '@/services/landService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import type { Property, PropertyUpdatePayload } from '@/types/landlord';
import type { LandOwnershipProofInput } from '@/types/land';
import { ROUTES } from '@/lib/constants/auth';
import { usePlanGateModal } from '@/hooks/usePlanGateModal';
import { UpgradeToProModal } from '@/components/shared/subscription/UpgradeToProModal';

type VerificationFilter = 'all' | Property['verificationStatus'];

const PAGE_SIZE = 10;

export default function LandlordPropertiesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Debounce the search input; reset to page 1 inside the timer callback.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [filter, setFilter] = useState<VerificationFilter>('all');
  // Reopen the form when the landlord comes back from signing in with a draft.
  const [isAddModalOpen, setIsAddModalOpen] = useState(() =>
    hasSessionDraft(ADD_PROPERTY_DRAFT_KEY)
  );
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);
  const [verifyingProperty, setVerifyingProperty] = useState<Property | null>(null);
  const toast = useToast();

  const {
    data,
    isPending: isLoadingProperties,
    isError: propertiesFailed,
    refetch: refetchProperties,
  } = useQuery({
    queryKey: [
      ...landlordKeys.properties,
      {
        search: debouncedSearch,
        verificationStatus: filter === 'all' ? undefined : filter,
        page,
        pageSize: PAGE_SIZE,
      },
    ],
    queryFn: () =>
      unwrap(
        landlordService.listProperties({
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

  const invalidateProperties = () =>
    queryClient.invalidateQueries({ queryKey: landlordKeys.properties });
  const planGate = usePlanGateModal();

  const publishMutation = useMutation({
    mutationFn: async (submission: LandlordPropertySubmission) => {
      const uploadedKeys: string[] = [];
      let created: Property;
      try {
        const upload = async (kind: 'image' | 'video', file: File) => {
          const result = await unwrap(landlordService.uploadPropertyMedia(kind, file));
          uploadedKeys.push(result.key);
          return result;
        };
        const [cover, gallery, video] = await Promise.all([
          upload('image', submission.coverImage),
          Promise.all(submission.galleryImages.map((file) => upload('image', file))),
          submission.videoTour ? upload('video', submission.videoTour) : Promise.resolve(null),
        ]);
        created = await unwrap(
          landlordService.createProperty({
            ...submission.property,
            coverImageKey: cover.key,
            galleryImageKeys: gallery.map((item) => item.key),
            videoTourKey: video?.key,
          })
        );
      } catch (error) {
        await Promise.allSettled(
          uploadedKeys.map((key) => unwrap(landlordService.removeUploadedPropertyMedia(key)))
        );
        throw error;
      }
      const proofResults = await Promise.allSettled(
        submission.ownershipProofs.map((proof) =>
          unwrap(landService.submitOwnershipProof(created.id, proof))
        )
      );
      const failedProofs = proofResults.filter((result) => result.status === 'rejected').length;
      return { created, failedProofs };
    },
    onSuccess: ({ failedProofs }) => {
      invalidateProperties();
      toast.show(
        failedProofs
          ? `Property created, but ${failedProofs} verification document${failedProofs === 1 ? '' : 's'} must be retried from Verification Status.`
          : 'Property media and verification documents uploaded successfully.',
        failedProofs ? 'warning' : 'success'
      );
    },
    onError: (error: Error) => {
      if (planGate.handleError(error)) return;
      toast.error(error.message || 'We could not create this property. Please try again.');
    },
  });

  const notifyPropertyError = (fallback: string) => (error: Error) =>
    toast.error(error.message || fallback);

  const editMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: PropertyUpdatePayload }) =>
      unwrap(landlordService.updateProperty(id, updates)),
    onSuccess: invalidateProperties,
    onError: notifyPropertyError('We could not save these changes. Please try again.'),
  });

  const toggleArchiveMutation = useMutation({
    mutationFn: (id: string) => unwrap(landlordService.toggleArchiveProperty(id)),
    onSuccess: invalidateProperties,
    onError: notifyPropertyError('We could not update this property. Please try again.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => unwrap(landlordService.deleteProperty(id)),
    onSuccess: invalidateProperties,
    onError: notifyPropertyError('We could not delete this property. Please try again.'),
  });

  const handlePublish = (submission: LandlordPropertySubmission) =>
    publishMutation.mutateAsync(submission).then(() => undefined);

  const handleEditSave = (id: string, updates: PropertyUpdatePayload) =>
    editMutation.mutate({ id, updates });

  const handleToggleArchive = (id: string) => toggleArchiveMutation.mutate(id);

  const handleDelete = (id: string) => deleteMutation.mutate(id);

  const handleVerifyResubmit = async (propertyId: string, proof: LandOwnershipProofInput) => {
    await unwrap(landService.submitOwnershipProof(propertyId, proof));
    invalidateProperties();
  };

  const hasActiveFilters = searchQuery !== '' || filter !== 'all';

  const filterOptions: { value: VerificationFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'verified', label: 'Verified' },
    { value: 'pending', label: 'Pending' },
    { value: 'unverified', label: 'Unverified' },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Properties</h1>
          <p className="text-muted-foreground mt-1">
            {isLoadingProperties || (propertiesFailed && !data) ? (
              <Skeleton className="inline-block h-4 w-56 max-w-full align-middle" />
            ) : (
              `${total} propert${total === 1 ? 'y' : 'ies'} in your portfolio`
            )}
          </p>
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
          label="Search properties"
          className="flex-1 max-w-sm"
        />
        <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Filter properties">
          {filterOptions.map((option) => (
            <ToggleChip
              key={option.value}
              size="sm"
              pressed={filter === option.value}
              onPressedChange={() => {
                setFilter(option.value);
                setPage(1);
              }}
            >
              {option.label}
            </ToggleChip>
          ))}
        </div>
      </div>

      {isLoadingProperties ? (
        <div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
          role="status"
          aria-busy="true"
          aria-label="Loading properties"
        >
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : propertiesFailed && !data ? (
        <PageErrorState
          headingLevel="h2"
          title="We couldn't load your properties"
          description="Your portfolio is safe: this was a connection problem. Try again."
          onRetry={() => void refetchProperties()}
        />
      ) : properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={hasActiveFilters ? 'No properties match your filters' : 'No properties yet'}
          description={
            hasActiveFilters
              ? 'Try adjusting your search or filter.'
              : 'Add your first property to start managing units, tenants, and rent collection.'
          }
          action={
            !hasActiveFilters ? (
              <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
                Add Your First Property
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((property, index) => (
            <PropertyCard
              key={property.id}
              property={property}
              delay={index * 0.05}
              onClick={() => router.push(`${ROUTES.LANDLORD_UNITS}?property=${property.id}`)}
              onEdit={() => setEditingProperty(property)}
              onToggleArchive={() => handleToggleArchive(property.id)}
              onDelete={() => setDeletingPropertyId(property.id)}
              onVerify={() => setVerifyingProperty(property)}
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

      <AddPropertyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPublish={handlePublish}
        isSubmitting={publishMutation.isPending}
      />

      <EditPropertyModal
        property={editingProperty}
        onClose={() => setEditingProperty(null)}
        onSave={handleEditSave}
      />

      <LandlordVerificationStatusModal
        property={verifyingProperty}
        onClose={() => setVerifyingProperty(null)}
        onResubmit={handleVerifyResubmit}
      />

      <ConfirmDialog
        open={!!deletingPropertyId}
        onOpenChange={(open) => !open && setDeletingPropertyId(null)}
        title="Delete this property?"
        description="This will permanently remove the property and all of its unit records. This cannot be undone."
        onConfirm={() => deletingPropertyId && handleDelete(deletingPropertyId)}
      />

      <UpgradeToProModal
        isOpen={planGate.isOpen}
        onClose={planGate.close}
        reason={planGate.reason}
      />
    </>
  );
}
