'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import {
  Button,
  Checkbox,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DocumentUpload,
  Field,
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
    <Dialog open={isOpen} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent size="md">
        <DialogTitle className="text-lg font-semibold text-foreground">
          {newVersionOf ? 'Upload New Version' : 'Upload Governance Record'}
        </DialogTitle>
        {newVersionOf && (
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Replaces the current version of “{newVersionOf.title}”. The old version stays available
            in its history.
          </DialogDescription>
        )}

        <div className="mt-5 space-y-4">
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

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
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
      </DialogContent>
    </Dialog>
  );
};
