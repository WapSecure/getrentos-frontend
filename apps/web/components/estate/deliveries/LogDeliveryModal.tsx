'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import {
  Alert,
  Button,
  DocumentUpload,
  Field,
  IconButton,
  Input,
  ListSkeleton,
  NumberInput,
  Pagination,
  Select,
} from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { ApiError, unwrap } from '@/lib/apiHelpers';
import type { DeliveryCodeScreen, Gate, Household } from '@/types/estate';

interface LogDeliveryModalProps {
  isOpen: boolean;
  /** The estate the parcel is being logged against, needed to check a code. */
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

/**
 * Logging a parcel at the gate, by one of two routes.
 *
 * The guard either picks the household from a list: because the courier said a
 * name and the guard recognised it: or the courier presents the code the
 * household sent them, in which case the household names itself and the guard
 * does not choose at all.
 *
 * The code route is offered first, and deliberately: everything about the old
 * route rests on the guard's recollection of what was said at a barrier, and the
 * parcel ends up recorded against whoever that suggested. A code removes the
 * guess.
 *
 * The shell below is thin on purpose. All the form's state lives in
 * `LogDeliveryForm`, which is only mounted while the dialog is open, so the next
 * opening cannot inherit the last one's household or an already-spent code: the
 * parent closes this dialog itself on success and never calls `onClose`, so
 * "clear the fields on close" was never going to cover that case.
 */
export const LogDeliveryModal = ({ isOpen, ...props }: LogDeliveryModalProps) => (
  <AnimatePresence>{isOpen && <LogDeliveryForm {...props} />}</AnimatePresence>
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
      // A match pre-fills the courier, so the guard is not retyping what the
      // household already told the estate.
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
      // A verified code is sent INSTEAD of a household, never alongside one: a
      // guard holding a code does not get to overrule it with somebody they
      // picked, and the server would ignore it anyway.
      ...(matched ? { code: code.trim() } : { householdId }),
      courier: courier.trim() || undefined,
      recipientName: recipientName.trim() || undefined,
      gateId: gateId || undefined,
      photo: photo ?? undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-card rounded-xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="p-4 border-b border-border flex justify-between items-center shrink-0">
          <h3 className="font-semibold text-foreground">Log Delivery</h3>
          <IconButton label="Close" icon={<X />} size="sm" onClick={onClose} />
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <div className="rounded-lg border border-border p-3">
            <Field label="Courier's code" htmlFor="delivery-code">
              <div className="flex gap-2">
                <NumberInput
                  className="min-w-0 flex-1"
                  value={code}
                  onValueChange={(value) => {
                    setCode(value);
                    // Any edit invalidates the last answer. Showing a stale "this is
                    // for Block C" beside a code the guard has since changed is worse
                    // than showing nothing.
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
                <button
                  type="button"
                  onClick={clearCode}
                  className="mt-2 text-xs text-muted-foreground underline hover:text-foreground"
                >
                  Use a different code
                </button>
              </Alert>
            )}

            {screen && !screen.matched && (
              // Worded by the server and shown as-is. The refusal says the same
              // thing whether the code was wrong, expired or already used, so this
              // screen cannot be used to work out whether a household exists here.
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
              This parcel will be recorded against {screen?.unitLabel}, because that is the
              household the code belongs to.
            </p>
          ) : (
            <div>
              <p className="block text-sm font-medium text-foreground mb-1">Household</p>
              <div className="overflow-hidden rounded-lg border border-border">
                {isHouseholdsLoading ? (
                  <ListSkeleton rows={3} label="Loading households" className="rounded-none border-0" />
                ) : activeHouseholds.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-muted-foreground">
                    No active households found.
                  </p>
                ) : (
                  <div className="divide-y divide-border" role="radiogroup" aria-label="Household">
                    {activeHouseholds.map((household) => {
                      const isSelected = household.id === householdId;
                      return (
                        <button
                          key={household.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => setHouseholdId(household.id)}
                          className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors ${
                            isSelected
                              ? 'bg-primary/10 text-primary'
                              : 'text-foreground hover:bg-secondary'
                          }`}
                        >
                          <span>
                            {household.unitLabel}: {household.residentName}
                          </span>
                          <span
                            aria-hidden="true"
                            className={`h-3 w-3 shrink-0 rounded-full border ${
                              isSelected
                                ? 'border-primary bg-primary'
                                : 'border-muted-foreground/50'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
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
            </div>
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

        <div className="p-4 border-t border-border flex gap-3 shrink-0">
          <Button variant="ghost" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            fullWidth
            disabled={!canSubmit}
            isLoading={isSubmitting}
            loadingText="Logging…"
            onClick={handleSubmit}
          >
            Log Delivery
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
