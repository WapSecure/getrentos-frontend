'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Scale } from '@sureground/icons';
import {
  Button,
  CurrencyInput,
  DatePicker,
  DocumentUpload,
  Field,
  Input,
  Select,
  type PendingUpload,
} from '@sureground/ui';
import {
  unwrap,
  VALUATION_METHOD_OPTIONS,
  valuationSentence,
  type PropertyValuation,
  type ValuationMethod,
} from '@sureground/shared';
import { readLandApiError } from '@/lib/landDiligence';
import { adminLandProfessionalService } from '@/services/adminLandProfessionalService';
import { LandCaseSection, PanelMessage } from './case/shared';

const today = () => new Date().toISOString().slice(0, 10);

/**
 * DIA-30: staff record an accredited valuer's signed report on their behalf. The API refuses anyone with an
 * interest in the property (valuer or staff) and anything without the report.
 */
export function RecordValuationPanel({ professionalId }: { professionalId: string }) {
  const [property, setProperty] = useState('');
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<ValuationMethod | ''>('');
  const [inspectedAt, setInspectedAt] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const [recorded, setRecorded] = useState<PropertyValuation | null>(null);

  const file = uploads[0]?.file;
  const datesOk = !inspectedAt || !reportDate || inspectedAt <= reportDate;
  const ready =
    property.trim().length > 0 &&
    amount > 0 &&
    Boolean(method && inspectedAt && reportDate && file) &&
    datesOk;

  const record = useMutation({
    mutationFn: () =>
      unwrap(
        adminLandProfessionalService.recordValuation(professionalId, {
          propertyId: property.trim(),
          amount,
          method: method as ValuationMethod,
          inspectedAt,
          reportDate,
          file: file as File,
        })
      ),
    onSuccess: (valuation) => {
      setRecorded(valuation);
      setProperty('');
      setAmount(0);
      setMethod('');
      setInspectedAt('');
      setReportDate('');
      setUploads([]);
    },
  });

  return (
    <LandCaseSection title="Record a valuation" icon={Scale}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (ready) record.mutate();
        }}
      >
        <Field label="Property" htmlFor="valuation-property" hint="Reference code or id" required>
          <Input
            id="valuation-property"
            value={property}
            onChange={(e) => setProperty(e.target.value)}
            placeholder="PR-AB7K-9Q"
          />
        </Field>
        <Field label="Value in the report" htmlFor="valuation-amount" required>
          <CurrencyInput
            id="valuation-amount"
            prefix="₦"
            value={amount || ''}
            onValueChange={setAmount}
          />
        </Field>
        <Field label="Method" required>
          <Select
            value={method}
            onValueChange={(value) => setMethod(value as ValuationMethod)}
            options={VALUATION_METHOD_OPTIONS}
            placeholder="Choose a method"
            ariaLabel="Valuation method"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Inspected on" required>
            <DatePicker value={inspectedAt} onChange={setInspectedAt} max={reportDate || today()} />
          </Field>
          <Field label="Report date" required>
            <DatePicker value={reportDate} onChange={setReportDate} max={today()} />
          </Field>
        </div>
        <DocumentUpload
          value={uploads}
          onChange={setUploads}
          multiple={false}
          maxSizeMB={20}
          label="Signed valuation report"
        />
        {!datesOk && (
          <PanelMessage>The inspection must be on or before the report date.</PanelMessage>
        )}
        {record.error && (
          <PanelMessage>
            {readLandApiError(record.error, 'That did not go through.').message}
          </PanelMessage>
        )}
        {recorded && <PanelMessage>Recorded. {valuationSentence(recorded)}.</PanelMessage>}
        <Button type="submit" disabled={!ready || record.isPending} isLoading={record.isPending}>
          Record valuation
        </Button>
      </form>
    </LandCaseSection>
  );
}
