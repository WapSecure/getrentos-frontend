'use client';

import { LegacyInput } from '@/components/ui/LegacyInput';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, RefreshCcw, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/format';
import type { RealtorOffer, OfferThreadMessage } from '@/types/realtor';

interface RealtorOfferNegotiationModalProps {
  offer: RealtorOffer | null;
  messages: OfferThreadMessage[];
  onClose: () => void;
  onCounter: (offerId: string, amount: number, note: string) => void;
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

  if (!offer) return null;

  const isDecided =
    offer.status === 'accepted' || offer.status === 'rejected' || offer.status === 'closed';

  const handleClose = () => {
    setIsCountering(false);
    setCounterAmount('');
    setCounterNote('');
    onClose();
  };

  const handleSubmitCounter = () => {
    onCounter(offer.id, Number(counterAmount) || 0, counterNote);
    setIsCountering(false);
    setCounterAmount('');
    setCounterNote('');
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
                <h3 className="font-semibold text-foreground">{offer.listingTitle}</h3>
                <p className="text-xs text-muted-foreground">
                  {offer.leadName} → {offer.clientName}
                </p>
              </div>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 flex items-start gap-2 shrink-0">
              <Info className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                You may counter on behalf of {offer.clientName}. Only the property owner can
                accept or reject the offer, and their decision is audited.
              </p>
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
                  <div
                    key={msg.id}
                    className={`flex ${isRealtor ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl p-3 ${
                        isRealtor
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-foreground'
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
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Counter Amount (₦)
                  </label>
                  <LegacyInput
                    type="number"
                    min={0}
                    value={counterAmount}
                    onChange={(e) => setCounterAmount(e.target.value)}
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
                    onClick={handleSubmitCounter}
                    disabled={!counterAmount}
                  >
                    Send Counter
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 border-t border-border shrink-0 space-y-3">
                {!isDecided && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 gap-1.5"
                      onClick={() => setIsCountering(true)}
                    >
                      <RefreshCcw className="w-3.5 h-3.5" />
                      Counter
                    </Button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
