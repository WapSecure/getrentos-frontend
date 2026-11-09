'use client';

import { Dialog, DialogContent, DialogTitle } from '@sureground/ui';
import { EvidencePanel } from '@/components/shared/EvidencePanel';
import type { EvidenceItem } from '@/types/admin';

interface MaintenanceDocumentsDialogProps {
  recordLabel: string;
  subtitle: string;
  documents: EvidenceItem[];
  canManage: boolean;
  onAttach: (file: File, note?: string) => void;
  isAttaching?: boolean;
  onRemove: (documentId: string) => void;
  removingId?: string | null;
  onClose: () => void;
}

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
    <DialogContent className="max-w-xl overflow-hidden flex flex-col max-h-[90vh] p-0">
      <div className="p-4 border-b border-border shrink-0 pr-12">
        <DialogTitle className="font-semibold text-foreground">{recordLabel} documents</DialogTitle>
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
