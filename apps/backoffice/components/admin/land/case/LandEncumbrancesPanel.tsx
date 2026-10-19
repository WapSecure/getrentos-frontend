'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Landmark, Plus } from 'lucide-react';
import {
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
  Select,
  Textarea,
  DatePicker,
} from '@getrentos/ui';
import { formatDate, unwrap } from '@getrentos/shared';
import { adminLandService } from '@/services/adminLandService';
import {
  LAND_ENCUMBRANCE_KINDS,
  type LandDiligenceDocument,
  type LandEncumbrance,
  type LandEncumbranceKind,
  type RecordLandEncumbranceInput,
} from '@/types/land';
import { humaniseEnum, landQueryKeys } from '@/lib/landDiligence';
import {
  fromDateInput,
  LandCaseSection,
  PanelMessage,
  useInvalidateLandCase,
  type LandCasePanelProps,
} from './shared';

const emptyForm = {
  kind: 'CAVEAT' as LandEncumbranceKind,
  reference: '',
  holder: '',
  description: '',
  source: '',
  notedAt: '',
  documentId: '',
};

/**
 * The encumbrance register: caveats, mortgages, suits and acquisitions found
 * on the title. An active one blocks approval until it is discharged.
 */
export const LandEncumbrancesPanel = ({
  propertyId,
  documents,
  canReview,
  canApprove,
  onError,
  onSuccess,
}: LandCasePanelProps & { documents: LandDiligenceDocument[] }) => {
  const invalidate = useInvalidateLandCase();
  const [recording, setRecording] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [discharging, setDischarging] = useState<LandEncumbrance | null>(null);
  const [dischargeNote, setDischargeNote] = useState('');

  const register = useQuery({
    queryKey: landQueryKeys.caseSection(propertyId, 'encumbrances'),
    queryFn: () => unwrap(adminLandService.listEncumbrances(propertyId)),
  });

  const record = useMutation({
    mutationFn: (input: RecordLandEncumbranceInput) =>
      unwrap(adminLandService.recordEncumbrance(propertyId, input)),
    onSuccess: () => {
      invalidate();
      setRecording(false);
      setForm(emptyForm);
      onSuccess('Encumbrance recorded. It blocks approval until discharged.');
    },
    onError: (error) => onError(error, 'Unable to record that encumbrance.'),
  });

  const discharge = useMutation({
    mutationFn: (encumbranceId: string) =>
      unwrap(
        adminLandService.dischargeEncumbrance(propertyId, encumbranceId, {
          note: dischargeNote.trim(),
        })
      ),
    onSuccess: () => {
      invalidate();
      onSuccess('Encumbrance discharged.');
    },
    onError: (error) => onError(error, 'Unable to discharge that encumbrance.'),
  });

  const items = register.data ?? [];
  const active = items.filter((item) => item.status === 'ACTIVE').length;
  const set = (patch: Partial<typeof emptyForm>) =>
    setForm((current) => ({ ...current, ...patch }));
  const optional = (value: string) => value.trim() || undefined;

  return (
    <LandCaseSection
      title="Encumbrance register"
      icon={Landmark}
      description={items.length ? `${active} active of ${items.length} recorded` : undefined}
      actions={
        canReview && (
          <Button
            variant="outline"
            size="xs"
            onClick={() => setRecording(true)}
            icon={<Plus className="h-3.5 w-3.5" />}
          >
            Record
          </Button>
        )
      }
    >
      {register.isLoading ? (
        <PanelMessage>Loading the register…</PanelMessage>
      ) : register.isError ? (
        <PanelMessage>
          {register.error instanceof Error
            ? register.error.message
            : 'The register is unavailable.'}
        </PanelMessage>
      ) : items.length === 0 ? (
        <PanelMessage>No encumbrance has been recorded against this title.</PanelMessage>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-border p-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {humaniseEnum(item.kind)}
                    {item.reference && (
                      <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                        {item.reference}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.holder && `${item.holder} · `}noted {formatDate(item.notedAt)} by{' '}
                    {item.recordedByName}
                    {item.source && ` · ${item.source}`}
                  </p>
                  {item.description && (
                    <p className="mt-1 whitespace-pre-wrap text-foreground">{item.description}</p>
                  )}
                  {item.status !== 'ACTIVE' && item.dischargeNote && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Discharged{item.dischargedAt && ` ${formatDate(item.dischargedAt)}`}: “
                      {item.dischargeNote}”
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={item.status === 'ACTIVE' ? 'danger' : 'neutral'}>
                    {humaniseEnum(item.status)}
                  </Badge>
                  {canApprove && item.status === 'ACTIVE' && (
                    <Button variant="ghost" size="xs" onClick={() => setDischarging(item)}>
                      Discharge
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={recording}
        onOpenChange={(open) => !open && !record.isPending && setRecording(false)}
      >
        {recording && (
          <DialogContent className="max-w-lg">
            <div className="space-y-3 p-5">
              <DialogTitle className="type-heading text-lg">Record an encumbrance</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Anything found on the title that limits a sale. It blocks approval until it is
                discharged.
              </DialogDescription>
              <Field label="Kind" required>
                <Select
                  value={form.kind}
                  onValueChange={(value) => set({ kind: value as LandEncumbranceKind })}
                  ariaLabel="Encumbrance kind"
                  options={LAND_ENCUMBRANCE_KINDS.map((kind) => ({
                    value: kind,
                    label: humaniseEnum(kind),
                  }))}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Registry / suit number">
                  <Input
                    value={form.reference}
                    maxLength={200}
                    onChange={(e) => set({ reference: e.target.value })}
                  />
                </Field>
                <Field label="Holder">
                  <Input
                    value={form.holder}
                    maxLength={200}
                    placeholder="e.g. mortgagee bank"
                    onChange={(e) => set({ holder: e.target.value })}
                  />
                </Field>
                <Field label="Source">
                  <Input
                    value={form.source}
                    maxLength={300}
                    placeholder="e.g. Lands Registry search, 3 Oct"
                    onChange={(e) => set({ source: e.target.value })}
                  />
                </Field>
                <Field label="Noted on" hint="Defaults to today.">
                  <DatePicker value={form.notedAt} onChange={(next) => set({ notedAt: next })} />
                </Field>
              </div>
              <Field label="Description">
                <Textarea
                  value={form.description}
                  maxLength={2000}
                  onChange={(e) => set({ description: e.target.value })}
                />
              </Field>
              {documents.length > 0 && (
                <Field label="Evidencing document">
                  <Select
                    value={form.documentId}
                    onValueChange={(value) => set({ documentId: value })}
                    ariaLabel="Evidencing document"
                    options={[
                      { value: '', label: 'None' },
                      ...documents.map((document) => ({
                        value: document.id,
                        label: document.name,
                      })),
                    ]}
                  />
                </Field>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="ghost"
                  onClick={() => setRecording(false)}
                  disabled={record.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  isLoading={record.isPending}
                  onClick={() =>
                    record.mutate({
                      kind: form.kind,
                      reference: optional(form.reference),
                      holder: optional(form.holder),
                      description: optional(form.description),
                      source: optional(form.source),
                      notedAt: fromDateInput(form.notedAt),
                      documentId: optional(form.documentId),
                    })
                  }
                >
                  Record encumbrance
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      <ConfirmDialog
        open={Boolean(discharging)}
        onOpenChange={(open) => {
          if (!open) {
            setDischarging(null);
            setDischargeNote('');
          }
        }}
        title="Discharge this encumbrance?"
        description={`Record that the ${humaniseEnum(discharging?.kind).toLowerCase()} ${
          discharging?.reference ?? ''
        } no longer burdens the title. Only do this on evidence such as a registered deed of release.`}
        confirmLabel="Discharge"
        promptLabel="How it was discharged"
        promptPlaceholder="e.g. Deed of release registered 12/2026"
        promptValue={dischargeNote}
        onPromptChange={setDischargeNote}
        promptRequired
        promptMinLength={3}
        isLoading={discharge.isPending}
        onConfirm={async () => {
          if (discharging) await discharge.mutateAsync(discharging.id).catch(() => undefined);
        }}
      />
    </LandCaseSection>
  );
};
