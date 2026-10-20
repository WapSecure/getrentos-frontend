'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button, DatePicker, Field, IconButton, Input } from '@getrentos/ui';

interface IssueResidentVisitorPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    visitorName: string;
    visitorPhone?: string;
    purpose?: string;
    expiresAt?: string;
  }) => void;
  isSubmitting?: boolean;
}

export const IssueResidentVisitorPassModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: IssueResidentVisitorPassModalProps) => {
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const handleClose = () => {
    setVisitorName('');
    setVisitorPhone('');
    setPurpose('');
    setExpiresAt('');
    onClose();
  };

  const canSubmit = visitorName.trim().length > 0;

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
              <h3 className="font-semibold text-foreground">Issue Visitor Pass</h3>
              <IconButton label="Close" icon={<X />} size="sm" onClick={handleClose} />
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <Field label="Visitor Name">
                <Input
                  type="text"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="e.g. Tunde Adekunle"
                />
              </Field>

              <Field label="Phone" optionalLabel="(optional)">
                <Input
                  type="tel"
                  value={visitorPhone}
                  onChange={(e) => setVisitorPhone(e.target.value)}
                  placeholder="e.g. 08012345678"
                />
              </Field>

              <Field label="Purpose" optionalLabel="(optional)">
                <Input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Family visit"
                />
              </Field>

              <Field label="Expires" optionalLabel="(optional: defaults to 24 hours)">
                <DatePicker value={expiresAt} onChange={setExpiresAt} clearable />
              </Field>
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
                loadingText="Issuing…"
                onClick={() =>
                  onSubmit({
                    visitorName: visitorName.trim(),
                    visitorPhone: visitorPhone.trim() || undefined,
                    purpose: purpose.trim() || undefined,
                    expiresAt: expiresAt || undefined,
                  })
                }
              >
                Issue Pass
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
