'use client';

import { useState } from 'react';
import { Check, Upload, FileText, User, Briefcase, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Property, Document as ApplicationDocument } from '@/types/renter';

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
}

interface ApplicationWizardProps {
  property: Property;
  initialData: ApplicationFormData;
  onSubmit: (data: ApplicationFormData) => void;
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

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary';

export const ApplicationWizard = ({ property, initialData, onSubmit }: ApplicationWizardProps) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<ApplicationFormData>(initialData);

  const update = <K extends keyof ApplicationFormData>(key: K, value: ApplicationFormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleDocument = (name: string) => {
    setData((prev) => ({
      ...prev,
      documents: prev.documents.map((doc) =>
        doc.name === name ? { ...doc, uploaded: !doc.uploaded } : doc
      ),
    }));
  };

  const canAdvance = () => {
    if (stepIndex === 0) return data.fullName.trim() && data.email.trim() && data.phone.trim();
    if (stepIndex === 1) return data.employer.trim() && data.monthlyIncome.trim();
    if (stepIndex === 2) return data.documents.filter((d) => d.required).every((d) => d.uploaded);
    return true;
  };

  const goNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      onSubmit(data);
    }
  };

  const goBack = () => setStepIndex((i) => Math.max(0, i - 1));

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex border-b border-border overflow-x-auto">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isActive = i === stepIndex;
          const isDone = i < stepIndex;
          return (
            <div
              key={step.key}
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
            </div>
          );
        })}
      </div>

      <div className="p-5 space-y-4">
        {stepIndex === 0 && (
          <div className="space-y-3">
            <Field label="Full name">
              <input
                value={data.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                className={inputClass}
                placeholder="e.g. David Okoro"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={data.email}
                onChange={(e) => update('email', e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Phone number">
              <input
                value={data.phone}
                onChange={(e) => update('phone', e.target.value)}
                className={inputClass}
                placeholder="+234 800 000 0000"
              />
            </Field>
            <Field label="Current address">
              <input
                value={data.currentAddress}
                onChange={(e) => update('currentAddress', e.target.value)}
                className={inputClass}
                placeholder="Street, area, city"
              />
            </Field>
          </div>
        )}

        {stepIndex === 1 && (
          <div className="space-y-3">
            <Field label="Employer">
              <input
                value={data.employer}
                onChange={(e) => update('employer', e.target.value)}
                className={inputClass}
                placeholder="Company name"
              />
            </Field>
            <Field label="Employment status">
              <select
                value={data.employmentStatus}
                onChange={(e) => update('employmentStatus', e.target.value)}
                className={inputClass}
              >
                <option value="Employed">Employed</option>
                <option value="Self-employed">Self-employed</option>
                <option value="Business owner">Business owner</option>
                <option value="Student">Student</option>
              </select>
            </Field>
            <Field label="Monthly income (₦)">
              <input
                inputMode="numeric"
                value={data.monthlyIncome}
                onChange={(e) => update('monthlyIncome', e.target.value.replace(/[^0-9]/g, ''))}
                className={inputClass}
                placeholder="e.g. 600000"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Preferred move-in date">
                <input
                  type="date"
                  value={data.moveInDate}
                  onChange={(e) => update('moveInDate', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Lease term">
                <select
                  value={data.leaseTerm}
                  onChange={(e) => update('leaseTerm', e.target.value)}
                  className={inputClass}
                >
                  <option value="6 months">6 months</option>
                  <option value="12 months">12 months</option>
                  <option value="24 months">24 months</option>
                </select>
              </Field>
            </div>
          </div>
        )}

        {stepIndex === 2 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-2">
              Upload the documents your landlord requires to review your application.
            </p>
            {data.documents.map((doc) => (
              <div
                key={doc.name}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{doc.name}</span>
                  {doc.required && <span className="text-xs text-red-500">Required</span>}
                </div>
                <Button
                  size="sm"
                  variant={doc.uploaded ? 'outline' : 'primary'}
                  className="gap-1.5"
                  onClick={() => toggleDocument(doc.name)}
                >
                  {doc.uploaded ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Uploaded
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            ))}
            <Field label="Additional notes for the landlord (optional)">
              <textarea
                value={data.notes}
                onChange={(e) => update('notes', e.target.value)}
                className={`${inputClass} min-h-20`}
                placeholder="Anything you'd like the landlord to know"
              />
            </Field>
          </div>
        )}

        {stepIndex === 3 && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-secondary space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Applicant</span>
                <span className="text-foreground font-medium">{data.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contact</span>
                <span className="text-foreground font-medium">
                  {data.email} · {data.phone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Employer</span>
                <span className="text-foreground font-medium">{data.employer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly income</span>
                <span className="text-foreground font-medium">
                  {data.monthlyIncome ? nairaFormatter.format(Number(data.monthlyIncome)) : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Move-in / Term</span>
                <span className="text-foreground font-medium">
                  {data.moveInDate || '—'} · {data.leaseTerm}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Documents ready</span>
                <span className="text-foreground font-medium">
                  {data.documents.filter((d) => d.uploaded).length}/{data.documents.length}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              By submitting, you agree to share this information with{' '}
              {property.landlordName || 'the landlord'} for the purpose of reviewing your rental
              application for {property.title}.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 p-4 border-t border-border">
        <Button variant="ghost" onClick={goBack} disabled={stepIndex === 0}>
          Back
        </Button>
        <Button variant="primary" onClick={goNext} disabled={!canAdvance()}>
          {stepIndex === steps.length - 1 ? 'Submit Application' : 'Continue'}
        </Button>
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="block text-xs font-medium text-muted-foreground mb-1">{label}</span>
    {children}
  </label>
);
