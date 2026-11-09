'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DocumentUpload,
  Field,
  Input,
  ListSkeleton,
  NumberInput,
  Pagination,
  RadioGroup,
  Select,
} from '@sureground/ui';
import { estateService } from '@/services/estateService';
import { ApiError, unwrap } from '@/lib/apiHelpers';
import type { DeliveryCodeScreen, Gate, Household } from '@/types/estate';

interface LogDeliveryModalProps {
  isOpen: boolean;
  estateId: string;
  households: Household[];
  householdTotal: number;
  householdPage: number;
  householdPageSize: number;
  onHouseholdPageChange: (page: number) => void;
  isHouseholdsLoading?: boolean;
  gates?: Gate[];
  onClose: () => void;
  onSubmit: (data: {
    householdId?: string;
    code?: string;
    courier?: string;
    recipientName?: string;
    gateId?: string;
    photo?: File;
  }) => void;
  isSubmitting?: boolean;
}

// Form state lives in LogDeliveryForm, mounted only while open: the parent closes this on success without calling onClose, so the next opening must not inherit a spent code.
export const LogDeliveryModal = ({ isOpen, ...props }: LogDeliveryModalProps) => (
  <Dialog open={isOpen} onOpenChange={(next) => !next && props.onClose()}>
    <LogDeliveryForm {...props} />
  </Dialog>
);

type FormProps = Omit<LogDeliveryModalProps, 'isOpen'>;

const LogDeliveryForm = ({
  estateId,
  households,
  householdTotal,
  householdPage,
  householdPageSize,
  onHouseholdPageChange,
  isHouseholdsLoading,
  gates,
  onClose,
  onSubmit,
  isSubmitting,
}: FormProps) => {
  const [householdId, setHouseholdId] = useState('');
  const [code, setCode] = useState('');
  const [screen, setScreen] = useState<DeliveryCodeScreen | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [courier, setCourier] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [gateId, setGateId] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const gateOptions = (gates ?? []).map((gate) => ({ value: gate.id, label: gate.name }));

  const activeHouseholds = households.filter((h) => h.status === 'active');
  const matched = screen?.matched === true;

  const checkCode = useMutation({
    mutationFn: () => unwrap(estateService.verifyDeliveryCode(estateId, code.trim())),
    onSuccess: (result) => {
      setScreen(result);
      setCheckError(null);
      if (result.matched && result.courier) setCourier((current) => current || result.courier!);
    },
    onError: (error) => {
      setScreen(null);
      setCheckError(
        error instanceof ApiError ? error.message : 'Could not check that code just now.'
      );
    },
  });

  const clearCode = () => {
    setCode('');
    setScreen(null);
    setCheckError(null);
  };

  const canSubmit = matched || householdId.length > 0;

  const handleSubmit = () => {
    onSubmit({
      // A verified code is sent instead of a household, never alongside one.
      ...(matched ? { code: code.trim() } : { householdId }),
      courier: courier.trim() || undefined,
      recipientName: recipientName.trim() || undefined,
      gateId: gateId || undefined,
      photo: photo ?? undefined,
    });
  };

  return (
    <DialogContent size="md">
      <DialogTitle className="text-lg font-semibold text-foreground">Log delivery</DialogTitle>

      <div className="mt-4 space-y-4">
        <div className="rounded-lg border border-border p-3">
          <Field label="Courier's code" htmlFor="delivery-code">
            <div className="flex gap-2">
              <NumberInput
                className="min-w-0 flex-1"
                value={code}
                onValueChange={(value) => {
                  setCode(value);
                  // Any edit invalidates the last match, so a stale household never shows beside a changed code.
                  if (screen || checkError) {
                    setScreen(null);
                    setCheckError(null);
                  }
                }}
                placeholder="e.g. 472913"
              />
              <Button
                variant="secondary"
                className="shrink-0"
                disabled={code.trim().length < 6}
                isLoading={checkCode.isPending}
                loadingText="Checking…"
                onClick={() => checkCode.mutate()}
              >
                Check
              </Button>
            </div>
          </Field>

          {matched && (
            <Alert variant="success" title={screen?.unitLabel} className="mt-3">
              <p className="text-xs">{screen?.message}</p>
              <p className="mt-1 text-xs">{screen?.instruction}</p>
              <Button
                variant="link"
                onClick={clearCode}
                className="mt-2 text-xs font-normal text-muted-foreground underline hover:text-foreground"
              >
                Use a different code
              </Button>
            </Alert>
          )}

          {screen && !screen.matched && (
            // Shown as-is: the refusal is identical for wrong, expired or used codes, so it can't reveal whether a household exists.
            <Alert variant="warning" className="mt-3">
              <p className="text-xs">
                {screen.message} {screen.instruction}
              </p>
            </Alert>
          )}

          {checkError && (
            <p role="alert" className="mt-3 text-xs text-destructive">
              {checkError}
            </p>
          )}

          <p className="mt-2 text-xs text-muted-foreground">
            Checking a code does not use it up. Only taking the parcel in does.
          </p>
        </div>

        {matched ? (
          <p className="text-xs text-muted-foreground">
            This parcel will be recorded against {screen?.unitLabel}, because that is the household
            the code belongs to.
          </p>
        ) : (
          <Field label="Household" required>
            <div className="overflow-hidden rounded-lg border border-border">
              {isHouseholdsLoading ? (
                <ListSkeleton
                  rows={3}
                  label="Loading households"
                  className="rounded-none border-0"
                />
              ) : activeHouseholds.length === 0 ? (
                <p className="px-3 py-4 text-sm text-muted-foreground">
                  No active households found.
                </p>
              ) : (
                <RadioGroup
                  value={householdId}
                  onValueChange={setHouseholdId}
                  options={activeHouseholds.map((household) => ({
                    value: household.id,
                    label: `${household.unitLabel}: ${household.residentName}`,
                  }))}
                  className="p-3"
                />
              )}
              {householdTotal > 0 && (
                <Pagination
                  page={householdPage}
                  pageSize={householdPageSize}
                  total={householdTotal}
                  onPageChange={onHouseholdPageChange}
                />
              )}
            </div>
          </Field>
        )}

        <Field label="Courier" optionalLabel="(optional)">
          <Input
            type="text"
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            placeholder="e.g. DHL"
          />
        </Field>

        <Field label="Recipient" optionalLabel="(optional)">
          <Input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="e.g. Ada Okafor"
          />
        </Field>

        {gateOptions.length > 0 && (
          <Field label="Gate">
            <Select
              value={gateId}
              onValueChange={setGateId}
              options={[{ value: '', label: 'Not specified' }, ...gateOptions]}
            />
          </Field>
        )}

        <div>
          <p className="block text-sm font-medium text-foreground mb-1">
            Photo <span className="text-muted-foreground font-normal">(optional)</span>
          </p>
          <DocumentUpload
            value={photo ? [{ id: 'photo', file: photo }] : []}
            onChange={(items) => setPhoto(items[0]?.file ?? null)}
            accept="image/*"
            multiple={false}
            label=""
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={!canSubmit}
          isLoading={isSubmitting}
          loadingText="Logging…"
          onClick={handleSubmit}
        >
          Log delivery
        </Button>
      </div>
    </DialogContent>
  );
};
