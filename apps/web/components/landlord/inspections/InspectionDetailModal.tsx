'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DocumentUpload,
  Button,
  Badge,
  CardSkeleton,
  Field,
  PageErrorState,
  Select,
  Input,
  Textarea,
  CurrencyInput,
  type BadgeVariant,
  type PendingUpload,
} from '@getrentos/ui';
import { Plus, Camera, Share2, CheckCircle2 } from 'lucide-react';
import {
  inspectionService,
  INSPECTION_CONDITIONS,
  INSPECTION_CONDITION_LABELS,
  INSPECTION_STATUS_LABELS,
  INSPECTION_TYPE_LABELS,
  type InspectionCondition,
  type InspectionStatus,
} from '@/services/inspectionService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';

const CONDITION_VARIANT: Record<InspectionCondition, BadgeVariant> = {
  GOOD: 'success',
  FAIR: 'info',
  POOR: 'warning',
  DAMAGED: 'danger',
};

const STATUS_VARIANT: Record<InspectionStatus, BadgeVariant> = {
  DRAFT: 'neutral',
  COMPLETED: 'info',
  SHARED: 'success',
};

const formatNaira = (amount: number) =>
  `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;

interface InspectionDetailModalProps {
  inspectionId: string | null;
  onClose: () => void;
  onChanged: () => void;
}

export const InspectionDetailModal = ({
  inspectionId,
  onClose,
  onChanged,
}: InspectionDetailModalProps) => {
  const queryClient = useQueryClient();
  /** The finding a photo is being added to, while the photo picker is open. */
  const [photoFor, setPhotoFor] = useState<{ id: string; area: string } | null>(null);
  const [pendingPhotos, setPendingPhotos] = useState<PendingUpload[]>([]);

  // New-item form state.
  const [area, setArea] = useState('');
  const [condition, setCondition] = useState<InspectionCondition>('GOOD');
  const [notes, setNotes] = useState('');
  const [cost, setCost] = useState<number>(0);

  const {
    data: inspection,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: inspectionId ? landlordKeys.inspection(inspectionId) : ['inspection', 'none'],
    queryFn: () => unwrap(inspectionService.get(inspectionId!)),
    enabled: Boolean(inspectionId),
  });

  const afterChange = () => {
    if (inspectionId) {
      queryClient.invalidateQueries({ queryKey: landlordKeys.inspection(inspectionId) });
    }
    queryClient.invalidateQueries({ queryKey: ['landlord', 'inspections'] });
    onChanged();
  };

  const addItemMutation = useMutation({
    mutationFn: () =>
      unwrap(
        inspectionService.addItem(inspectionId!, {
          area: area.trim(),
          condition,
          notes: notes.trim() || undefined,
          estimatedCost: cost > 0 ? cost : undefined,
        })
      ),
    onSuccess: () => {
      setArea('');
      setCondition('GOOD');
      setNotes('');
      setCost(0);
      afterChange();
    },
  });

  const addPhotoMutation = useMutation({
    mutationFn: async ({ itemId, files }: { itemId: string; files: File[] }) => {
      for (const file of files)
        await unwrap(inspectionService.addPhoto(inspectionId!, itemId, file));
    },
    onSuccess: () => {
      setPhotoFor(null);
      setPendingPhotos([]);
      afterChange();
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => unwrap(inspectionService.complete(inspectionId!)),
    onSuccess: afterChange,
  });

  const shareMutation = useMutation({
    mutationFn: () => unwrap(inspectionService.share(inspectionId!)),
    onSuccess: afterChange,
  });

  const closePhotoPicker = () => {
    if (addPhotoMutation.isPending) return;
    setPhotoFor(null);
    setPendingPhotos([]);
    addPhotoMutation.reset();
  };

  const isDraft = inspection?.status === 'DRAFT';
  const isCompleted = inspection?.status === 'COMPLETED';

  return (
    <Dialog open={Boolean(inspectionId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-2xl">
        <div className="max-h-[85vh] overflow-y-auto p-6">
          {isLoading ? (
            <CardSkeleton lines={5} />
          ) : !inspection ? (
            <PageErrorState
              headingLevel="h2"
              className="min-h-0 py-10"
              title="This inspection did not load"
              onRetry={() => void refetch()}
              isRetrying={isRefetching}
            />
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-foreground">
                    {inspection.propertyTitle ?? 'Property'}
                  </h2>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="neutral">{INSPECTION_TYPE_LABELS[inspection.type]}</Badge>
                    <Badge variant={STATUS_VARIANT[inspection.status]}>
                      {INSPECTION_STATUS_LABELS[inspection.status]}
                    </Badge>
                  </p>
                </div>
                {inspection.estimatedRemedialCost > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Estimated remedial</p>
                    <p className="font-semibold text-foreground">
                      {formatNaira(inspection.estimatedRemedialCost)}
                    </p>
                  </div>
                )}
              </div>

              {inspection.summaryNotes && (
                <p className="rounded-xl bg-secondary p-3 text-sm text-muted-foreground">
                  {inspection.summaryNotes}
                </p>
              )}

              {/* Items */}
              <div className="space-y-3">
                {inspection.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No areas recorded yet.</p>
                ) : (
                  inspection.items.map((item) => (
                    <div key={item.id} className="rounded-xl border border-border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-foreground">{item.area}</span>
                        <Badge variant={CONDITION_VARIANT[item.condition]}>
                          {INSPECTION_CONDITION_LABELS[item.condition]}
                        </Badge>
                      </div>
                      {item.notes && (
                        <p className="mt-1.5 text-sm text-muted-foreground">{item.notes}</p>
                      )}
                      {item.estimatedCost != null && item.estimatedCost > 0 && (
                        <p className="mt-1 text-sm text-foreground">
                          Remedial: {formatNaira(item.estimatedCost)}
                        </p>
                      )}
                      {item.photos.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.photos.map((photo) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={photo.id}
                              src={photo.url}
                              alt={photo.caption ?? item.area}
                              className="h-20 w-20 rounded-lg object-cover"
                            />
                          ))}
                        </div>
                      )}
                      {isDraft && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 gap-1.5"
                          onClick={() => setPhotoFor({ id: item.id, area: item.area })}
                          aria-label={`Add photo of ${item.area}`}
                        >
                          <Camera className="h-4 w-4" />
                          Add photo
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Add-item form (draft only) */}
              {isDraft && (
                <div className="space-y-3 rounded-xl border border-dashed border-border p-4">
                  <p className="text-sm font-medium text-foreground">Add an area</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Area" required>
                      <Input
                        placeholder="e.g. Kitchen"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                      />
                    </Field>
                    <Field label="Condition">
                      <Select
                        value={condition}
                        onValueChange={(v) => setCondition(v as InspectionCondition)}
                        searchable={false}
                        options={INSPECTION_CONDITIONS.map((c) => ({
                          value: c,
                          label: INSPECTION_CONDITION_LABELS[c],
                        }))}
                      />
                    </Field>
                  </div>
                  <Field label="Notes (optional)">
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                  </Field>
                  <div className="flex flex-wrap items-end gap-3">
                    <Field label="Estimated remedial cost (optional)" className="min-w-0 flex-1">
                      <CurrencyInput value={cost} onValueChange={setCost} placeholder="0" />
                    </Field>
                    <Button
                      variant="secondary"
                      className="gap-1.5"
                      onClick={() => addItemMutation.mutate()}
                      disabled={!area.trim()}
                      isLoading={addItemMutation.isPending}
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </div>
              )}

              {/* Lifecycle actions */}
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                {isDraft && (
                  <Button
                    variant="primary"
                    className="gap-1.5"
                    onClick={() => completeMutation.mutate()}
                    disabled={inspection.items.length === 0}
                    isLoading={completeMutation.isPending}
                    loadingText="Completing…"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Complete
                  </Button>
                )}
                {isCompleted && inspection.canShareWithOwner && (
                  <Button
                    variant="primary"
                    className="gap-1.5"
                    onClick={() => shareMutation.mutate()}
                    isLoading={shareMutation.isPending}
                    loadingText="Sharing…"
                  >
                    <Share2 className="h-4 w-4" />
                    Share with owner
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <Dialog open={photoFor !== null} onOpenChange={(open) => !open && closePhotoPicker()}>
          <DialogContent className="w-full max-w-md">
            <div className="space-y-4 p-6">
              <div>
                <DialogTitle className="text-lg font-semibold text-foreground">
                  Add photos{photoFor ? ` of ${photoFor.area}` : ''}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  They become part of the inspection record.
                </DialogDescription>
              </div>
              <DocumentUpload
                value={pendingPhotos}
                onChange={setPendingPhotos}
                accept=".jpg,.jpeg,.png,.webp"
                multiple
                capture="environment"
                label="Photos"
                hint="JPG, PNG or WebP, up to 10 MB each."
                disabled={addPhotoMutation.isPending}
              />
              {addPhotoMutation.isError && (
                <p className="text-sm text-destructive">
                  {(addPhotoMutation.error as Error).message || 'A photo did not upload.'}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={closePhotoPicker}
                  disabled={addPhotoMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    photoFor &&
                    addPhotoMutation.mutate({
                      itemId: photoFor.id,
                      files: pendingPhotos.map((p) => p.file),
                    })
                  }
                  disabled={pendingPhotos.length === 0}
                  isLoading={addPhotoMutation.isPending}
                  loadingText="Uploading…"
                >
                  Upload
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};
