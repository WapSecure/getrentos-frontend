'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Check, XCircle, RefreshCcw } from 'lucide-react';
import { Button, CurrencyInput, Field, IconButton, Input } from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';
import type { BuyerOffer, BuyerOfferMessage } from '@/types/buyer';

interface BuyerOfferNegotiationModalProps {
  offer: BuyerOffer | null;
  messages: BuyerOfferMessage[];
  onClose: () => void;
  onAcceptCounter: (offerId: string) => Promise<boolean>;
  onWithdraw: (offerId: string) => Promise<boolean>;
  onCounter: (offerId: string, amount: number, note: string) => Promise<boolean>;
}

export const BuyerOfferNegotiationModal = ({
  offer,
  messages,
  onClose,
  onAcceptCounter,
  onWithdraw,
  onCounter,
}: BuyerOfferNegotiationModalProps) => {
  const [isCountering, setIsCountering] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterNote, setCounterNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState<'withdraw' | 'accept' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!offer) return null;

  const isDecided =
    offer.status === 'accepted' || offer.status === 'rejected' || offer.status === 'closed';
  const isCountered = offer.status === 'countered';

  const handleClose = () => {
    setIsCountering(false);
    setCounterAmount('');
    setCounterNote('');
    onClose();
  };

  const handleSubmitCounter = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    const submitted = await onCounter(offer.id, Number(counterAmount) || 0, counterNote);
    setIsSubmitting(false);
    if (!submitted) {
      setErrorMessage('The counter offer could not be submitted.');
      return;
    }
    setIsCountering(false);
    setCounterAmount('');
    setCounterNote('');
  };

  const runAction = async (
    name: 'withdraw' | 'accept',
    action: () => Promise<boolean>,
    failureMessage: string
  ) => {
    setIsSubmitting(true);
    setPendingAction(name);
    setErrorMessage(null);
    const completed = await action();
    setIsSubmitting(false);
    setPendingAction(null);
    if (!completed) setErrorMessage(failureMessage);
  };

  return (
    <AnimatePresence>
      {offer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={offer.propertyTitle}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b border-border flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-semibold text-foreground">{offer.propertyTitle}</h3>
                <p className="text-xs text-muted-foreground">Owner: {offer.ownerName}</p>
              </div>
              <IconButton
                label="Close offer details"
                size="sm"
                icon={<X />}
                onClick={handleClose}
                disabled={isSubmitting}
              />
            </div>

            <div className="p-3 bg-secondary border-b border-border flex flex-wrap items-center justify-between gap-2 text-sm shrink-0">
              <span className="text-muted-foreground">
                Asking {formatCurrency(offer.askingPrice, { compact: true })}
              </span>
              <span className="font-semibold text-primary">
                Current offer {formatCurrency(offer.offerAmount, { compact: true })}
              </span>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {messages.map((msg) => {
                const isBuyer = msg.senderId === 'buyer';
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
                  <div key={msg.id} className={`flex ${isBuyer ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl p-3 ${
                        isBuyer
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-foreground'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {isCountering ? (
              <div className="p-4 border-t border-border space-y-3 shrink-0">
                <Field label="New Offer Amount (₦)">
                  <CurrencyInput
                    prefix="₦"
                    min={0}
                    value={counterAmount}
                    onValueChange={(v) => setCounterAmount(v === 0 ? '' : String(v))}
                  />
                </Field>
                <Field label="Note" optionalLabel="(optional)">
                  <Input
                    value={counterNote}
                    onChange={(e) => setCounterNote(e.target.value)}
                    placeholder="e.g. This is my best and final offer"
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
                    disabled={!counterAmount || isSubmitting}
                    isLoading={isSubmitting}
                  >
                    Send Counter
                  </Button>
                </div>
                {errorMessage && (
                  <p role="alert" className="text-sm text-destructive">
                    {errorMessage}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 border-t border-border shrink-0 space-y-3">
                {!isDecided && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      className="flex-1 text-destructive"
                      icon={<XCircle className="w-3.5 h-3.5" />}
                      onClick={() =>
                        void runAction(
                          'withdraw',
                          () => onWithdraw(offer.id),
                          'The offer could not be withdrawn.'
                        )
                      }
                      disabled={isSubmitting}
                      isLoading={pendingAction === 'withdraw'}
                    >
                      Withdraw
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      icon={<RefreshCcw className="w-3.5 h-3.5" />}
                      onClick={() => setIsCountering(true)}
                      disabled={isSubmitting}
                    >
                      Counter
                    </Button>
                    {isCountered && (
                      <Button
                        variant="primary"
                        className="flex-1"
                        icon={<Check className="w-3.5 h-3.5" />}
                        onClick={() =>
                          void runAction(
                            'accept',
                            () => onAcceptCounter(offer.id),
                            'The counter offer could not be accepted.'
                          )
                        }
                        disabled={isSubmitting}
                        isLoading={pendingAction === 'accept'}
                      >
                        Accept
                      </Button>
                    )}
                  </div>
                )}
                {errorMessage && (
                  <p role="alert" className="text-sm text-destructive">
                    {errorMessage}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
