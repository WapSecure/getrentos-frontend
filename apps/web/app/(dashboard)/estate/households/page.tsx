'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, Plus } from 'lucide-react';
import { Button, EmptyState } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { HouseholdCard } from '@/components/estate/households/HouseholdCard';
import { HouseholdModal } from '@/components/estate/households/HouseholdModal';
import type { Household } from '@/types/estate';

export default function EstateHouseholdsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHousehold, setEditingHousehold] = useState<Household | null>(null);

  const { data: estate, isLoading: isEstateLoading } = useQuery({
    queryKey: estateKeys.myEstate,
    queryFn: () => unwrap(estateService.getMyEstate()),
  });

  const { data: households = [], isLoading: isHouseholdsLoading } = useQuery({
    queryKey: estateKeys.households(estate?.id ?? ''),
    queryFn: () => unwrap(estateService.listHouseholds(estate!.id)),
    enabled: !!estate,
  });

  const invalidate = () => {
    if (!estate) return;
    queryClient.invalidateQueries({ queryKey: estateKeys.households(estate.id) });
    queryClient.invalidateQueries({ queryKey: estateKeys.myEstate });
  };

  const addHousehold = useMutation({
    mutationFn: (data: {
      unitLabel: string;
      residentName: string;
      contactPhone?: string;
      contactEmail?: string;
    }) => unwrap(estateService.addHousehold(estate!.id, data)),
    onSuccess: () => {
      invalidate();
      setIsModalOpen(false);
    },
  });

  const updateHousehold = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        unitLabel: string;
        residentName: string;
        contactPhone?: string;
        contactEmail?: string;
      };
    }) => unwrap(estateService.updateHousehold(estate!.id, id, data)),
    onSuccess: () => {
      invalidate();
      setIsModalOpen(false);
      setEditingHousehold(null);
    },
  });

  const removeHousehold = useMutation({
    mutationFn: (id: string) => unwrap(estateService.removeHousehold(estate!.id, id)),
    onSuccess: invalidate,
  });

  if (isEstateLoading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  }

  if (!estate) {
    router.replace(ROUTES.ESTATE_SETUP);
    return null;
  }

  const handleSubmit = (data: {
    unitLabel: string;
    residentName: string;
    contactPhone?: string;
    contactEmail?: string;
  }) => {
    if (editingHousehold) {
      updateHousehold.mutate({ id: editingHousehold.id, data });
    } else {
      addHousehold.mutate(data);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Households</h1>
          <p className="text-muted-foreground mt-1">
            {households.length} household{households.length === 1 ? '' : 's'} in {estate.name}
          </p>
        </div>
        <Button
          variant="primary"
          className="gap-2"
          onClick={() => {
            setEditingHousehold(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Add Household
        </Button>
      </div>

      {isHouseholdsLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : households.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12">
          <EmptyState
            icon={Users}
            title="No households yet"
            description="Add the first household to start managing this estate's residents."
          />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {households.map((household) => (
            <HouseholdCard
              key={household.id}
              household={household}
              onEdit={() => {
                setEditingHousehold(household);
                setIsModalOpen(true);
              }}
              onRemove={() => removeHousehold.mutate(household.id)}
            />
          ))}
        </div>
      )}

      <HouseholdModal
        key={editingHousehold?.id ?? 'new'}
        isOpen={isModalOpen}
        household={editingHousehold}
        onClose={() => {
          setIsModalOpen(false);
          setEditingHousehold(null);
        }}
        onSubmit={handleSubmit}
        isSubmitting={addHousehold.isPending || updateHousehold.isPending}
      />
    </>
  );
}
