'use client';

import { useState } from 'react';
import { Check, XCircle, RefreshCcw } from 'lucide-react';
import {
  Alert,
  Button,
  CurrencyInput,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
} from '@getrentos/ui';
import { formatCurrency, getInitials } from '@/lib/format';
import type { SaleOffer, OfferMessage } from '@/types/owner';

interface OfferNegotiationModalProps {
  offer: SaleOffer | null;
  messages: OfferMessage[];
  onClose: () => void;
  onAccept: (offerId: string) => Promise<boolean>;
  onReject: (offerId: string) => Promise<boolean>;
  onCounter: (offerId: string, amount: number, note: string) => Promise<boolean>;
}

export const OfferNegotiationModal = ({
  offer,
  messages,
  onClose,
  onAccept,
  onReject,
  onCounter,
}: OfferNegotiationModalProps) => {
  const [isCountering, setIsCountering] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterNote, setCounterNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!offer) return null;

  const isDecided =
    offer.status === 'accepted' ||
    offer.status === 'rejected' ||
    offer.status === 'withdrawn' ||
    offer.status === 'expired' ||
    offer.status === 'closed';

  const handleClose = () => {
    setIsCountering(false);
    setCounterAmount('');
    setCounterNote('');
    setErrorMessage(null);
    onClose();
  };

  const handleSubmitCounter = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    const succeeded = await onCounter(offer.id, Number(counterAmount) || 0, counterNote);
    setIsSubmitting(false);
    if (!succeeded) {
      setErrorMessage('The counteroffer could not be sent. Please try again.');
      return;
    }
    setIsCountering(false);
    setCounterAmount('');
    setCounterNote('');
  };

  const runAction = async (action: 'accept' | 'reject') => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    const succeeded = await (action === 'accept' ? onAccept(offer.id) : onReject(offer.id));
    setIsSubmitting(false);
    if (!succeeded) {
      setErrorMessage(
        `The offer could not be ${action === 'accept' ? 'accepted' : 'rejected'}. Please try again.`
      );
    }
  };

  return (
    <Dialog open={Boolean(offer)} onOpenChange={(open) => !open && handleClose()}>
      {offer && (
        <DialogContent className="flex max-h-[90vh] max-w-lg flex-col overflow-hidden p-0">
          <div className="flex shrink-0 items-center gap-3 border-b border-border p-4 pr-12">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {getInitials(offer.buyerName)}
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate font-semibold text-foreground">
                {offer.buyerName}
              </DialogTitle>
              <DialogDescription className="truncate text-xs text-muted-foreground">
                {offer.propertyName}
              </DialogDescription>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/60 p-3 text-sm">
            <span className="text-muted-foreground">
              Asking {formatCurrency(offer.askingPrice, { compact: true })}
            </span>
            <span className="font-semibold text-primary">
              Current offer {formatCurrency(offer.offerAmount, { compact: true })}
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((msg) => {
              const isOwner = msg.senderId === 'owner';
              const isSystem = msg.type !== 'message';
              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <span className="rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground">
                      {msg.text}
                      {msg.amount !== undefined && (
                        <strong className="text-foreground">
                          {' '}
                          {formatCurrency(msg.amount, { compact: true })}
                        </strong>
                      )}
                    </span>
                  </div>
                );
              }
              return (
                <div key={msg.id} className={`flex ${isOwner ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl p-3 ${
                      isOwner
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm">{msg.text}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {isCountering ? (
            <div className="shrink-0 space-y-3 border-t border-border p-4">
              <Field label="Counter Amount" required>
                <CurrencyInput
                  prefix="₦"
                  min={0}
                  value={counterAmount}
                  onValueChange={(v) => setCounterAmount(v === 0 ? '' : String(v))}
                />
              </Field>
              <Field label="Note (optional)">
                <Input
                  type="text"
                  value={counterNote}
                  onChange={(e) => setCounterNote(e.target.value)}
                  placeholder="e.g. Firm on closing within 30 days"
                />
              </Field>
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setIsCountering(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => void handleSubmitCounter()}
                  disabled={!counterAmount}
                  isLoading={isSubmitting}
                  loadingText="Sending…"
                >
                  Send Counter
                </Button>
              </div>
              {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
            </div>
          ) : (
            <div className="shrink-0 space-y-3 border-t border-border p-4">
              {!isDecided && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setErrorMessage(null);
                      setIsCountering(true);
                    }}
                    disabled={isSubmitting}
                    icon={<RefreshCcw className="h-3.5 w-3.5" />}
                  >
                    Counter
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1 text-destructive"
                    onClick={() => void runAction('reject')}
                    disabled={isSubmitting}
                    icon={<XCircle className="h-3.5 w-3.5" />}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={() => void runAction('accept')}
                    disabled={isSubmitting}
                    icon={<Check className="h-3.5 w-3.5" />}
                  >
                    Accept
                  </Button>
                </div>
              )}
              {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
            </div>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
};
