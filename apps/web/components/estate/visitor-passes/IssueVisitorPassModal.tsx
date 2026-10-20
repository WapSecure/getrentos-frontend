'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import {
  Button,
  DatePicker,
  Field,
  IconButton,
  Input,
  ListSkeleton,
  Pagination,
} from '@getrentos/ui';
import type { Household } from '@/types/estate';

interface IssueVisitorPassModalProps {
  isOpen: boolean;
  households: Household[];
  householdTotal: number;
  householdPage: number;
  householdPageSize: number;
  onHouseholdPageChange: (page: number) => void;
  isHouseholdsLoading?: boolean;
  onClose: () => void;
  onSubmit: (data: {
    householdId: string;
    visitorName: string;
    visitorPhone?: string;
    purpose?: string;
    expiresAt?: string;
  }) => void;
  isSubmitting?: boolean;
}

export const IssueVisitorPassModal = ({
  isOpen,
  households,
  householdTotal,
  householdPage,
  householdPageSize,
  onHouseholdPageChange,
  isHouseholdsLoading,
  onClose,
  onSubmit,
  isSubmitting,
}: IssueVisitorPassModalProps) => {
  const [householdId, setHouseholdId] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  // The server query is already constrained to active households. Keep the
  // guard here to prevent a stale cached record from being selected.
  const activeHouseholds = households.filter((h) => h.status === 'active');

  const handleClose = () => {
    setHouseholdId('');
    setVisitorName('');
    setVisitorPhone('');
    setPurpose('');
    setExpiresAt('');
    onClose();
  };

  const canSubmit = householdId && visitorName.trim().length > 0;

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
              <div>
                <p className="block text-sm font-medium text-foreground mb-1">Household</p>
                <div className="overflow-hidden rounded-lg border border-border">
                  {isHouseholdsLoading ? (
                    <ListSkeleton
                      rows={3}
                      label="Loading households"
                      className="rounded-none border-0"
                    />
                  ) : activeHouseholds.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-muted-foreground">
                      No active households found.
                    </p>
                  ) : (
                    <div
                      className="divide-y divide-border"
                      role="radiogroup"
                      aria-label="Household"
                    >
                      {activeHouseholds.map((household) => {
                        const isSelected = household.id === householdId;
                        return (
                          <button
                            key={household.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => setHouseholdId(household.id)}
                            className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors ${
                              isSelected
                                ? 'bg-primary/10 text-primary'
                                : 'text-foreground hover:bg-secondary'
                            }`}
                          >
                            <span>
                              {household.unitLabel}: {household.residentName}
                            </span>
                            <span
                              aria-hidden="true"
                              className={`h-3 w-3 shrink-0 rounded-full border ${
                                isSelected
                                  ? 'border-primary bg-primary'
                                  : 'border-muted-foreground/50'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {householdTotal > 0 && (
                    <Pagination
                      page={householdPage}
                      pageSize={householdPageSize}
                      total={householdTotal}
                      onPageChange={onHouseholdPageChange}
                    />
                  )}
                </div>
              </div>

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
                    householdId,
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
