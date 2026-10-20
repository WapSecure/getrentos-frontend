'use client';

import { useEffect, useState } from 'react';
import { RefreshCcw, TriangleAlert } from 'lucide-react';
import {
  Alert,
  Button,
  CurrencyInput,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
} from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';
import { leaseRentLabel } from '@/lib/leaseTerm';
import { landlordService } from '@/services/landlordService';
import type { Lease, RentIncreaseCheck } from '@/types/landlord';

interface RenewalOfferModalProps {
  lease: Lease | null;
  onClose: () => void;
  onSend: (leaseId: string, newRent: number, newEndDate: string) => Promise<boolean>;
}

const addOneYear = (dateString: string) => {
  const date = new Date(dateString);
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split('T')[0];
};

export const RenewalOfferModal = ({ lease, onClose, onSend }: RenewalOfferModalProps) => {
  const [newRent, setNewRent] = useState(() =>
    lease ? String(Math.round(lease.rentAmount * 1.05)) : ''
  );
  const [newEndDate, setNewEndDate] = useState(() => (lease ? addOneYear(lease.leaseEnd) : ''));
  const [check, setCheck] = useState<{ rentAmount: string; result: RentIncreaseCheck } | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!lease || !newRent) return;
    const timer = setTimeout(() => {
      landlordService.previewRenewalCheck(lease.id, Number(newRent)).then((response) => {
        if (response.success && response.data)
          setCheck({ rentAmount: newRent, result: response.data });
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [lease, newRent]);

  if (!lease) return null;

  const activeCheck = check && check.rentAmount === newRent ? check.result : null;

  const increasePct = newRent
    ? (((Number(newRent) - lease.rentAmount) / lease.rentAmount) * 100).toFixed(1)
    : '0';

  const handleSend = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    const succeeded = await onSend(lease.id, Number(newRent), newEndDate);
    setIsSubmitting(false);
    if (!succeeded) {
      setErrorMessage('The renewal offer could not be sent. Your changes are unchanged.');
    }
  };

  return (
    <Dialog open={!!lease} onOpenChange={(next) => !next && onClose()}>
      <DialogContent padded={false}>
        <div className="p-4 pr-12 border-b border-border flex justify-between items-center gap-3">
          <div className="min-w-0">
            <DialogTitle className="font-semibold text-foreground">Send Renewal Offer</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              To {lease.tenantName}: {lease.unitName}
            </DialogDescription>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="p-3 rounded-lg bg-secondary text-sm text-muted-foreground">
            Current rent:{' '}
            <span className="font-medium text-foreground">{formatCurrency(lease.rentAmount)}</span>
          </div>

          <Field
            label={`New ${leaseRentLabel(lease.rentPeriod, lease.leaseStart, lease.leaseEnd).toLowerCase()} (₦)`}
            required
            hint={`${Number(increasePct) >= 0 ? '+' : ''}${increasePct}% vs current rent`}
          >
            <CurrencyInput
              prefix="₦"
              value={newRent}
              onValueChange={(v) => setNewRent(v === 0 ? '' : String(v))}
            />
          </Field>

          {activeCheck && (
            <Alert
              variant={activeCheck.exceedsGuidance ? 'warning' : 'neutral'}
              icon={activeCheck.exceedsGuidance ? TriangleAlert : null}
            >
              {activeCheck.advisory}
            </Alert>
          )}

          <Field label="New Lease End Date" required>
            <DatePicker value={newEndDate} onChange={setNewEndDate} />
          </Field>
        </div>

        <div className="p-4 border-t border-border flex gap-3">
          <Button variant="ghost" fullWidth disabled={isSubmitting} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            fullWidth
            className="gap-1.5"
            onClick={() => void handleSend()}
            disabled={!newRent || !newEndDate}
            isLoading={isSubmitting}
            loadingText="Sending…"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Send Offer
          </Button>
        </div>
        {errorMessage && (
          <div className="px-4 pb-4">
            <Alert variant="danger">{errorMessage}</Alert>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
