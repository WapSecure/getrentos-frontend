'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button, DocumentUpload, LegacyInput, Pagination, Select } from '@getrentos/ui';
import type { Gate, Household } from '@/types/estate';

interface LogDeliveryModalProps {
  isOpen: boolean;
  households: Household[];
  householdTotal: number;
  householdPage: number;
  householdPageSize: number;
  onHouseholdPageChange: (page: number) => void;
  isHouseholdsLoading?: boolean;
  gates?: Gate[];
  onClose: () => void;
  onSubmit: (data: {
    householdId: string;
    courier?: string;
    recipientName?: string;
    gateId?: string;
    photo?: File;
  }) => void;
  isSubmitting?: boolean;
}

export const LogDeliveryModal = ({
  isOpen,
  households,
  householdTotal,
  householdPage,
  householdPageSize,
  onHouseholdPageChange,
  isHouseholdsLoading,
  gates,
  onClose,
  onSubmit,
  isSubmitting,
}: LogDeliveryModalProps) => {
  const [householdId, setHouseholdId] = useState('');
  const [courier, setCourier] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [gateId, setGateId] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const gateOptions = (gates ?? []).map((gate) => ({ value: gate.id, label: gate.name }));

  const activeHouseholds = households.filter((h) => h.status === 'active');

  const handleClose = () => {
    setHouseholdId('');
    setCourier('');
    setRecipientName('');
    setGateId('');
    setPhoto(null);
    onClose();
  };

  const canSubmit = householdId.length > 0;

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
              <h3 className="font-semibold text-foreground">Log Delivery</h3>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Household</label>
                <div className="overflow-hidden rounded-lg border border-border">
                  {isHouseholdsLoading ? (
                    <p className="px-3 py-4 text-sm text-muted-foreground">Loading households…</p>
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
                              {household.unitLabel} — {household.residentName}
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

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Courier <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <LegacyInput
                  type="text"
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  placeholder="e.g. DHL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Recipient <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <LegacyInput
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Ada Okafor"
                />
              </div>

              {gateOptions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Gate</label>
                  <Select
                    value={gateId}
                    onValueChange={setGateId}
                    options={[{ value: '', label: 'Not specified' }, ...gateOptions]}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Photo <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <DocumentUpload
                  value={photo ? [{ id: 'photo', file: photo }] : []}
                  onChange={(items) => setPhoto(items[0]?.file ?? null)}
                  accept="image/*"
                  multiple={false}
                  label=""
                />
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
                  onSubmit({
                    householdId,
                    courier: courier.trim() || undefined,
                    recipientName: recipientName.trim() || undefined,
                    gateId: gateId || undefined,
                    photo: photo ?? undefined,
                  })
                }
              >
                {isSubmitting ? 'Logging…' : 'Log Delivery'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
