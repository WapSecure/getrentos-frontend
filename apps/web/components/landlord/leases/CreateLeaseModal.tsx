'use client';

import { useState, useMemo } from 'react';
import { addYears, subDays, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BadgeCheck, DoorOpen } from 'lucide-react';
import {
  Alert,
  Button,
  CurrencyInput,
  DatePicker,
  EmptyState,
  Field,
  IconButton,
  Input,
  Select,
} from '@getrentos/ui';
import type { Lease, Unit } from '@/types/landlord';

interface CreateLeaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  vacantUnits: Unit[];
  onSave: (
    lease: Omit<Lease, 'id' | 'status' | 'createdAt' | 'tenantSigned' | 'landlordSigned'>,
    sendImmediately: boolean
  ) => Promise<boolean>;
}

export const CreateLeaseModal = ({
  isOpen,
  onClose,
  vacantUnits,
  onSave,
}: CreateLeaseModalProps) => {
  const [unitId, setUnitId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [leaseStart, setLeaseStart] = useState('');
  const [leaseEnd, setLeaseEnd] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [submitting, setSubmitting] = useState<'draft' | 'send' | null>(null);
  const isSubmitting = submitting !== null;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedUnit = useMemo(
    () => vacantUnits.find((u) => u.id === unitId),
    [vacantUnits, unitId]
  );

  const handleUnitChange = (id: string) => {
    setUnitId(id);
    const unit = vacantUnits.find((u) => u.id === id);
    // The unit's asking rent: the price the landlord set and the advert
    // publishes, so the lease starts from the same figure.
    if (unit && !rentAmount) setRentAmount(String(unit.askingRent ?? ''));
    // An approved applicant is the tenant: prefill rather than make the
    // landlord retype a name we already hold.
    if (unit?.approvedApplicant) {
      setTenantName(unit.approvedApplicant.name);
      // Auto-draft the lease for an approved applicant: default a standard
      // 12-month term starting today, so the landlord reviews and sends
      // instead of re-entering everything (and spares them clicking the date
      // picker forward a year). They can still change either date.
      const today = new Date();
      if (!leaseStart) setLeaseStart(format(today, 'yyyy-MM-dd'));
      if (!leaseEnd) setLeaseEnd(format(subDays(addYears(today, 1), 1), 'yyyy-MM-dd'));
    }
  };

  const reset = () => {
    setUnitId('');
    setTenantName('');
    setLeaseStart('');
    setLeaseEnd('');
    setRentAmount('');
    setSecurityDeposit('');
    setErrorMessage(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const isValid =
    selectedUnit && tenantName.trim() && leaseStart && leaseEnd && Number(rentAmount) > 0;

  const buildLease = (): Omit<
    Lease,
    'id' | 'status' | 'createdAt' | 'tenantSigned' | 'landlordSigned'
  > | null => {
    if (!selectedUnit || !isValid) return null;
    return {
      tenantId: selectedUnit.approvedApplicant?.userId ?? '',
      tenantName: tenantName.trim(),
      propertyId: selectedUnit.propertyId,
      propertyName: selectedUnit.propertyName,
      unitId: selectedUnit.id,
      unitName: selectedUnit.unitName,
      leaseStart,
      leaseEnd,
      rentAmount: Number(rentAmount),
      // Default to yearly: rent in Nigeria is let by the year, and the vacant-unit
      // list does not always carry the unit's period. Without this the lease is
      // saved with no cadence and the card falls back to the term dates — a short
      // test term then reads "Monthly rent" on an amount that is really annual.
      rentPeriod: selectedUnit.askingRentPeriod ?? 'year',
      securityDeposit: securityDeposit ? Number(securityDeposit) : undefined,
    };
  };

  const handleSave = async (sendImmediately: boolean) => {
    const lease = buildLease();
    if (!lease || isSubmitting) return;
    setSubmitting(sendImmediately ? 'send' : 'draft');
    setErrorMessage(null);
    const succeeded = await onSave(lease, sendImmediately);
    setSubmitting(null);
    if (!succeeded) {
      setErrorMessage(
        sendImmediately
          ? 'The lease could not be created and sent. Please review the details and try again.'
          : 'The lease draft could not be saved. Please review the details and try again.'
      );
      return;
    }
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b border-border flex justify-between items-center gap-3 shrink-0">
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground">Create Lease</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Draft a new lease agreement</p>
              </div>
              <IconButton label="Close" size="sm" icon={<X />} onClick={handleClose} />
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {vacantUnits.length === 0 ? (
                <EmptyState
                  icon={DoorOpen}
                  title="No vacant units available"
                  description="Mark a unit vacant or add a property first."
                  size="compact"
                  bare
                />
              ) : (
                <>
                  <Field label="Unit" required>
                    <Select
                      value={unitId}
                      onValueChange={handleUnitChange}
                      placeholder="Select a vacant unit"
                      options={vacantUnits.map((u) => ({
                        value: u.id,
                        label: `${u.propertyName}: ${u.unitName}`,
                      }))}
                    />
                  </Field>

                  <div>
                    <Field label="Tenant Name" required>
                      <Input
                        type="text"
                        value={tenantName}
                        onChange={(e) => setTenantName(e.target.value)}
                        placeholder="Full legal name"
                      />
                    </Field>
                    {selectedUnit?.approvedApplicant ? (
                      <p className="mt-1.5 flex items-start gap-1.5 text-xs text-success">
                        <BadgeCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>
                          {selectedUnit.approvedApplicant.name} was approved for this unit. This
                          lease is linked to their account so they can review and sign it in their
                          own portal.
                        </span>
                      </p>
                    ) : (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        No approved applicant for this unit: the lease is recorded against this name
                        only, and the tenant will not see it in a GetRentos account.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Lease Start" required>
                      <DatePicker value={leaseStart} onChange={setLeaseStart} />
                    </Field>
                    <Field label="Lease End" required>
                      <DatePicker value={leaseEnd} onChange={setLeaseEnd} min={leaseStart} />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Rent Amount" required>
                      <CurrencyInput
                        prefix="₦"
                        value={rentAmount}
                        onValueChange={(v) => setRentAmount(v === 0 ? '' : String(v))}
                      />
                    </Field>
                    <Field label="Deposit">
                      <CurrencyInput
                        prefix="₦"
                        value={securityDeposit}
                        onValueChange={(v) => setSecurityDeposit(v === 0 ? '' : String(v))}
                        placeholder="Optional"
                      />
                    </Field>
                  </div>
                </>
              )}
            </div>

            {vacantUnits.length > 0 && (
              <div className="p-4 border-t border-border flex gap-3 shrink-0">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => void handleSave(false)}
                  disabled={!isValid || submitting === 'send'}
                  isLoading={submitting === 'draft'}
                  loadingText="Saving…"
                >
                  Save Draft
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => void handleSave(true)}
                  disabled={!isValid || submitting === 'draft'}
                  isLoading={submitting === 'send'}
                  loadingText="Sending…"
                >
                  Send Lease
                </Button>
              </div>
            )}
            {errorMessage && (
              <div className="px-4 pb-4">
                <Alert variant="danger">{errorMessage}</Alert>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
