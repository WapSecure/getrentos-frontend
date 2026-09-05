'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button, Checkbox, DatePicker, DocumentUpload, LegacyInput, Select } from '@getrentos/ui';

interface UploadGovernanceRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    type: 'BYLAWS' | 'MEETING_MINUTES' | 'OTHER';
    meetingDate?: string;
    file: File;
    newVersionOfId?: string;
    requiresSignatures?: boolean;
  }) => void;
  isSubmitting?: boolean;
  /** Set when uploading a new version of an existing record — pre-fills the title and type. */
  newVersionOf?: { id: string; title: string; type: 'BYLAWS' | 'MEETING_MINUTES' | 'OTHER' };
}

const typeOptions = [
  { value: 'BYLAWS', label: 'Bylaws' },
  { value: 'MEETING_MINUTES', label: 'Meeting Minutes' },
  { value: 'OTHER', label: 'Other' },
];

export const UploadGovernanceRecordModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  newVersionOf,
}: UploadGovernanceRecordModalProps) => {
  const [title, setTitle] = useState(newVersionOf?.title ?? '');
  const [type, setType] = useState<string>(newVersionOf?.type ?? 'BYLAWS');
  const [meetingDate, setMeetingDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [requiresSignatures, setRequiresSignatures] = useState(false);

  const handleClose = () => {
    setTitle(newVersionOf?.title ?? '');
    setType(newVersionOf?.type ?? 'BYLAWS');
    setMeetingDate('');
    setFile(null);
    setRequiresSignatures(false);
    onClose();
  };

  const canSubmit = title.trim().length > 0 && !!file;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b border-border flex justify-between items-center shrink-0">
              <h3 className="font-semibold text-foreground">
                {newVersionOf ? 'Upload New Version' : 'Upload Governance Record'}
              </h3>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {newVersionOf && (
                <p className="text-xs text-muted-foreground -mt-1">
                  Replaces the current version of “{newVersionOf.title}”. The old version stays
                  available in its history.
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Title</label>
                <LegacyInput
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 2026 Bylaws Amendment"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Type</label>
                <Select value={type} onValueChange={setType} options={typeOptions} />
              </div>

              {type === 'MEETING_MINUTES' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Meeting Date <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <DatePicker value={meetingDate} onChange={setMeetingDate} />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">File</label>
                <DocumentUpload
                  value={file ? [{ id: 'file', file }] : []}
                  onChange={(items) => setFile(items[0]?.file ?? null)}
                  accept=".pdf,.doc,.docx"
                  multiple={false}
                  label=""
                  hint="PDF or DOC up to 20MB"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <Checkbox checked={requiresSignatures} onCheckedChange={setRequiresSignatures} />
                Require every committee member to sign before it&apos;s approved
              </label>
            </div>

            <div className="p-4 border-t border-border flex gap-3 shrink-0">
              <Button variant="ghost" fullWidth onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                disabled={!canSubmit || isSubmitting}
                onClick={() =>
                  file &&
                  onSubmit({
                    title: title.trim(),
                    type: type as 'BYLAWS' | 'MEETING_MINUTES' | 'OTHER',
                    meetingDate: meetingDate || undefined,
                    file,
                    newVersionOfId: newVersionOf?.id,
                    requiresSignatures,
                  })
                }
              >
                {isSubmitting ? 'Uploading…' : 'Upload'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
