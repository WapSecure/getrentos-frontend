'use client';

import { useState, useMemo } from 'react';
import { addYears, subDays, format } from 'date-fns';
import { BadgeCheck, DoorOpen } from '@sureground/icons';
import {
  Alert,
  Button,
  CurrencyInput,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  Field,
  Input,
  Select,
} from '@sureground/ui';
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
  // Stated on the form: the lease used to take the unit's asking period or silently fall back to
  // yearly, so a monthly figure could be saved, and shown to the tenant, as annual rent.
  const [rentPeriod, setRentPeriod] = useState<'month' | 'year'>('year');
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
    if (unit && !rentAmount) setRentAmount(String(unit.askingRent ?? ''));
    if (unit?.askingRentPeriod) setRentPeriod(unit.askingRentPeriod);
    if (unit?.approvedApplicant) {
      setTenantName(unit.approvedApplicant.name);
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
    setRentPeriod('year');
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
      rentPeriod,
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
    <Dialog open={isOpen} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent size="lg" padded={false} className="flex max-h-[88dvh] flex-col">
        <div className="px-5 py-4 pr-12 border-b border-border flex justify-between items-center gap-3 shrink-0 sm:px-6">
          <div className="min-w-0">
            <DialogTitle className="text-lg font-semibold text-foreground">
              Create lease
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-0.5">
              Draft a new lease agreement
            </DialogDescription>
          </div>
        </div>

        <div className="min-h-0 flex-1 p-5 space-y-4 overflow-y-auto overscroll-contain sm:px-6">
          {vacantUnits.length === 0 ? (
            <EmptyState
              icon={DoorOpen}
              title="No vacant units available"
              description="Every unit already has a tenant or a draft lease. Check your draft leases, or add a property."
              size="compact"
              bare
            />
          ) : (
            <>
              <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 sm:gap-3">
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
                  <Field label="Tenant name" required>
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
                        {selectedUnit.approvedApplicant.name} was approved for this unit. This lease
                        is linked to their account so they can review and sign it in their own
                        portal.
                      </span>
                    </p>
                  ) : selectedUnit ? (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      No approved applicant for this unit: the lease is recorded against this name
                      only, and the tenant will not see it in a Sureground account.
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Choose a unit first: an approved applicant for it is filled in here.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Lease start" required>
                  <DatePicker value={leaseStart} onChange={setLeaseStart} />
                </Field>
                <Field label="Lease end" required>
                  <DatePicker value={leaseEnd} onChange={setLeaseEnd} min={leaseStart} />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Rent period" required>
                  <Select
                    value={rentPeriod}
                    onValueChange={(v) => setRentPeriod(v === 'month' ? 'month' : 'year')}
                    options={[
                      { value: 'year', label: 'Per year' },
                      { value: 'month', label: 'Per month' },
                    ]}
                  />
                </Field>
                <Field label={rentPeriod === 'month' ? 'Rent per month' : 'Rent per year'} required>
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
          <div className="px-5 py-4 border-t border-border flex gap-3 shrink-0 sm:px-6">
            <Button
              variant="outline"
              fullWidth
              onClick={() => void handleSave(false)}
              disabled={!isValid || submitting === 'send'}
              isLoading={submitting === 'draft'}
              loadingText="Saving…"
            >
              Save draft
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={() => void handleSave(true)}
              disabled={!isValid || submitting === 'draft'}
              isLoading={submitting === 'send'}
              loadingText="Sending…"
            >
              Send lease
            </Button>
          </div>
        )}
        {errorMessage && (
          <div className="px-4 pb-4">
            <Alert variant="danger">{errorMessage}</Alert>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
