'use client';

import { useState } from 'react';
import {
  Button,
  DatePicker,
  Dialog,
  DialogContent,
  DialogTitle,
  Field,
  Input,
  ListSkeleton,
  Pagination,
  RadioGroup,
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
    <Dialog open={isOpen} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent size="md">
        <DialogTitle className="text-lg font-semibold text-foreground">Issue Visitor Pass</DialogTitle>

        <div className="mt-4 space-y-4">
          <Field label="Household" required>
            <div className="overflow-hidden rounded-lg border border-border">
              {isHouseholdsLoading ? (
                <ListSkeleton rows={3} label="Loading households" className="rounded-none border-0" />
              ) : activeHouseholds.length === 0 ? (
                <p className="px-3 py-4 text-sm text-muted-foreground">No active households found.</p>
              ) : (
                <RadioGroup
                  value={householdId}
                  onValueChange={setHouseholdId}
                  options={activeHouseholds.map((household) => ({
                    value: household.id,
                    label: `${household.unitLabel}: ${household.residentName}`,
                  }))}
                  className="p-3"
                />
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
          </Field>

          <Field label="Visitor Name" required>
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

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
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
      </DialogContent>
    </Dialog>
  );
};
