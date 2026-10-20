'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Lock, X } from 'lucide-react';
import {
  Button,
  Checkbox,
  DatePicker,
  DocumentUpload,
  Field,
  IconButton,
  Input,
  Select,
} from '@getrentos/ui';
import { useEstatePlan } from '@/hooks/useEstatePlan';

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
  /** Set when uploading a new version of an existing record: pre-fills the title and type. */
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
  const { isPro } = useEstatePlan();

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
              <IconButton label="Close" icon={<X />} size="sm" onClick={handleClose} />
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {newVersionOf && (
                <p className="text-xs text-muted-foreground -mt-1">
                  Replaces the current version of “{newVersionOf.title}”. The old version stays
                  available in its history.
                </p>
              )}

              <Field label="Title" required>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 2026 Bylaws Amendment"
                />
              </Field>

              <Field label="Type">
                <Select value={type} onValueChange={setType} options={typeOptions} />
              </Field>

              {type === 'MEETING_MINUTES' && (
                <Field label="Meeting Date" optionalLabel="(optional)">
                  <DatePicker value={meetingDate} onChange={setMeetingDate} clearable />
                </Field>
              )}

              <div>
                <p className="block text-sm font-medium text-foreground mb-1">File</p>
                <DocumentUpload
                  value={file ? [{ id: 'file', file }] : []}
                  onChange={(items) => setFile(items[0]?.file ?? null)}
                  accept=".pdf,.doc,.docx"
                  multiple={false}
                  label=""
                  hint="PDF or DOC up to 20MB"
                />
              </div>

              <Checkbox
                checked={requiresSignatures}
                onCheckedChange={setRequiresSignatures}
                label={
                  <span className="inline-flex items-center gap-2">
                    Require every committee member to sign before it&apos;s approved
                    {!isPro && (
                      <Lock
                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70"
                        aria-label="Pro plan feature"
                      />
                    )}
                  </span>
                }
              />
            </div>

            <div className="p-4 border-t border-border flex gap-3 shrink-0">
              <Button variant="ghost" fullWidth onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                disabled={!canSubmit}
                isLoading={isSubmitting}
                loadingText="Uploading…"
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
                Upload
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
