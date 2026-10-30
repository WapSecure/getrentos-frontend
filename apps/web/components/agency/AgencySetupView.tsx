'use client';

import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Building2, Clock, FileText, ShieldAlert, Upload } from 'lucide-react';
import { Badge, Button, Card, CardSkeleton, Field, Input, Select, useToast } from '@getrentos/ui';
import { NIGERIA_STATES } from '@/lib/constants/locations';
import { getStoredUser, updateStoredUser } from '@/lib/authStorage';
import { formatDate } from '@/lib/format';
import {
  BUSINESS_TYPE_LABELS,
  agencyOnboardingService,
  type AgencyBusinessType,
  type AgencyOnboarding,
  type AgencyProfileInput,
} from '@/services/agencyOnboardingService';

const KEY = ['agency', 'onboarding'] as const;

const EMPTY: AgencyProfileInput = {
  name: '',
  registeredName: '',
  businessType: 'LIMITED_COMPANY',
  registrationNumber: '',
  registeredAddress: '',
  state: 'Lagos',
  contactEmail: '',
  contactPhone: '',
};

type FieldKey =
  | 'name'
  | 'registeredName'
  | 'registrationNumber'
  | 'registeredAddress'
  | 'contactPhone'
  | 'contactEmail';
type FieldErrors = Partial<Record<FieldKey, string>>;

/** In the order they appear on the form, so focus goes to the first one. */
const FIELD_ORDER: FieldKey[] = [
  'name',
  'registeredName',
  'registrationNumber',
  'registeredAddress',
  'contactPhone',
  'contactEmail',
];
const fieldId = (key: FieldKey) => `agency-setup-${key}`;

/** RC, BN or IT, then 4 to 9 digits, as printed on the certificate (same rule as the API). */
const CAC_NUMBER = /^(BN|RC|IT)\s?-?\d{4,9}$/i;
const CAC_HINT =
  'Enter it as printed on the certificate, e.g. RC 1234567, BN 3456789 or IT 123456.';

function validate(form: AgencyProfileInput): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.name.trim()) errors.name = 'Enter your firm’s trading name.';
  if (!form.registeredName.trim())
    errors.registeredName = 'Enter the registered name from the CAC certificate.';
  if (!form.registrationNumber.trim()) errors.registrationNumber = 'Enter the CAC number.';
  else if (!CAC_NUMBER.test(form.registrationNumber.trim()))
    errors.registrationNumber = `That CAC number does not look right. ${CAC_HINT}`;
  if (form.registeredAddress.trim().length < 5)
    errors.registeredAddress = 'Enter the registered address (at least 5 characters).';
  if (form.contactPhone.trim().length < 7) errors.contactPhone = 'Enter a business phone number.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim()))
    errors.contactEmail = 'Enter a valid business email address.';
  return errors;
}

/** Puts a server refusal on the field it is about, when it names one. */
function serverFieldError(message: string): FieldErrors | null {
  if (/CAC number|registration ?number/i.test(message)) return { registrationNumber: message };
  for (const key of FIELD_ORDER) {
    if (new RegExp(`\\b${key}\\b`).test(message)) return { [key]: message };
  }
  return null;
}

function focusFirst(errors: FieldErrors) {
  const first = FIELD_ORDER.find((key) => errors[key]);
  if (first) document.getElementById(fieldId(first))?.focus();
}

const fromFirm = (firm: AgencyOnboarding): AgencyProfileInput => ({
  name: firm.name,
  registeredName: firm.profile?.registeredName ?? '',
  businessType: firm.profile?.businessType ?? 'LIMITED_COMPANY',
  registrationNumber: firm.profile?.registrationNumber ?? '',
  registeredAddress: firm.profile?.registeredAddress ?? '',
  state: firm.profile?.state ?? 'Lagos',
  contactEmail: firm.profile?.contactEmail ?? '',
  contactPhone: firm.profile?.contactPhone ?? '',
});

/**
 * Starting a property management firm on GetRentos, and seeing where its
 * business verification stands. A firm can set up its team and clients while it
 * waits; GetRentos checks the CAC registration before it can receive payouts or
 * appear in the owners' vetted-firms directory.
 */
export function AgencySetupView() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<AgencyProfileInput | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const toast = useToast();

  const firmQuery = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const res = await agencyOnboardingService.mine();
      if (res.success) return res.data ?? null;
      if (res.status === 404) return null;
      throw new Error(res.error || 'Could not load your firm.');
    },
  });
  const firm = firmQuery.data ?? null;
  const form = draft ?? (firm ? fromFirm(firm) : EMPTY);
  const set = (patch: Partial<AgencyProfileInput>) => {
    setDraft({ ...form, ...patch });
    // A field's message goes once the person changes that field.
    const touched = Object.keys(patch) as FieldKey[];
    if (touched.some((key) => errors[key])) {
      setErrors((prev) => {
        const next = { ...prev };
        for (const key of touched) delete next[key];
        return next;
      });
    }
  };

  const onSaved = (next: AgencyOnboarding | undefined, message: string) => {
    queryClient.setQueryData(KEY, next ?? null);
    setDraft(null);
    toast.success(message);
  };

  const save = useMutation({
    mutationFn: async () => {
      const res = firm
        ? await agencyOnboardingService.update(form)
        : await agencyOnboardingService.create(form);
      if (!res.success) throw new Error(res.error || 'Could not save.');
      return res.data;
    },
    onSuccess: (next) => {
      if (!firm) {
        // The principal now manages properties too: let the app know without a re-login.
        const roles = getStoredUser<{ roles?: string[] }>()?.roles ?? [];
        if (!roles.includes('PROPERTY_MANAGER'))
          updateStoredUser({ roles: [...roles, 'PROPERTY_MANAGER'] });
        // Requests made before the firm existed were refused; let them re-run.
        queryClient.removeQueries({
          predicate: (q) => !(q.queryKey[0] === 'agency' && q.queryKey[1] === 'onboarding'),
        });
      }
      onSaved(
        next,
        firm ? 'Details saved.' : 'Your firm is set up. Next, upload the CAC certificate.'
      );
    },
    onError: (e: Error) => {
      const onField = serverFieldError(e.message);
      if (onField) {
        setErrors(onField);
        // Wait for the message to render before moving focus to it.
        requestAnimationFrame(() => focusFirst(onField));
      } else {
        toast.error(e.message);
      }
    },
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      requestAnimationFrame(() => focusFirst(found));
      return;
    }
    save.mutate();
  };

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const res = await agencyOnboardingService.uploadCertificate(file);
      if (!res.success) throw new Error(res.error || 'Could not upload.');
      return res.data;
    },
    onSuccess: (next) => onSaved(next, 'Certificate uploaded.'),
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = useMutation({
    mutationFn: async () => {
      const res = await agencyOnboardingService.submit();
      if (!res.success) throw new Error(res.error || 'Could not submit.');
      return res.data;
    },
    onSuccess: (next) => onSaved(next, 'Sent to GetRentos for verification.'),
    onError: (e: Error) => toast.error(e.message),
  });

  if (firmQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <CardSkeleton lines={2} />
        <CardSkeleton lines={6} />
      </div>
    );
  }

  const kyb = firm?.profile?.kybStatus ?? 'NOT_SUBMITTED';
  const editable = !firm || (firm.isOwner && (kyb === 'NOT_SUBMITTED' || kyb === 'REJECTED'));
  const errorCount = Object.keys(errors).length;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Building2 className="h-6 w-6 text-primary" aria-hidden />
          {firm ? firm.name : 'Start your property management firm'}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {firm
            ? 'Your firm’s registration with GetRentos.'
            : 'Manage properties for owners on GetRentos. Set up now; GetRentos verifies your CAC registration before you can receive payouts or appear to owners.'}
        </p>
      </div>

      {firm && <StatusCard firm={firm} />}

      {editable ? (
        <Card className="mt-6 space-y-4 p-6">
          <form
            noValidate
            onSubmit={onSubmit}
            className="space-y-4"
            aria-labelledby="agency-setup-details"
          >
            <h2 id="agency-setup-details" className="text-sm font-semibold text-foreground">
              Firm details
            </h2>
            <p className="text-xs text-muted-foreground">All fields are required.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Trading name" htmlFor={fieldId('name')} error={errors.name} required>
                <Input
                  value={form.name}
                  onChange={(e) => set({ name: e.target.value })}
                  placeholder="e.g. Lagos Homes"
                />
              </Field>
              <Field
                label="Registered name (as on the CAC certificate)"
                htmlFor={fieldId('registeredName')}
                error={errors.registeredName}
                required
              >
                <Input
                  value={form.registeredName}
                  onChange={(e) => set({ registeredName: e.target.value })}
                  placeholder="e.g. Lagos Homes Limited"
                />
              </Field>
              <Field label="Registration type">
                <Select
                  value={form.businessType}
                  onValueChange={(v) => set({ businessType: v as AgencyBusinessType })}
                  options={(Object.keys(BUSINESS_TYPE_LABELS) as AgencyBusinessType[]).map((t) => ({
                    value: t,
                    label: BUSINESS_TYPE_LABELS[t],
                  }))}
                />
              </Field>
              <Field
                label="CAC number"
                htmlFor={fieldId('registrationNumber')}
                hint={CAC_HINT}
                error={errors.registrationNumber}
                required
              >
                <Input
                  value={form.registrationNumber}
                  onChange={(e) => set({ registrationNumber: e.target.value })}
                  placeholder="e.g. RC 1234567"
                  autoComplete="off"
                />
              </Field>
              <Field
                label="Registered address"
                className="sm:col-span-2"
                htmlFor={fieldId('registeredAddress')}
                error={errors.registeredAddress}
                required
              >
                <Input
                  value={form.registeredAddress}
                  onChange={(e) => set({ registeredAddress: e.target.value })}
                  placeholder="Street, area, city"
                />
              </Field>
              <Field label="State">
                <Select
                  value={form.state}
                  onValueChange={(v) => set({ state: v })}
                  options={NIGERIA_STATES.map((s) => ({ value: s, label: s }))}
                />
              </Field>
              <Field
                label="Business phone"
                htmlFor={fieldId('contactPhone')}
                error={errors.contactPhone}
                required
              >
                <Input
                  value={form.contactPhone}
                  onChange={(e) => set({ contactPhone: e.target.value })}
                  placeholder="+234…"
                  type="tel"
                  autoComplete="tel"
                />
              </Field>
              <Field
                label="Business email"
                className="sm:col-span-2"
                htmlFor={fieldId('contactEmail')}
                error={errors.contactEmail}
                required
              >
                <Input
                  type="email"
                  autoComplete="email"
                  value={form.contactEmail}
                  onChange={(e) => set({ contactEmail: e.target.value })}
                  placeholder="ops@yourfirm.ng"
                />
              </Field>
            </div>
            {errorCount > 0 && (
              <p role="alert" className="text-sm text-destructive">
                {errorCount === 1
                  ? 'One field needs attention.'
                  : `${errorCount} fields need attention.`}
              </p>
            )}
            <Button type="submit" isLoading={save.isPending} loadingText="Saving…">
              {firm ? 'Save details' : 'Create my firm'}
            </Button>
          </form>

          {firm && (
            <div className="border-t border-border pt-4">
              <h2 className="text-sm font-semibold text-foreground">CAC certificate</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                A PDF or photo of the certificate that shows the number above.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {firm.profile?.certificateFileName ? (
                  <span className="flex items-center gap-1.5 text-sm text-foreground">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {firm.profile.certificateFileName}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">Nothing uploaded yet</span>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) upload.mutate(file);
                    e.target.value = '';
                  }}
                />
                <Button
                  variant="secondary"
                  onClick={() => fileRef.current?.click()}
                  isLoading={upload.isPending}
                  loadingText="Uploading…"
                  icon={<Upload className="h-4 w-4" />}
                >
                  {firm.profile?.certificateFileName ? 'Replace' : 'Upload'}
                </Button>
              </div>
              <Button
                className="mt-4"
                onClick={() => submit.mutate()}
                disabled={!firm.profile?.certificateFileName || draft !== null}
                isLoading={submit.isPending}
                loadingText="Submitting…"
              >
                Submit for verification
              </Button>
              {draft !== null && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Save your changes before submitting.
                </p>
              )}
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}

function StatusCard({ firm }: { firm: AgencyOnboarding }) {
  const kyb = firm.profile?.kybStatus ?? 'NOT_SUBMITTED';
  if (firm.status === 'SUSPENDED') {
    return (
      <Card className="flex items-start gap-3 p-5">
        <ShieldAlert className="mt-0.5 h-5 w-5 text-destructive" />
        <div>
          <p className="font-medium text-foreground">Suspended</p>
          <p className="text-sm text-muted-foreground">
            GetRentos has suspended this firm. Contact support to resolve it.
          </p>
        </div>
      </Card>
    );
  }
  if (firm.status === 'ACTIVE') {
    return (
      <Card className="flex items-start justify-between gap-3 p-5">
        <div className="flex items-start gap-3">
          <BadgeCheck className="mt-0.5 h-5 w-5 text-success" />
          <div>
            <p className="font-medium text-foreground">Verified</p>
            <p className="text-sm text-muted-foreground">
              Owners can find and appoint {firm.name}, and you can receive payouts.
            </p>
          </div>
        </div>
        <Button variant="outline" href="/agency">
          Go to your workspace
        </Button>
      </Card>
    );
  }
  return (
    <Card className="flex items-start gap-3 p-5">
      <Clock className="mt-0.5 h-5 w-5 text-warning" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground">
            {kyb === 'SUBMITTED'
              ? 'With GetRentos for verification'
              : kyb === 'REJECTED'
                ? 'Needs changes'
                : 'Verification not submitted yet'}
          </p>
          <Badge variant={kyb === 'REJECTED' ? 'danger' : 'warning'}>Pending</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {kyb === 'SUBMITTED'
            ? `Submitted ${firm.profile?.kybSubmittedAt ? formatDate(firm.profile.kybSubmittedAt) : ''}. You can keep setting up your team and clients meanwhile.`
            : kyb === 'REJECTED'
              ? `GetRentos said: ${firm.profile?.kybDecisionNote ?? 'please check your details'}. Fix them below and submit again.`
              : 'Fill in your details, upload the CAC certificate and submit. Until then you can set up, but not receive payouts.'}
        </p>
        <Link href="/agency" className="mt-2 inline-block text-sm text-primary hover:underline">
          Go to your workspace
        </Link>
      </div>
    </Card>
  );
}
