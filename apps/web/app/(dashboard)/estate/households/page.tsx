'use client';

import { RedirectToEstateSetup } from '@/components/estate/shared/RedirectToEstateSetup';
import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Upload, Lock } from '@sureground/icons';
import {
  Button,
  CardSkeleton,
  ConfirmDialog,
  EmptyState,
  Pagination,
  useToast,
  PageHeader,
} from '@sureground/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { HouseholdCard } from '@/components/estate/households/HouseholdCard';
import { HouseholdModal } from '@/components/estate/households/HouseholdModal';
import { LinkResidentModal } from '@/components/estate/households/LinkResidentModal';
import { ImportHouseholdsModal } from '@/components/estate/households/ImportHouseholdsModal';
import {
  EstateListSection,
  EstateListSkeleton,
  EstateRowList,
} from '@/components/estate/shared/EstateListSection';
import type { Household, ImportHouseholdsResult } from '@/types/estate';
import { usePlanGateModal } from '@/hooks/usePlanGateModal';
import { UpgradeToProModal } from '@/components/shared/subscription/UpgradeToProModal';
import { useEstatePlan } from '@/hooks/useEstatePlan';

const PAGE_SIZE = 10;

export default function EstateHouseholdsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHousehold, setEditingHousehold] = useState<Household | null>(null);
  const [linkingHousehold, setLinkingHousehold] = useState<Household | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportHouseholdsResult | null>(null);
  const [page, setPage] = useState(1);
  const [confirming, setConfirming] = useState<{
    kind: 'remove' | 'unlink';
    household: Household;
  } | null>(null);

  const { estate, isLoading: isEstateLoading } = useSelectedEstate();
  const planGate = usePlanGateModal();
  const { isPro } = useEstatePlan();
  const toast = useToast();

  const { data, isLoading: isHouseholdsLoading } = useQuery({
    queryKey: [...estateKeys.households(estate?.id ?? ''), { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(estateService.listHouseholds(estate!.id, { page, pageSize: PAGE_SIZE })),
    enabled: !!estate,
    placeholderData: keepPreviousData,
  });
  const households = data?.items ?? [];
  const total = data?.total ?? 0;

  const invalidate = () => {
    if (!estate) return;
    queryClient.invalidateQueries({ queryKey: estateKeys.households(estate.id) });
    queryClient.invalidateQueries({ queryKey: estateKeys.myEstate });
    queryClient.invalidateQueries({ queryKey: estateKeys.myEstates });
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
      setPage(1);
      setIsModalOpen(false);
    },
    onError: (error: Error) => {
      if (planGate.handleError(error)) setIsModalOpen(false);
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
    onSuccess: () => {
      invalidate();
      setPage((current) => (current > 1 && households.length === 1 ? current - 1 : current));
      if (confirming) toast.success(`${confirming.household.unitLabel} removed.`);
    },
    onError: (error: Error) => toast.error(error.message || 'Unable to remove this household.'),
  });

  const linkResident = useMutation({
    mutationFn: (contact: string) =>
      unwrap(estateService.linkResident(estate!.id, linkingHousehold!.id, contact)),
    onSuccess: () => {
      invalidate();
      setLinkingHousehold(null);
    },
  });

  const unlinkResident = useMutation({
    mutationFn: (id: string) => unwrap(estateService.unlinkResident(estate!.id, id)),
    onSuccess: () => {
      invalidate();
      if (confirming)
        toast.success(`Resident account unlinked from ${confirming.household.unitLabel}.`);
    },
    onError: (error: Error) =>
      toast.error(error.message || 'Unable to unlink this resident account.'),
  });

  const importHouseholds = useMutation({
    mutationFn: (file: File) => unwrap(estateService.importHouseholds(estate!.id, file)),
    onSuccess: (result) => {
      setImportResult(result);
      if (result.created > 0) {
        invalidate();
        setPage(1);
      }
    },
    onError: (error: Error) => {
      if (planGate.handleError(error)) {
        setIsImportOpen(false);
        return;
      }
      toast.error(error.message || 'Unable to import this file.');
    },
  });

  if (isEstateLoading) {
    return <CardSkeleton />;
  }

  if (!estate) return <RedirectToEstateSetup />;

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

  const openAdd = () => {
    setEditingHousehold(null);
    setIsModalOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Households"
        description={`The homes in ${estate.name} and who lives in each.`}
        actions={
          <>
            <Button
              variant="outline"
              icon={<Upload className="h-4 w-4" />}
              onClick={() => setIsImportOpen(true)}
            >
              Import CSV
              {!isPro && (
                <span
                  className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-muted-foreground"
                  title="Pro plan feature"
                >
                  <Lock className="h-3 w-3" aria-hidden="true" />
                  <span className="sr-only">Pro plan feature</span>
                </span>
              )}
            </Button>
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={openAdd}>
              Add household
            </Button>
          </>
        }
      />

      <EstateListSection
        id="households"
        title="All households"
        count={isHouseholdsLoading ? undefined : total}
        countLabel={`${total} household${total === 1 ? '' : 's'}`}
        description="Linking a resident's Sureground account gives them their own dashboard for that household."
        footer={
          total > PAGE_SIZE ? (
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          ) : undefined
        }
      >
        {isHouseholdsLoading ? (
          <EstateListSkeleton />
        ) : households.length === 0 ? (
          <EmptyState
            bare
            icon={Users}
            title="No households yet"
            description="Add the first household by hand, or import a CSV of units and residents."
            action={
              <Button variant="outline" size="sm" onClick={openAdd}>
                Add the first household
              </Button>
            }
          />
        ) : (
          <EstateRowList>
            {households.map((household) => (
              <li key={household.id}>
                <HouseholdCard
                  household={household}
                  onEdit={() => {
                    setEditingHousehold(household);
                    setIsModalOpen(true);
                  }}
                  onRemove={() => setConfirming({ kind: 'remove', household })}
                  onLinkResident={() => setLinkingHousehold(household)}
                  onUnlinkResident={() => setConfirming({ kind: 'unlink', household })}
                />
              </li>
            ))}
          </EstateRowList>
        )}
      </EstateListSection>

      <HouseholdModal
        key={editingHousehold?.id ?? 'new'}
        isOpen={isModalOpen}
        household={editingHousehold}
        onClose={() => {
          setIsModalOpen(false);
          setEditingHousehold(null);
          addHousehold.reset();
          updateHousehold.reset();
        }}
        onSubmit={handleSubmit}
        isSubmitting={addHousehold.isPending || updateHousehold.isPending}
        errorMessage={
          (editingHousehold ? updateHousehold.error : addHousehold.error)?.message ?? null
        }
      />

      <LinkResidentModal
        household={linkingHousehold}
        onClose={() => setLinkingHousehold(null)}
        onSubmit={(contact) => linkResident.mutate(contact)}
        isSubmitting={linkResident.isPending}
        error={linkResident.isError ? linkResident.error.message : null}
      />

      <ImportHouseholdsModal
        isOpen={isImportOpen}
        onClose={() => {
          setIsImportOpen(false);
          setImportResult(null);
        }}
        onSubmit={(file) => importHouseholds.mutate(file)}
        isSubmitting={importHouseholds.isPending}
        result={importResult}
      />

      <UpgradeToProModal
        isOpen={planGate.isOpen}
        onClose={planGate.close}
        reason={planGate.reason}
      />

      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={(open) => {
          if (!open) setConfirming(null);
        }}
        title={
          confirming?.kind === 'unlink' ? 'Unlink this resident account?' : 'Remove this household?'
        }
        description={
          !confirming
            ? ''
            : confirming.kind === 'unlink'
              ? `${confirming.household.residentName}'s account is unlinked from ${confirming.household.unitLabel}. The household stays, and you can link an account again later.`
              : `${confirming.household.unitLabel} (${confirming.household.residentName}) is removed from ${estate.name}. This can't be undone.`
        }
        confirmLabel={confirming?.kind === 'unlink' ? 'Unlink' : 'Remove'}
        onConfirm={() =>
          confirming &&
          (confirming.kind === 'unlink' ? unlinkResident : removeHousehold).mutateAsync(
            confirming.household.id
          )
        }
        isLoading={removeHousehold.isPending || unlinkResident.isPending}
      />
    </>
  );
}
