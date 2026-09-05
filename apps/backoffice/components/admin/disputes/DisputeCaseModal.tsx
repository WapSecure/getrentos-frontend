'use client';

import { LegacyInput, Dialog, DialogContent, DialogTitle, Button, Select } from '@getrentos/ui';

import { useState } from 'react';
import { CheckCircle2, ArrowUpCircle, Search, RotateCcw, Send, ExternalLink } from 'lucide-react';
import { cn, formatCurrency } from '@getrentos/shared';
import type { Dispute, DisputeDetail, DisputeMessage, DisputeResolveOutcome } from '@/types/admin';

const STATUS_PILL: Record<Dispute['status'], string> = {
  open: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  under_review: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  escalated: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

const ESCROW_LABEL: Record<string, string> = {
  DEPOSIT_PENDING: 'Deposit pending',
  FUNDS_HELD: 'Funds held',
  VERIFICATION_PENDING: 'Verification pending',
  SETTLEMENT_PENDING: 'Settlement pending',
  RELEASED: 'Released',
  REFUNDED: 'Refunded',
  FROZEN: 'Frozen',
  DISPUTED: 'Disputed',
};

interface DisputeCaseModalProps {
  dispute: Dispute | null;
  detail?: DisputeDetail;
  detailLoading?: boolean;
  messages: DisputeMessage[];
  onClose: () => void;
  onStartReview: (id: string) => void;
  onReopen: (id: string) => void;
  onEscalate: (id: string) => void;
  onResolve: (id: string, resolution: string | undefined, outcome: DisputeResolveOutcome) => void;
  onSendMessage: (id: string, text: string) => void;
  isResolving?: boolean;
  isEscalating?: boolean;
  isReviewing?: boolean;
  isReopening?: boolean;
  isSendingMessage?: boolean;
}

export const DisputeCaseModal = ({
  dispute,
  detail,
  detailLoading = false,
  messages,
  onClose,
  onStartReview,
  onReopen,
  onEscalate,
  onResolve,
  onSendMessage,
  isResolving = false,
  isEscalating = false,
  isReviewing = false,
  isReopening = false,
  isSendingMessage = false,
}: DisputeCaseModalProps) => {
  const [messageText, setMessageText] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [outcome, setOutcome] = useState<DisputeResolveOutcome>('none');

  if (!dispute) return null;

  const tx = detail?.transaction;
  const escrowFrozen = tx?.escrowStatus === 'FROZEN' || tx?.escrowStatus === 'DISPUTED';
  const canDecide = dispute.status !== 'resolved';
  const canStartReview = dispute.status === 'open';
  const canReopen = dispute.status === 'resolved' || dispute.status === 'escalated';

  const outcomeOptions: { value: DisputeResolveOutcome; label: string }[] = escrowFrozen
    ? [
        { value: 'none', label: 'No money move (unfreeze to held)' },
        { value: 'release', label: 'Release funds to seller' },
        { value: 'refund', label: 'Refund funds to buyer' },
      ]
    : [{ value: 'none', label: 'No money move (escrow not frozen)' }];

  const handleSend = () => {
    if (!messageText.trim()) return;
    onSendMessage(dispute.id, messageText);
    setMessageText('');
  };

  const handleResolve = () => {
    onResolve(dispute.id, resolutionText.trim() || undefined, outcome);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-border shrink-0 pr-12">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="font-semibold text-foreground truncate">
                {dispute.title}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {dispute.raisedBy} vs. {dispute.against}
                {dispute.amount !== undefined
                  ? ` · ${formatCurrency(dispute.amount, { compact: true })}`
                  : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                  STATUS_PILL[dispute.status]
                )}
              >
                {dispute.status.replace('_', ' ')}
              </span>
              <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-muted-foreground capitalize">
                {dispute.category.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 bg-secondary/50 border-b border-border">
            <p className="text-sm text-muted-foreground">{dispute.description}</p>
            {detailLoading ? (
              <p className="text-xs text-muted-foreground mt-2">Loading case context…</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-3 text-xs">
                {detail?.raisedBy && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Raised by:</span>{' '}
                    {detail.raisedBy.legalName}
                    {detail.raisedBy.email ? ` · ${detail.raisedBy.email}` : ''}
                  </p>
                )}
                {detail?.against && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Against:</span>{' '}
                    {detail.against.legalName}
                    {detail.against.email ? ` · ${detail.against.email}` : ''}
                  </p>
                )}
                {detail?.resolvedBy && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Resolved by:</span>{' '}
                    {detail.resolvedBy.legalName}
                  </p>
                )}
                {detail?.evidence && detail.evidence.length > 0 && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Evidence:</span>{' '}
                    {detail.evidence.map((url, i) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-0.5 text-primary underline decoration-dotted underline-offset-2 hover:opacity-80 mr-2"
                      >
                        file {i + 1} <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </p>
                )}
              </div>
            )}
          </div>

          {detail?.resolution && (
            <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border-b border-border text-sm">
              <p className="font-medium text-emerald-700 dark:text-emerald-300">
                Resolution
                {detail.resolvedAt ? ` · ${new Date(detail.resolvedAt).toLocaleString()}` : ''}
              </p>
              <p className="text-muted-foreground mt-0.5">{detail.resolution}</p>
            </div>
          )}

          {tx && (
            <div className="px-4 py-3 border-b border-border space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  Escrow transaction
                </p>
                <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {ESCROW_LABEL[tx.escrowStatus] ?? tx.escrowStatus}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {tx.property && (
                  <p className="truncate">
                    <span className="font-medium text-foreground">Property:</span>{' '}
                    {tx.property.title}
                  </p>
                )}
                {tx.offer && (
                  <p className="truncate">
                    <span className="font-medium text-foreground">Offer:</span> {tx.offer.status}
                  </p>
                )}
                {tx.buyer && (
                  <p className="truncate">
                    <span className="font-medium text-foreground">Buyer:</span> {tx.buyer.legalName}
                  </p>
                )}
                {tx.seller && (
                  <p className="truncate">
                    <span className="font-medium text-foreground">Seller:</span>{' '}
                    {tx.seller.legalName}
                  </p>
                )}
                {tx.amount !== undefined && (
                  <p className="truncate">
                    <span className="font-medium text-foreground">Amount:</span>{' '}
                    {formatCurrency(tx.amount, { compact: true })}
                  </p>
                )}
                {tx.frozenReason && (
                  <p className="col-span-2 truncate">
                    <span className="font-medium text-foreground">Frozen:</span> {tx.frozenReason}
                  </p>
                )}
              </div>
              {tx.events && tx.events.length > 0 && (
                <div className="border-t border-border/60 pt-2 space-y-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Timeline
                  </p>
                  {tx.events.map((event) => (
                    <div
                      key={event.createdAt + event.eventType}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                      <span className="text-foreground font-medium">{event.eventType}</span>
                      <span className="text-muted-foreground">{event.status}</span>
                      <span className="text-muted-foreground/70 ml-auto">
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="p-4 space-y-3">
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
        </div>

        <div className="p-4 border-t border-border shrink-0 space-y-3">
          {canDecide && (
            <div className="space-y-2 rounded-lg bg-secondary/40 p-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <Select
                    value={outcome}
                    onValueChange={(value) => setOutcome(value as DisputeResolveOutcome)}
                    options={outcomeOptions}
                    className="w-full"
                  />
                </div>
                <textarea
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="Resolution note shown to both parties (optional)"
                  rows={2}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleResolve}
                  isLoading={isResolving}
                  disabled={isResolving || isEscalating || isReviewing || isReopening}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Resolve
                  {outcome === 'release' ? ' & release' : outcome === 'refund' ? ' & refund' : ''}
                </Button>
                {canStartReview && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => onStartReview(dispute.id)}
                    isLoading={isReviewing}
                    disabled={isResolving || isEscalating || isReviewing}
                  >
                    <Search className="w-3.5 h-3.5" />
                    Start review
                  </Button>
                )}
                {canReopen && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => onReopen(dispute.id)}
                    isLoading={isReopening}
                    disabled={isResolving || isReopening}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reopen
                  </Button>
                )}
                {canDecide && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => onEscalate(dispute.id)}
                    isLoading={isEscalating}
                    disabled={isResolving || isEscalating}
                  >
                    <ArrowUpCircle className="w-3.5 h-3.5" />
                    Escalate
                  </Button>
                )}
              </div>
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
    </Dialog>
  );
};
