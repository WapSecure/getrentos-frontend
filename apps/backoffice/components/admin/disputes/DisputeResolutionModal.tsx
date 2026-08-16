'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState } from 'react';
import { CheckCircle2, ArrowUpCircle, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@getrentos/ui';
import { Button } from '@getrentos/ui';
import { cn } from '@getrentos/shared';
import { formatCurrency } from '@getrentos/shared';
import type { Dispute, DisputeMessage } from '@/types/admin';

interface DisputeResolutionModalProps {
  dispute: Dispute | null;
  messages: DisputeMessage[];
  onClose: () => void;
  onResolve: (id: string) => void;
  onEscalate: (id: string) => void;
  onSendMessage: (id: string, text: string) => void;
  isResolving?: boolean;
  isEscalating?: boolean;
  isSendingMessage?: boolean;
}

export const DisputeResolutionModal = ({
  dispute,
  messages,
  onClose,
  onResolve,
  onEscalate,
  onSendMessage,
  isResolving = false,
  isEscalating = false,
  isSendingMessage = false,
}: DisputeResolutionModalProps) => {
  const [messageText, setMessageText] = useState('');

  const isDecided = dispute?.status === 'resolved';

  const handleSend = () => {
    if (!dispute || !messageText.trim()) return;
    onSendMessage(dispute.id, messageText);
    setMessageText('');
  };

  return (
    <Dialog open={!!dispute} onOpenChange={(open) => !open && onClose()}>
      {dispute && (
        <DialogContent className="max-w-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border flex justify-between items-center shrink-0 pr-12">
            <div>
              <DialogTitle className="font-semibold text-foreground">{dispute.title}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {dispute.raisedBy} vs. {dispute.against}
                {dispute.amount !== undefined
                  ? ` · ${formatCurrency(dispute.amount, { compact: true })}`
                  : ''}
              </p>
            </div>
          </div>

          <div className="p-4 bg-secondary/50 border-b border-border shrink-0">
            <p className="text-sm text-muted-foreground">{dispute.description}</p>
          </div>

          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No messages yet in this dispute thread
              </p>
            ) : (
              messages.map((msg) => {
                const isAdmin = msg.senderId === 'admin';
                return (
                  <div
                    key={msg.id}
                    className={cn('flex', isAdmin ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[75%] rounded-2xl p-3',
                        isAdmin
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      )}
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

          <div className="p-4 border-t border-border shrink-0 space-y-3">
            {!isDecided && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-1.5"
                  onClick={() => onEscalate(dispute.id)}
                  isLoading={isEscalating}
                  disabled={isResolving || isEscalating}
                >
                  <ArrowUpCircle className="w-3.5 h-3.5" />
                  Escalate
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 gap-1.5"
                  onClick={() => onResolve(dispute.id)}
                  isLoading={isResolving}
                  disabled={isResolving || isEscalating}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark Resolved
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <LegacyInput
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Send a message to both parties..."
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button
                variant="secondary"
                onClick={handleSend}
                disabled={!messageText.trim() || isSendingMessage}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};
