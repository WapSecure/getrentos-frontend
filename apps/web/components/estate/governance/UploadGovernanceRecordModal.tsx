'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Upload, X } from 'lucide-react';
import { Button, DatePicker, LegacyInput, Select } from '@getrentos/ui';

interface UploadGovernanceRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    type: 'BYLAWS' | 'MEETING_MINUTES' | 'OTHER';
    meetingDate?: string;
    file: File;
  }) => void;
  isSubmitting?: boolean;
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
}: UploadGovernanceRecordModalProps) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('BYLAWS');
  const [meetingDate, setMeetingDate] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleClose = () => {
    setTitle('');
    setType('BYLAWS');
    setMeetingDate('');
    setFile(null);
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
              <h3 className="font-semibold text-foreground">Upload Governance Record</h3>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
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
                <div className="border-2 border-dashed rounded-xl p-6 text-center border-border">
                  {file ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      <button
                        onClick={() => setFile(null)}
                        className="text-xs text-red-500 hover:opacity-80"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                      <label className="cursor-pointer">
                        <span className="text-sm text-primary hover:opacity-80">Choose a file</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-muted-foreground/70 mt-2">PDF or DOC up to 20MB</p>
                    </>
                  )}
                </div>
              </div>
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
