'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Check, XCircle, RefreshCcw } from 'lucide-react';
import { Button, CurrencyInput } from '@getrentos/ui';
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

  const runAction = async (action: () => Promise<boolean>, failureMessage: string) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    const completed = await action();
    setIsSubmitting(false);
    if (!completed) setErrorMessage(failureMessage);
  };

  return (
    <AnimatePresence>
      {offer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
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
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                aria-label="Close offer details"
                className="p-1 rounded-lg hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-white/5 border-b border-border flex items-center justify-between text-sm shrink-0">
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
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-foreground'
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
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    New Offer Amount (₦)
                  </label>
                  <CurrencyInput
                    prefix="₦"
                    min={0}
                    value={counterAmount}
                    onValueChange={(v) => setCounterAmount(v === 0 ? '' : String(v))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Note (optional)
                  </label>
                  <LegacyInput
                    type="text"
                    value={counterNote}
                    onChange={(e) => setCounterNote(e.target.value)}
                    placeholder="e.g. This is my best and final offer"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
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
                {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
              </div>
            ) : (
              <div className="p-4 border-t border-border shrink-0 space-y-3">
                {!isDecided && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      className="flex-1 gap-1.5 text-red-600 dark:text-red-400"
                      onClick={() =>
                        void runAction(
                          () => onWithdraw(offer.id),
                          'The offer could not be withdrawn.'
                        )
                      }
                      disabled={isSubmitting}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Withdraw
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-1.5"
                      onClick={() => setIsCountering(true)}
                    >
                      <RefreshCcw className="w-3.5 h-3.5" />
                      Counter
                    </Button>
                    {isCountered && (
                      <Button
                        variant="primary"
                        className="flex-1 gap-1.5"
                        onClick={() =>
                          void runAction(
                            () => onAcceptCounter(offer.id),
                            'The counter offer could not be accepted.'
                          )
                        }
                        disabled={isSubmitting}
                      >
                        <Check className="w-3.5 h-3.5" />
                        Accept
                      </Button>
                    )}
                  </div>
                )}
                {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
