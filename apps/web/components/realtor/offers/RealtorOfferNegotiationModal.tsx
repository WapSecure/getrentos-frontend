'use client';

import { useState } from 'react';
import { RefreshCcw } from 'lucide-react';
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
import { formatCurrency } from '@/lib/format';
import type { RealtorOffer, OfferThreadMessage } from '@/types/realtor';

interface RealtorOfferNegotiationModalProps {
  offer: RealtorOffer | null;
  messages: OfferThreadMessage[];
  onClose: () => void;
  onCounter: (offerId: string, amount: number, note: string) => Promise<boolean>;
}

export const RealtorOfferNegotiationModal = ({
  offer,
  messages,
  onClose,
  onCounter,
}: RealtorOfferNegotiationModalProps) => {
  const [isCountering, setIsCountering] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterNote, setCounterNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!offer) return null;

  const isDecided =
    offer.status === 'accepted' || offer.status === 'rejected' || offer.status === 'closed';

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

  return (
    <Dialog open onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-lg sm:p-0">
        <div className="p-4 pr-12 border-b border-border shrink-0">
          <DialogTitle className="font-semibold text-foreground">{offer.listingTitle}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {offer.leadName} → {offer.clientName}
          </DialogDescription>
        </div>

        <Alert
          variant="info"
          className="rounded-none border-x-0 border-t-0 px-3 py-3 text-xs shrink-0"
        >
          You may counter on behalf of {offer.clientName}. Only the property owner can accept or
          reject the offer, and their decision is audited.
        </Alert>

        <div className="p-3 bg-secondary/60 border-b border-border flex flex-wrap items-center justify-between gap-2 text-sm shrink-0">
          <span className="text-muted-foreground">
            Asking {formatCurrency(offer.askingPrice, { compact: true })}
          </span>
          <span className="font-semibold text-primary">
            Current offer {formatCurrency(offer.offerAmount, { compact: true })}
          </span>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {messages.map((msg) => {
            const isRealtor = msg.senderId === 'realtor';
            const isSystem = msg.type !== 'message';
            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center">
                  <span className="text-xs px-3 py-1.5 rounded-full bg-secondary text-muted-foreground">
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
              <div key={msg.id} className={`flex ${isRealtor ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl p-3 ${
                    isRealtor
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-foreground'
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-wide opacity-70 mb-0.5">
                    {msg.senderName}
                  </p>
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                </div>
              </div>
            );
          })}
        </div>

        {isCountering ? (
          <div className="p-4 border-t border-border space-y-3 shrink-0">
            <Field label="Counter Amount (₦)" required>
              <CurrencyInput
                prefix="₦"
                min={0}
                value={counterAmount}
                onValueChange={(v) => setCounterAmount(v === 0 ? '' : String(v))}
              />
            </Field>
            <Field label="Note" optionalLabel="(optional)">
              <Input
                type="text"
                value={counterNote}
                onChange={(e) => setCounterNote(e.target.value)}
              />
            </Field>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                disabled={isSubmitting}
                onClick={() => setIsCountering(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => void handleSubmitCounter()}
                isLoading={isSubmitting}
                loadingText="Sending…"
                disabled={!counterAmount}
              >
                Send Counter
              </Button>
            </div>
            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
          </div>
        ) : (
          <div className="p-4 border-t border-border shrink-0 space-y-3">
            {!isDecided && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  icon={<RefreshCcw className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setErrorMessage(null);
                    setIsCountering(true);
                  }}
                >
                  Counter
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
