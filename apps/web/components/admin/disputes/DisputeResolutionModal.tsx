'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle2, ArrowUpCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/format';
import type { Dispute, DisputeMessage } from '@/types/admin';

interface DisputeResolutionModalProps {
  dispute: Dispute | null;
  messages: DisputeMessage[];
  onClose: () => void;
  onResolve: (id: string) => void;
  onEscalate: (id: string) => void;
  onSendMessage: (id: string, text: string) => void;
}

export const DisputeResolutionModal = ({
  dispute,
  messages,
  onClose,
  onResolve,
  onEscalate,
  onSendMessage,
}: DisputeResolutionModalProps) => {
  const [messageText, setMessageText] = useState('');

  if (!dispute) return null;

  const isDecided = dispute.status === 'resolved';

  const handleSend = () => {
    if (!messageText.trim()) return;
    onSendMessage(dispute.id, messageText);
    setMessageText('');
  };

  return (
    <AnimatePresence>
      {dispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-[#1a2a2f] rounded-xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{dispute.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {dispute.raisedBy} vs. {dispute.against}
                  {dispute.amount !== undefined
                    ? ` · ${formatCurrency(dispute.amount, { compact: true })}`
                    : ''}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 flex-shrink-0">
              <p className="text-sm text-gray-600 dark:text-gray-300">{dispute.description}</p>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  No messages yet in this dispute thread
                </p>
              ) : (
                messages.map((msg) => {
                  const isAdmin = msg.senderId === 'admin';
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl p-3 ${
                          isAdmin
                            ? 'bg-[#c4a747] text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                        }`}
                      >
                        <p className="text-[10px] uppercase tracking-wide opacity-70 mb-0.5">
                          {msg.senderName}
                        </p>
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-white/10 flex-shrink-0 space-y-3">
              {!isDecided && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-1.5"
                    onClick={() => onEscalate(dispute.id)}
                  >
                    <ArrowUpCircle className="w-3.5 h-3.5" />
                    Escalate
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1 gap-1.5"
                    onClick={() => onResolve(dispute.id)}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark Resolved
                  </Button>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Send a message to both parties..."
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                />
                <Button variant="secondary" onClick={handleSend} disabled={!messageText.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
