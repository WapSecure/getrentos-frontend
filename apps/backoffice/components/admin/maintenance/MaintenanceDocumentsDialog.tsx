'use client';

import { Dialog, DialogContent, DialogTitle } from '@getrentos/ui';
import { EvidencePanel } from '@/components/shared/EvidencePanel';
import type { EvidenceItem } from '@/types/admin';

interface MaintenanceDocumentsDialogProps {
  /** e.g. "Vendor quote" or "Vendor invoice" — names what the files belong to. */
  recordLabel: string;
  /** What the record is, shown under the title so the file has context. */
  subtitle: string;
  documents: EvidenceItem[];
  canManage: boolean;
  onAttach: (file: File, note?: string) => void;
  isAttaching?: boolean;
  onRemove: (documentId: string) => void;
  removingId?: string | null;
  onClose: () => void;
}

/**
 * The paperwork behind a figure on a quote or an invoice.
 *
 * A quote or invoice is an amount. Without the document attached, whoever
 * approves it is taking the number on trust, and there is no record of who
 * supplied what — so this is the place an approver checks the file before
 * deciding, and attaches it when it arrives by some other route.
 */
export const MaintenanceDocumentsDialog = ({
  recordLabel,
  subtitle,
  documents,
  canManage,
  onAttach,
  isAttaching = false,
  onRemove,
  removingId = null,
  onClose,
}: MaintenanceDocumentsDialogProps) => (
  <Dialog open onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
      <div className="p-4 border-b border-border shrink-0 pr-12">
        <DialogTitle className="font-semibold text-foreground">
          {recordLabel} documents
        </DialogTitle>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <EvidencePanel
          evidence={documents}
          heading="Documents"
          canAttach={canManage}
          isAttaching={isAttaching}
          onAttach={canManage ? onAttach : undefined}
          onRemove={canManage ? onRemove : undefined}
          removingId={removingId}
          emptyHint="No document attached. A figure with no paperwork behind it is one nobody can check."
        />
      </div>
    </DialogContent>
  </Dialog>
);
