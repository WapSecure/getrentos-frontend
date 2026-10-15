'use client';

import { useState } from 'react';
import { FileCheck2 } from 'lucide-react';
import { Badge, Button, Input, Select, Textarea } from '@getrentos/ui';
import { formatDate } from '@getrentos/shared';
import type { LandPerfection, LandPerfectionStep } from '@/types/landPurchase';
import { LandCaseSection, PanelMessage } from '@/components/admin/land/case/shared';

const STEP_VARIANT: Record<string, 'success' | 'info' | 'neutral' | 'danger'> = {
  NOT_STARTED: 'neutral',
  SUBMITTED: 'info',
  APPROVED: 'success',
  REJECTED: 'danger',
  NOT_APPLICABLE: 'neutral',
};

/**
 * Title perfection (§9.5) for staff: open the case, name the accountable
 * professional, record each step's submission or approval (with its
 * reference), and complete with the final instrument and a legal review.
 */
export const LandPerfectionPanel = ({
  perfection,
  canAct,
  busy,
  onOpen,
  onAssign,
  onStep,
  onComplete,
}: {
  perfection: LandPerfection | null | undefined;
  canAct: boolean;
  busy: boolean;
  onOpen: () => void;
  onAssign: (input: { name: string; firm?: string; contact?: string }) => void;
  onStep: (
    key: string,
    status: LandPerfectionStep['status'],
    reference: string,
    note: string
  ) => void;
  onComplete: (input: { finalInstrumentReference: string; legalReview: string }) => void;
}) => {
  const [pro, setPro] = useState({ name: '', firm: '', contact: '' });
  const [stepKey, setStepKey] = useState('');
  const [stepStatus, setStepStatus] = useState<LandPerfectionStep['status'] | ''>('');
  const [stepRef, setStepRef] = useState('');
  const [stepNote, setStepNote] = useState('');
  const [instrument, setInstrument] = useState('');
  const [review, setReview] = useState('');

  if (!perfection) {
    return (
      <LandCaseSection title="Title perfection" icon={FileCheck2}>
        <PanelMessage>No case yet. It opens itself when the purchase completes.</PanelMessage>
        {canAct && (
          <Button size="xs" variant="outline" className="mt-3" onClick={onOpen} isLoading={busy}>
            Open title perfection now
          </Button>
        )}
      </LandCaseSection>
    );
  }
  const perfected = perfection.status === 'PERFECTED';

  return (
    <LandCaseSection
      title="Title perfection"
      icon={FileCheck2}
      description={`Opened ${formatDate(perfection.openedAt)}${perfection.professionalName ? ` · ${perfection.professionalName}${perfection.professionalFirm ? `, ${perfection.professionalFirm}` : ''}` : ' · no accountable professional named'}`}
      actions={
        <Badge
          variant={perfected ? 'success' : perfection.status === 'EXCEPTION' ? 'danger' : 'info'}
        >
          {perfection.status.toLowerCase()}
        </Badge>
      }
    >
      <ul className="space-y-1.5 text-sm">
        {perfection.steps.map((s) => (
          <li
            key={s.key}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
          >
            <span>
              {s.label}
              <span className="text-xs text-muted-foreground">
                {' '}
                · {s.owner.toLowerCase().replace(/_/g, ' ')}
                {s.dueDate && s.status !== 'APPROVED' ? ` · due ${formatDate(s.dueDate)}` : ''}
                {s.submissionReference ? ` · submitted ${s.submissionReference}` : ''}
                {s.approvalReference ? ` · approved ${s.approvalReference}` : ''}
                {s.escalationLevel === 2
                  ? ' · escalated'
                  : s.escalationLevel === 1
                    ? ' · late'
                    : ''}
              </span>
            </span>
            <Badge variant={STEP_VARIANT[s.status]}>
              {s.status.toLowerCase().replace(/_/g, ' ')}
            </Badge>
          </li>
        ))}
      </ul>

      {perfected ? (
        <p className="mt-3 text-sm text-foreground">
          Perfected {perfection.perfectedAt && formatDate(perfection.perfectedAt)}:{' '}
          {perfection.finalInstrumentReference}. {perfection.legalReview}
        </p>
      ) : (
        canAct && (
          <div className="mt-4 space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <Input
                value={pro.name}
                onChange={(e) => setPro({ ...pro, name: e.target.value })}
                placeholder="Professional's name"
                maxLength={200}
              />
              <Input
                value={pro.firm}
                onChange={(e) => setPro({ ...pro, firm: e.target.value })}
                placeholder="Firm (optional)"
                maxLength={200}
              />
              <Input
                value={pro.contact}
                onChange={(e) => setPro({ ...pro, contact: e.target.value })}
                placeholder="Phone or email (optional)"
                maxLength={200}
              />
              <Button
                size="xs"
                variant="outline"
                disabled={pro.name.trim().length < 2 || busy}
                onClick={() =>
                  onAssign({
                    name: pro.name.trim(),
                    ...(pro.firm.trim() ? { firm: pro.firm.trim() } : {}),
                    ...(pro.contact.trim() ? { contact: pro.contact.trim() } : {}),
                  })
                }
              >
                Name the professional
              </Button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Select
                value={stepKey}
                onValueChange={setStepKey}
                ariaLabel="Step"
                placeholder="Step"
                options={perfection.steps.map((s) => ({ value: s.key, label: s.label }))}
              />
              <Select
                value={stepStatus}
                onValueChange={(v) => setStepStatus(v as LandPerfectionStep['status'])}
                ariaLabel="New status"
                placeholder="New status"
                options={[
                  { value: 'SUBMITTED', label: 'Submitted (not an approval)' },
                  { value: 'APPROVED', label: 'Approved' },
                  { value: 'REJECTED', label: 'Rejected' },
                  { value: 'NOT_APPLICABLE', label: 'Not applicable' },
                ]}
              />
              <Input
                value={stepRef}
                onChange={(e) => setStepRef(e.target.value)}
                placeholder="Reference (file, approval or receipt number)"
                maxLength={200}
              />
              <Input
                value={stepNote}
                onChange={(e) => setStepNote(e.target.value)}
                placeholder="Note (optional)"
                maxLength={2000}
              />
              <Button
                size="xs"
                variant="outline"
                disabled={
                  !stepKey || !stepStatus || (stepStatus === 'APPROVED' && !stepRef.trim()) || busy
                }
                onClick={() => {
                  onStep(
                    stepKey,
                    stepStatus as LandPerfectionStep['status'],
                    stepRef.trim(),
                    stepNote.trim()
                  );
                  setStepRef('');
                  setStepNote('');
                }}
              >
                Record step
              </Button>
            </div>

            <div className="space-y-2">
              <Input
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                placeholder="Final registered instrument reference"
                maxLength={200}
              />
              <Textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={3}
                maxLength={4000}
                placeholder="Legal review of the completed file"
              />
              {perfection.blockers.length > 0 && (
                <ul className="list-disc pl-4 text-xs text-muted-foreground">
                  {perfection.blockers.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
              <Button
                size="xs"
                disabled={instrument.trim().length < 3 || review.trim().length < 10 || busy}
                onClick={() =>
                  onComplete({
                    finalInstrumentReference: instrument.trim(),
                    legalReview: review.trim(),
                  })
                }
              >
                Mark title perfected
              </Button>
            </div>
          </div>
        )
      )}
    </LandCaseSection>
  );
};
