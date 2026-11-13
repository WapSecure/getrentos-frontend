'use client';

import { useId, useState } from 'react';
import { CurrencyInput, DatePicker, Field, Select } from '@sureground/ui';
import {
  VALUATION_METHOD_OPTIONS,
  valuationNote,
  valuationSentence,
  type PropertyValuation,
  type ValuationMethod,
} from '@sureground/shared';
import type { LandReviewValuationInput } from '@/types/landReviewer';
import { isFileReady, LandDocumentUploadFields } from '../documents/LandDocumentUploadFields';
import { ReviewSubmissionSection, type ReviewSubmissionState } from './ReviewSubmissionSection';

const today = () => new Date().toISOString().slice(0, 10);

const Filed = ({ valuation }: { valuation: PropertyValuation }) => (
  <div className="rounded-2xl border border-border bg-card p-4 text-sm">
    <p className="font-medium text-foreground">{valuationSentence(valuation)}</p>
    <p className="mt-1 text-xs text-muted-foreground">{valuationNote(valuation)}</p>
  </div>
);

/** DIA-30: the valuer files the signed report with the value, method and dates; nothing else counts as a value. */
export const ReviewValuationSection = ({
  state,
  valuation,
  isSubmitting,
  onSubmit,
}: {
  state: ReviewSubmissionState;
  /** What I filed on this property already, if anything. */
  valuation: PropertyValuation | null | undefined;
  isSubmitting: boolean;
  onSubmit: (input: LandReviewValuationInput) => Promise<unknown>;
}) => {
  const id = useId();
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<ValuationMethod | ''>('');
  const [inspectedAt, setInspectedAt] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const datesProblem =
    inspectedAt && reportDate && inspectedAt > reportDate
      ? 'The inspection must be on or before the report date.'
      : null;
  const ready =
    amount > 0 &&
    Boolean(method && inspectedAt && reportDate) &&
    !datesProblem &&
    isFileReady(file);

  const submit = async () => {
    if (!ready || !method || !file) return;
    await onSubmit({ amount, method, inspectedAt, reportDate, file });
    setAmount(0);
    setMethod('');
    setInspectedAt('');
    setReportDate('');
    setFile(null);
  };

  return (
    <ReviewSubmissionSection
      id={`${id}-valuation`}
      title="Valuation"
      state={state}
      intro={
        valuation ? (
          <>
            <Filed valuation={valuation} />
            <p className="text-sm text-muted-foreground">
              Filing again records a new report; the latest report date is the one shown.
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            The figure is shown to the owner and investors with your name, the method and the report
            date. File it before your final report.
          </p>
        )
      }
      hint={datesProblem ?? 'Every field and the signed report are required.'}
      canSubmit={ready}
      isSubmitting={isSubmitting}
      submitLabel="File valuation"
      confirm={{
        title: 'File this valuation?',
        description:
          'It is recorded against your accreditation with the report attached and cannot be edited. A report counts for 12 months from its date.',
      }}
      onSubmit={submit}
      closed={
        valuation ? (
          <Filed valuation={valuation} />
        ) : (
          <p className="text-sm text-muted-foreground">No valuation was filed.</p>
        )
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Value in the report" htmlFor={`${id}-amount`} required>
          <CurrencyInput
            id={`${id}-amount`}
            prefix="₦"
            value={amount || ''}
            onValueChange={setAmount}
            disabled={isSubmitting}
          />
        </Field>
        <Field label="Method" required>
          <Select
            value={method}
            onValueChange={(value) => setMethod(value as ValuationMethod)}
            options={VALUATION_METHOD_OPTIONS}
            placeholder="Choose a method"
            ariaLabel="Valuation method"
            disabled={isSubmitting}
          />
        </Field>
        <Field label="Inspected on" htmlFor={`${id}-inspected`} required>
          <DatePicker
            id={`${id}-inspected`}
            value={inspectedAt}
            onChange={setInspectedAt}
            max={reportDate || today()}
            disabled={isSubmitting}
          />
        </Field>
        <Field label="Report date" htmlFor={`${id}-report`} required>
          <DatePicker
            id={`${id}-report`}
            value={reportDate}
            onChange={setReportDate}
            max={today()}
            disabled={isSubmitting}
          />
        </Field>
      </div>
      <LandDocumentUploadFields
        id={`${id}-file`}
        file={file}
        onFileChange={setFile}
        fileLabel="Signed valuation report"
        disabled={isSubmitting}
      />
    </ReviewSubmissionSection>
  );
};
