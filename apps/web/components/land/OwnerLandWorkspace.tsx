'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Pagination, Toast, type ToastVariant } from '@getrentos/ui';
import { ArrowRight, FileSearch, MapPin, Plus, Ruler, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { landKeys } from '@/lib/queryKeys';
import { unwrap } from '@/lib/apiHelpers';
import { landService } from '@/services/landService';
import { ownerService } from '@/services/ownerService';
import { ROUTES } from '@/lib/constants/auth';
import type { LandOwnershipProofInput, LandParcelInput, OwnerLandRecord } from '@/types/land';
import { LAND_AREA_UNIT_LABELS } from '@/types/land';
import { LandDiligenceBadge } from './LandDiligenceBadge';
import { LandParcelEditor } from './LandParcelEditor';
import { LandRegistrationDialog, type LandRegistrationInput } from './LandRegistrationDialog';

const PAGE_SIZE = 9;

const titleOf = (record: OwnerLandRecord) =>
  record.property.title || record.property.name || 'Land parcel';

export const OwnerLandWorkspace = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...landKeys.owner, { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(landService.listOwnerLand({ page, pageSize: PAGE_SIZE })),
  });

  const records = useMemo(() => data?.items ?? [], [data]);
  const total = data?.total ?? 0;
  const selected = useMemo(
    () => records.find((record) => record.property.id === selectedPropertyId) ?? records[0] ?? null,
    [records, selectedPropertyId]
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: landKeys.owner });
    if (selectedPropertyId) {
      queryClient.invalidateQueries({ queryKey: landKeys.ownerDetail(selectedPropertyId) });
    }
  };

  const saveParcel = useMutation({
    mutationFn: ({ propertyId, parcel }: { propertyId: string; parcel: LandParcelInput }) =>
      unwrap(landService.upsertParcel(propertyId, parcel)),
    onSuccess: () => {
      invalidate();
      setToast({ message: 'Land parcel record saved.', variant: 'success' });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const uploadProof = useMutation({
    mutationFn: ({ propertyId, proof }: { propertyId: string; proof: LandOwnershipProofInput }) =>
      unwrap(landService.submitOwnershipProof(propertyId, proof)),
    onSuccess: () => {
      invalidate();
      setToast({
        message: 'Ownership evidence submitted for compliance review.',
        variant: 'success',
      });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const createLand = useMutation({
    mutationFn: async (input: LandRegistrationInput) => {
      const property = await unwrap(
        ownerService.createProperty({
          ...input.property,
          propertyType: 'LAND',
        })
      );
      try {
        await unwrap(landService.upsertParcel(property.id, input.parcel));
      } catch {
        // Keep the registered LAND property discoverable in the private workspace
        // so the owner can complete the parcel record instead of creating a duplicate.
        return { property, parcelSaved: false, failedProofCount: 0 };
      }

      const proofResult = input.ownershipProof
        ? await Promise.allSettled([
            unwrap(landService.submitOwnershipProof(property.id, input.ownershipProof)),
          ])
        : [];
      return {
        property,
        parcelSaved: true,
        failedProofCount: proofResult.filter((result) => result.status === 'rejected').length,
      };
    },
    onSuccess: ({ property, parcelSaved, failedProofCount }) => {
      setPage(1);
      setSelectedPropertyId(property.id);
      invalidate();
      setToast({
        message: !parcelSaved
          ? 'Land was registered, but parcel details were not saved. Select it from your portfolio to complete the record.'
          : failedProofCount > 0
            ? 'Land was registered. Upload its ownership evidence again from the parcel record to begin review.'
            : 'Land registered. Compliance will now verify its ownership evidence and diligence record.',
        variant: !parcelSaved || failedProofCount > 0 ? 'warning' : 'success',
      });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">Land v1</p>
          <h1 className="mt-1 text-2xl font-bold tracking-[-0.03em] text-foreground">
            Land portfolio
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Register a parcel, submit title evidence, and keep it private until ownership and land
            diligence are verified.
          </p>
        </div>
        <Button
          variant="primary"
          rounded="lg"
          onClick={() => setRegistrationOpen(true)}
          icon={<Plus className="h-4 w-4" />}
        >
          Register land
        </Button>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <Card static className="p-4">
          <p className="text-xs text-muted-foreground">Registered parcels</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{isLoading ? '—' : total}</p>
        </Card>
        <Card static className="p-4">
          <p className="text-xs text-muted-foreground">Ready for sale on this page</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {
              records.filter(
                (record) =>
                  record.diligence?.status === 'VERIFIED' &&
                  record.property.verificationStatus === 'APPROVED'
              ).length
            }
          </p>
        </Card>
        <Card static className="p-4">
          <p className="text-xs text-muted-foreground">Needs action on this page</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {records.filter((record) => record.diligence?.status === 'ACTION_REQUIRED').length}
          </p>
        </Card>
      </section>

      {isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          {error instanceof Error ? error.message : 'Unable to load your land portfolio.'}
        </div>
      ) : isLoading ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)]">
          <div className="h-80 animate-pulse rounded-2xl bg-secondary" />
          <div className="h-[34rem] animate-pulse rounded-2xl bg-secondary" />
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileSearch className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">No land parcels yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Create a land record with its parcel size and title evidence. We will not publish it
            before compliance verifies both ownership and diligence.
          </p>
          <Button
            className="mt-6"
            variant="primary"
            rounded="lg"
            onClick={() => setRegistrationOpen(true)}
          >
            Register your first parcel
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(18rem,0.78fr)_minmax(0,1.45fr)]">
          <div className="space-y-3">
            {records.map((record) => {
              const active = selected?.property.id === record.property.id;
              const parcel = record.parcel;
              return (
                <button
                  key={record.property.id}
                  type="button"
                  onClick={() => setSelectedPropertyId(record.property.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition-all ${
                    active
                      ? 'border-primary bg-accent shadow-[0_12px_32px_rgba(0,0,0,0.08)]'
                      : 'border-border bg-card hover:border-foreground/20 hover:bg-secondary/35'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-foreground">{titleOf(record)}</h2>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {record.property.city}, {record.property.state}
                      </p>
                    </div>
                    <LandDiligenceBadge
                      status={record.diligence?.status ?? parcel?.diligence?.status}
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Ruler className="h-3.5 w-3.5" />
                      {parcel
                        ? `${parcel.areaValue} ${LAND_AREA_UNIT_LABELS[parcel.areaUnit]}`
                        : 'Parcel details missing'}
                    </span>
                    {typeof record.property.estimatedValue === 'number' && (
                      <span className="font-medium text-foreground">
                        {formatCurrency(record.property.estimatedValue, { compact: true })}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {total > 0 && (
              <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
            )}
          </div>

          {selected && (
            <div>
              <LandParcelEditor
                key={selected.property.id}
                record={selected}
                isSaving={saveParcel.isPending}
                onSave={async (parcel) => {
                  await saveParcel.mutateAsync({ propertyId: selected.property.id, parcel });
                }}
                onUploadProof={async (proof) => {
                  await uploadProof.mutateAsync({ propertyId: selected.property.id, proof });
                }}
              />
              {selected.diligence?.status === 'VERIFIED' &&
                selected.property.verificationStatus === 'APPROVED' && (
                  <div className="mt-4 rounded-2xl border border-success/25 bg-success/5 p-4">
                    <div className="flex gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                      <div>
                        <p className="font-medium text-foreground">Ready to list</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          This land parcel has passed both gates. Continue to the normal sale
                          listing flow—offers and escrow remain the same.
                        </p>
                        <Button
                          href={ROUTES.OWNER_LISTINGS}
                          variant="outline"
                          size="sm"
                          rounded="lg"
                          className="mt-3"
                          iconPosition="right"
                          icon={<ArrowRight className="h-4 w-4" />}
                        >
                          Create sale listing
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      )}

      <LandRegistrationDialog
        open={registrationOpen}
        onOpenChange={setRegistrationOpen}
        onCreate={async (input) => {
          await createLand.mutateAsync(input);
        }}
      />

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
};
