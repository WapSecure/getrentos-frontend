'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Download, TriangleAlert } from 'lucide-react';
import { Badge, Button, Textarea } from '@getrentos/ui';
import { LegacyInput } from '@getrentos/ui';
import { formatDate } from '@getrentos/shared';
import { evictionStatusBadges } from '@/lib/statusBadge';
import type { EvictionCase } from '@/types/landlord';

interface EvictionCaseDetailModalProps {
  evictionCase: EvictionCase | null;
  onClose: () => void;
  onIssueNotice: (id: string, cureDays: number) => void;
  onMarkFiled: (id: string) => void;
  onResolve: (id: string, resolutionNotes?: string) => void;
  onWithdraw: (id: string) => void;
  onDownloadPdf: (id: string) => void;
  isActing?: boolean;
}

export const EvictionCaseDetailModal = ({
  evictionCase,
  onClose,
  onIssueNotice,
  onMarkFiled,
  onResolve,
  onWithdraw,
  onDownloadPdf,
  isActing,
}: EvictionCaseDetailModalProps) => {
  const [cureDays, setCureDays] = useState('14');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [showResolveForm, setShowResolveForm] = useState(false);

  const handleClose = () => {
    setShowIssueForm(false);
    setShowResolveForm(false);
    setCureDays('14');
    setResolutionNotes('');
    onClose();
  };

  if (!evictionCase) return null;

  const badge = evictionStatusBadges[evictionCase.status];

  return (
    <AnimatePresence>
      {evictionCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b border-border flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-semibold text-foreground">
                  {evictionCase.tenantName} — {evictionCase.propertyName}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {evictionCase.unitName} · Created {formatDate(evictionCase.createdAt)}
                </p>
              </div>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 flex gap-2 text-xs text-amber-800 dark:text-amber-300">
                <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  This is an internal draft record. Review with legal counsel before serving
                  anything on the tenant.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-1">Reason</p>
                <p className="text-sm text-muted-foreground">{evictionCase.reason}</p>
              </div>

              {evictionCase.noticeIssuedAt && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Notice issued</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(evictionCase.noticeIssuedAt)}
                    {evictionCase.cureDeadline &&
                      ` · cure deadline ${formatDate(evictionCase.cureDeadline)}`}
                  </p>
                </div>
              )}

              {evictionCase.filedAt && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Filed</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(evictionCase.filedAt)}
                  </p>
                </div>
              )}

              {evictionCase.resolvedAt && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Resolved</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(evictionCase.resolvedAt)}
                    {evictionCase.resolutionNotes ? ` — ${evictionCase.resolutionNotes}` : ''}
                  </p>
                </div>
              )}

              {showIssueForm && (
                <div className="p-3 rounded-lg border border-border space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Cure period (days)
                  </label>
                  <LegacyInput
                    type="number"
                    value={cureDays}
                    onChange={(e) => setCureDays(e.target.value)}
                    min={1}
                    max={180}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    disabled={isActing || !cureDays}
                    onClick={() => onIssueNotice(evictionCase.id, Number(cureDays))}
                  >
                    Confirm Issue Notice
                  </Button>
                </div>
              )}

              {showResolveForm && (
                <div className="p-3 rounded-lg border border-border space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Resolution notes <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <Textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={3}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    disabled={isActing}
                    onClick={() => onResolve(evictionCase.id, resolutionNotes.trim() || undefined)}
                  >
                    Confirm Resolve
                  </Button>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border shrink-0 space-y-2">
              <Button
                variant="outline"
                fullWidth
                className="gap-1.5"
                onClick={() => onDownloadPdf(evictionCase.id)}
              >
                <Download className="w-3.5 h-3.5" />
                Download Draft Record (PDF)
              </Button>

              {evictionCase.status === 'draft' && (
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    fullWidth
                    disabled={isActing}
                    onClick={() => setShowIssueForm((v) => !v)}
                  >
                    Issue Notice
                  </Button>
                  <Button
                    variant="ghost"
                    fullWidth
                    disabled={isActing}
                    onClick={() => onWithdraw(evictionCase.id)}
                  >
                    Withdraw
                  </Button>
                </div>
              )}

              {evictionCase.status === 'issued' && (
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    fullWidth
                    disabled={isActing}
                    onClick={() => onMarkFiled(evictionCase.id)}
                  >
                    Mark Filed
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    disabled={isActing}
                    onClick={() => setShowResolveForm((v) => !v)}
                  >
                    Resolve
                  </Button>
                  <Button
                    variant="ghost"
                    fullWidth
                    disabled={isActing}
                    onClick={() => onWithdraw(evictionCase.id)}
                  >
                    Withdraw
                  </Button>
                </div>
              )}

              {evictionCase.status === 'filed' && (
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    fullWidth
                    disabled={isActing}
                    onClick={() => setShowResolveForm((v) => !v)}
                  >
                    Resolve
                  </Button>
                  <Button
                    variant="ghost"
                    fullWidth
                    disabled={isActing}
                    onClick={() => onWithdraw(evictionCase.id)}
                  >
                    Withdraw
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
