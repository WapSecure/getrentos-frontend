'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Textarea,
} from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency } from '@/lib/format';
import { landlordKeys } from '@/lib/queryKeys';
import type { ReplyLanguage } from '@/lib/replyLanguage';
import { leaseRentLabel } from '@/lib/leaseTerm';
import { landlordService } from '@/services/landlordService';
import type { Lease, RentIncreaseCheck } from '@/types/landlord';
import type { RenewalAdvice } from '@/types/renewalAdvice';
import { RenewalAdvicePanel } from './RenewalAdvicePanel';

interface RenewalOfferModalProps {
  lease: Lease | null;
  onClose: () => void;
  onSend: (
    leaseId: string,
    newRent: number,
    newEndDate: string,
    message: string
  ) => Promise<boolean>;
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
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [language, setLanguage] = useState<ReplyLanguage>('en');
  const canAdvise = !!lease && (lease.status === 'signed' || lease.status === 'expired');
  const advice = useQuery({
    queryKey: landlordKeys.renewalAdvice(lease?.id ?? '', language),
    queryFn: () => unwrap(landlordService.getRenewalAdvice(lease!.id, language)),
    enabled: canAdvise,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const [touched, setTouched] = useState({ rent: false, end: false, message: false });
  const [appliedFrom, setAppliedFrom] = useState<RenewalAdvice | null>(null);
  if (advice.data && advice.data !== appliedFrom) {
    setAppliedFrom(advice.data);
    if (!touched.rent) setNewRent(String(advice.data.draft.rentAmount));
    if (!touched.end) setNewEndDate(advice.data.draft.leaseEnd);
    if (!touched.message) setMessage(advice.data.draft.message);
  }
  const applyAdvice = (a: RenewalAdvice) => {
    setNewRent(String(a.draft.rentAmount));
    setNewEndDate(a.draft.leaseEnd);
    setMessage(a.draft.message);
    setTouched({ rent: false, end: false, message: false });
  };
  // Older leases store no period; the advice reads it from how the rent is billed.
  const rentPeriod =
    lease?.rentPeriod ??
    (advice.data ? (advice.data.facts.lease.period === 'per month' ? 'month' : 'year') : undefined);
  const englishCopy =
    advice.data?.draft.messageInEnglish && message === advice.data.draft.message
      ? advice.data.draft.messageInEnglish
      : null;

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
    const succeeded = await onSend(lease.id, Number(newRent), newEndDate, message);
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
            <DialogTitle className="font-semibold text-foreground">Send renewal offer</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              To {lease.tenantName}: {lease.unitName}
            </DialogDescription>
          </div>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {canAdvise && (
            <RenewalAdvicePanel
              advice={advice.data}
              isLoading={advice.isLoading}
              isFetching={advice.isFetching && !advice.isLoading}
              language={language}
              onLanguageChange={setLanguage}
              onUse={applyAdvice}
            />
          )}

          <div className="p-3 rounded-lg bg-secondary text-sm text-muted-foreground">
            Current rent:{' '}
            <span className="font-medium text-foreground">{formatCurrency(lease.rentAmount)}</span>
          </div>

          <Field
            label={`New ${leaseRentLabel(rentPeriod, lease.leaseStart, lease.leaseEnd).toLowerCase()} (₦)`}
            required
            hint={`${Number(increasePct) >= 0 ? '+' : ''}${increasePct}% vs current rent`}
          >
            <CurrencyInput
              prefix="₦"
              value={newRent}
              onValueChange={(v) => {
                setNewRent(v === 0 ? '' : String(v));
                setTouched((t) => ({ ...t, rent: true }));
              }}
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

          <Field label="New lease end date" required>
            <DatePicker
              value={newEndDate}
              onChange={(v) => {
                setNewEndDate(v);
                setTouched((t) => ({ ...t, end: true }));
              }}
            />
          </Field>

          <Field
            label={`Note to ${lease.tenantName || 'the tenant'}`}
            hint="Sent to them as a message with the offer. Leave empty to send the offer alone."
          >
            <Textarea
              rows={4}
              maxLength={1000}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setTouched((t) => ({ ...t, message: true }));
              }}
            />
          </Field>
          {englishCopy && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">In English: </span>
              {englishCopy}
            </p>
          )}
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
            Send offer
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
