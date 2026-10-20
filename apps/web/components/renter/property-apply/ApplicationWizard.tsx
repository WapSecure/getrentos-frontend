'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Check, Upload, FileText, Eye, X, User, Briefcase, ClipboardCheck } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  CurrencyInput,
  DatePicker,
  DescriptionList,
  Field,
  IconButton,
  Input,
  Select,
  Textarea,
} from '@getrentos/ui';
import type { Property, Document as ApplicationDocument } from '@/types/renter';
import { nameOnly } from '@/lib/validations/input';
import { renterService, type RenterDocument } from '@/services/renterService';
import { renterKeys } from '@/lib/queryKeys';
import { unwrap } from '@/lib/apiHelpers';

/** A line of help under a document, where the name alone doesn't say what to bring. */
const DOCUMENT_HINTS: Record<string, string> = {
  'Credit Report':
    'Optional, and it can strengthen your application. You can get your own credit report free once a year from a licensed bureau such as CRC, FirstCentral or CreditRegistry.',
};

export interface ApplicationFormData {
  fullName: string;
  email: string;
  phone: string;
  currentAddress: string;
  employer: string;
  employmentStatus: string;
  monthlyIncome: string;
  moveInDate: string;
  leaseTerm: string;
  notes: string;
  documents: ApplicationDocument[];
  nextOfKinName: string;
  nextOfKinPhone: string;
  nextOfKinRelationship: string;
  referenceName: string;
  referencePhone: string;
  referenceRelationship: string;
}

interface ApplicationWizardProps {
  property: Property;
  initialData: ApplicationFormData;
  onSubmit: (data: ApplicationFormData) => void;
  isSubmitting?: boolean;
}

const steps = [
  { key: 'personal', label: 'Personal Info', icon: User },
  { key: 'employment', label: 'Employment', icon: Briefcase },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'review', label: 'Review', icon: ClipboardCheck },
] as const;

const nairaFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const EMPLOYMENT_OPTIONS = ['Employed', 'Self-employed', 'Business owner', 'Student'].map(
  (value) => ({ value, label: value })
);

const LEASE_TERM_OPTIONS = ['6 months', '12 months', '24 months'].map((value) => ({
  value,
  label: value,
}));

export const ApplicationWizard = ({
  property,
  initialData,
  onSubmit,
  isSubmitting = false,
}: ApplicationWizardProps) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<ApplicationFormData>(initialData);

  const update = <K extends keyof ApplicationFormData>(key: K, value: ApplicationFormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const setDocument = (name: string, patch: Partial<ApplicationDocument>) => {
    setData((prev) => ({
      ...prev,
      documents: prev.documents.map((doc) => (doc.name === name ? { ...doc, ...patch } : doc)),
    }));
  };

  const [docError, setDocError] = useState<string | null>(null);
  const uploadMutation = useMutation({
    mutationFn: ({ doc, file }: { doc: ApplicationDocument; file: File }) =>
      unwrap(
        renterService.uploadDocument(file, doc.name, 'other', 'Rental application', ['application'])
      ),
    onMutate: () => setDocError(null),
    onSuccess: (uploaded, { doc }) => {
      setDocument(doc.name, { uploaded: true, documentId: uploaded.id, url: uploaded.url });
    },
    onError: (err) =>
      setDocError(
        err instanceof Error ? err.message : 'Could not upload the file. Please try again.'
      ),
  });

  const removeDocument = (name: string) =>
    setDocument(name, { uploaded: false, documentId: undefined, url: undefined });

  // Files already in the renter's document library can be attached instead of
  // uploaded again: the server accepts any document the applicant owns. Newest
  // first, so a same-named match is the most recent copy; expired ones are left out.
  const library = useQuery({
    queryKey: [...renterKeys.documents, 'application-library'],
    queryFn: () =>
      unwrap(renterService.listDocuments({ pageSize: 100, sortBy: 'date', sortOrder: 'desc' })),
  });
  const libraryDocs = (library.data?.items ?? []).filter((d) => d.status !== 'expired');
  const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
  const attachLibraryDoc = (name: string, file: RenterDocument) =>
    setDocument(name, { uploaded: true, documentId: file.id, url: file.url });
  const savedMatches = data.documents
    .filter((doc) => !doc.uploaded)
    .map((doc) => ({ doc, file: libraryDocs.find((d) => sameName(d.name, doc.name)) }))
    .filter((m): m is { doc: ApplicationDocument; file: RenterDocument } => !!m.file);
  const attachSavedMatches = () =>
    savedMatches.forEach(({ doc, file }) => attachLibraryDoc(doc.name, file));

  // A usable phone number: allows +, spaces, dashes and parentheses, but must
  // carry at least 10 actual digits so free text like "abc" cannot advance.
  const isValidPhone = (value: string) => {
    if (!/^[+\d][\d\s()-]*$/.test(value.trim())) return false;
    return value.replace(/\D/g, '').length >= 10;
  };

  // The rent expressed per month, so we can sanity-check stated income against it.
  const monthlyRent =
    property.period === 'year'
      ? property.price / 12
      : property.period === 'week'
        ? (property.price * 52) / 12
        : property.price;
  const incomeValue = Number(data.monthlyIncome);
  // Soft warning only: income that cannot cover a single month's rent is almost
  // certainly a typo or a non-starter, but we don't hard-block the application.
  const incomeBelowRent =
    data.monthlyIncome.trim() !== '' && incomeValue > 0 && incomeValue < monthlyRent;

  const canAdvance = () => {
    if (stepIndex === 0)
      return Boolean(
        data.fullName.trim() &&
        data.email.trim() &&
        isValidPhone(data.phone) &&
        data.currentAddress.trim()
      );
    // Employer is `@IsOptional()` on the API's SubmitApplicationDto, and this
    // same step offers "Student" as an employment status. Requiring it here
    // hard-blocked anyone without an employer: they had to invent one: with
    // Continue disabled and no explanation of what was missing.
    if (stepIndex === 1) return data.monthlyIncome.trim();
    if (stepIndex === 2) return data.documents.filter((d) => d.required).every((d) => d.uploaded);
    return true;
  };

  const goNext = () => {
    if (isSubmitting) return;
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      onSubmit(data);
    }
  };

  const goBack = () => setStepIndex((i) => Math.max(0, i - 1));

  return (
    <Card>
      <div className="border-b border-border bg-muted/30 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Step {stepIndex + 1} of {steps.length}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-foreground">{steps[stepIndex].label}</h2>
      </div>
      <ol aria-label="Application progress" className="flex overflow-x-auto border-b border-border">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isActive = i === stepIndex;
          const isDone = i < stepIndex;
          return (
            <li
              key={step.key}
              aria-current={isActive ? 'step' : undefined}
              className={`flex-1 min-w-27.5 flex items-center gap-2 px-3 py-3 text-xs font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-primary text-primary'
                  : isDone
                    ? 'border-transparent text-foreground'
                    : 'border-transparent text-muted-foreground'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  isDone
                    ? 'bg-primary text-primary-foreground'
                    : isActive
                      ? 'bg-accent text-primary'
                      : 'bg-secondary'
                }`}
              >
                {isDone ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
              </span>
              {step.label}
            </li>
          );
        })}
      </ol>

      <div className="p-5 space-y-4">
        {stepIndex === 0 && (
          <div className="space-y-3">
            <Field label="Full name">
              <Input
                value={data.fullName}
                onChange={(e) => update('fullName', nameOnly(e.target.value))}
                placeholder="e.g. David Okoro"
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={data.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Phone number">
              <Input
                type="tel"
                value={data.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="+234 800 000 0000"
              />
            </Field>
            <Field label="Current address">
              <Input
                value={data.currentAddress}
                onChange={(e) => update('currentAddress', e.target.value)}
                placeholder="Street, area, city"
              />
            </Field>
          </div>
        )}

        {stepIndex === 1 && (
          <div className="space-y-3">
            <Field label="Employer (optional)">
              <Input
                value={data.employer}
                onChange={(e) => update('employer', e.target.value)}
                placeholder="Company name"
              />
            </Field>
            <Field label="Employment status">
              <Select
                value={data.employmentStatus}
                onValueChange={(v) => update('employmentStatus', v)}
                options={EMPLOYMENT_OPTIONS}
                searchable={false}
              />
            </Field>
            <Field label="Monthly income">
              {/* Shown as 1,200,000 while typing; the form keeps the plain number. */}
              <CurrencyInput
                prefix="₦"
                value={data.monthlyIncome}
                onValueChange={(v) => update('monthlyIncome', v ? String(v) : '')}
                placeholder="e.g. 600,000"
              />
              {incomeBelowRent && (
                <p className="mt-1.5 text-xs text-warning">
                  This is below the monthly rent of {nairaFormatter.format(Math.round(monthlyRent))}
                  . Landlords usually look for income well above the rent, but you can still apply.
                </p>
              )}
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Preferred move-in date">
                <DatePicker
                  value={data.moveInDate}
                  onChange={(v) => update('moveInDate', v)}
                  min={new Date().toISOString().slice(0, 10)}
                />
              </Field>
              <Field label="Lease term">
                <Select
                  value={data.leaseTerm}
                  onValueChange={(v) => update('leaseTerm', v)}
                  options={LEASE_TERM_OPTIONS}
                  searchable={false}
                />
              </Field>
            </div>

            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-2">
              Next of kin (optional)
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Full name">
                <Input
                  value={data.nextOfKinName}
                  onChange={(e) => update('nextOfKinName', e.target.value)}
                  placeholder="e.g. Ngozi Okoro"
                />
              </Field>
              <Field label="Phone number">
                <Input
                  type="tel"
                  value={data.nextOfKinPhone}
                  onChange={(e) => update('nextOfKinPhone', e.target.value)}
                  placeholder="+234 800 000 0000"
                />
              </Field>
              <Field label="Relationship">
                <Input
                  value={data.nextOfKinRelationship}
                  onChange={(e) => update('nextOfKinRelationship', e.target.value)}
                  placeholder="e.g. Sibling"
                />
              </Field>
            </div>

            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-2">
              Reference (optional)
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Full name">
                <Input
                  value={data.referenceName}
                  onChange={(e) => update('referenceName', e.target.value)}
                  placeholder="e.g. Previous landlord"
                />
              </Field>
              <Field label="Phone number">
                <Input
                  type="tel"
                  value={data.referencePhone}
                  onChange={(e) => update('referencePhone', e.target.value)}
                  placeholder="+234 800 000 0000"
                />
              </Field>
              <Field label="Relationship">
                <Input
                  value={data.referenceRelationship}
                  onChange={(e) => update('referenceRelationship', e.target.value)}
                  placeholder="e.g. Former landlord"
                />
              </Field>
            </div>
          </div>
        )}

        {stepIndex === 2 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-2">
              Upload the documents your landlord requires to review your application, or use ones
              already in your documents.
            </p>
            {savedMatches.length > 0 && (
              <Alert
                variant="info"
                action={
                  <Button size="sm" variant="outline" onClick={attachSavedMatches}>
                    Use saved {savedMatches.length === 1 ? 'document' : 'documents'}
                  </Button>
                }
              >
                {savedMatches.length === 1
                  ? `Your ${savedMatches[0].doc.name} is already in your documents.`
                  : `${savedMatches.length} of these are already in your documents.`}
              </Alert>
            )}
            {data.documents.map((doc) => {
              const isUploading =
                uploadMutation.isPending && uploadMutation.variables?.doc.name === doc.name;
              return (
                <div
                  key={doc.name}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg bg-secondary"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-sm text-foreground truncate">{doc.name}</span>
                      {DOCUMENT_HINTS[doc.name] && (
                        <span className="block text-xs text-muted-foreground">
                          {DOCUMENT_HINTS[doc.name]}
                        </span>
                      )}
                    </span>
                    {doc.required && !doc.uploaded && (
                      <span className="text-xs text-destructive shrink-0">Required</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1 shrink-0">
                    {doc.uploaded ? (
                      <>
                        {doc.url && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View uploaded file"
                            aria-label={`View uploaded ${doc.name}`}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-card transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <Check className="w-3.5 h-3.5 text-success" />
                          </a>
                        )}
                        <IconButton
                          size="sm"
                          variant="danger"
                          label={`Remove ${doc.name}`}
                          icon={<X />}
                          onClick={() => removeDocument(doc.name)}
                        />
                      </>
                    ) : (
                      <>
                        {libraryDocs.length > 0 && (
                          <Select
                            ariaLabel={`Use a saved document for ${doc.name}`}
                            value=""
                            placeholder="From your documents…"
                            disabled={isUploading}
                            controlSize="sm"
                            className="w-44 max-w-full"
                            onValueChange={(id) => {
                              const file = libraryDocs.find((d) => d.id === id);
                              if (file) attachLibraryDoc(doc.name, file);
                            }}
                            options={[...libraryDocs]
                              .sort(
                                (a, b) =>
                                  Number(sameName(b.name, doc.name)) -
                                  Number(sameName(a.name, doc.name))
                              )
                              .map((file) => ({
                                value: file.id,
                                label: `${file.name} · ${new Date(file.uploadedAt).toLocaleDateString('en-NG')}`,
                              }))}
                          />
                        )}
                        <UploadButton
                          label={doc.name}
                          isUploading={isUploading}
                          onFile={(file) => uploadMutation.mutate({ doc, file })}
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {docError && <Alert variant="danger">{docError}</Alert>}
            <Field label="Additional notes for the landlord (optional)">
              <Textarea
                value={data.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="Anything you'd like the landlord to know"
              />
            </Field>
          </div>
        )}

        {stepIndex === 3 && (
          <div className="space-y-4">
            <DescriptionList
              layout="rows"
              className="rounded-lg bg-secondary px-3"
              items={[
                { label: 'Applicant', value: data.fullName },
                { label: 'Contact', value: `${data.email} · ${data.phone}` },
                { label: 'Current address', value: data.currentAddress },
                { label: 'Employer', value: data.employer || 'Not given' },
                {
                  label: 'Monthly income',
                  value: data.monthlyIncome
                    ? nairaFormatter.format(Number(data.monthlyIncome))
                    : '',
                },
                { label: 'Move-in / Term', value: `${data.moveInDate || '—'} · ${data.leaseTerm}` },
                {
                  label: 'Documents ready',
                  value: `${data.documents.filter((d) => d.uploaded).length}/${data.documents.length}`,
                },
              ]}
            />
            <p className="text-xs text-muted-foreground">
              By submitting, you agree to share this information with{' '}
              {property.landlordName || 'the landlord'} for the purpose of reviewing your rental
              application for {property.title}.
            </p>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-border bg-card p-4">
        <Button variant="ghost" onClick={goBack} disabled={stepIndex === 0 || isSubmitting}>
          Back
        </Button>
        <Button
          variant="primary"
          onClick={goNext}
          disabled={!canAdvance()}
          isLoading={isSubmitting}
          loadingText="Submitting…"
        >
          {stepIndex === steps.length - 1 ? 'Submit application' : 'Continue'}
        </Button>
      </div>
    </Card>
  );
};

const UploadButton = ({
  label,
  isUploading,
  onFile,
}: {
  label: string;
  isUploading: boolean;
  onFile: (file: File) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button
        size="xs"
        icon={<Upload className="w-3.5 h-3.5" />}
        isLoading={isUploading}
        loadingText="Uploading…"
        aria-label={`Upload ${label}`}
        onClick={() => inputRef.current?.click()}
      >
        Upload
      </Button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        tabIndex={-1}
        disabled={isUploading}
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onFile(file);
        }}
      />
    </>
  );
};
