'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { Button, DocumentUpload, LegacyInput, Pagination, Select } from '@getrentos/ui';
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
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <div className="rounded-lg border border-border p-3">
            <label
              htmlFor="delivery-code"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Courier&apos;s code
            </label>
            <div className="flex gap-2">
              <LegacyInput
                id="delivery-code"
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
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
                disabled={code.trim().length < 6 || checkCode.isPending}
                onClick={() => checkCode.mutate()}
              >
                {checkCode.isPending ? 'Checking…' : 'Check'}
              </Button>
            </div>

            {matched && (
              <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-primary" />
                  {screen?.unitLabel}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{screen?.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{screen?.instruction}</p>
                <button
                  type="button"
                  onClick={clearCode}
                  className="mt-2 text-xs text-muted-foreground underline hover:text-foreground"
                >
                  Use a different code
                </button>
              </div>
            )}

            {screen && !screen.matched && (
              // Worded by the server and shown as-is. The refusal says the same
              // thing whether the code was wrong, expired or already used, so this
              // screen cannot be used to work out whether a household exists here.
              <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
                <p className="flex items-start gap-2 text-xs text-foreground">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    {screen.message} {screen.instruction}
                  </span>
                </p>
              </div>
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
              <label className="block text-sm font-medium text-foreground mb-1">Household</label>
              <div className="overflow-hidden rounded-lg border border-border">
                {isHouseholdsLoading ? (
                  <p className="px-3 py-4 text-sm text-muted-foreground">Loading households…</p>
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

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Courier <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <LegacyInput
              type="text"
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              placeholder="e.g. DHL"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Recipient <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <LegacyInput
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g. Ada Okafor"
            />
          </div>

          {gateOptions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Gate</label>
              <Select
                value={gateId}
                onValueChange={setGateId}
                options={[{ value: '', label: 'Not specified' }, ...gateOptions]}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Photo <span className="text-gray-400 font-normal">(optional)</span>
            </label>
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
            disabled={!canSubmit || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Logging…' : 'Log Delivery'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
