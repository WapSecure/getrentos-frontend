'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Building2, Clock, FileText, ShieldAlert, Upload } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardSkeleton,
  Field,
  Input,
  Select,
  useToast,
} from '@getrentos/ui';
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
  const set = (patch: Partial<AgencyProfileInput>) => setDraft({ ...form, ...patch });

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
    onError: (e: Error) => toast.error(e.message),
  });

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
  const complete =
    form.name.trim() &&
    form.registeredName.trim() &&
    form.registrationNumber.trim() &&
    form.registeredAddress.trim().length >= 5 &&
    form.contactEmail.includes('@') &&
    form.contactPhone.trim().length >= 7;

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
          <h2 className="text-sm font-semibold text-foreground">Firm details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Trading name">
              <Input
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="e.g. Lagos Homes"
              />
            </Field>
            <Field label="Registered name (as on the CAC certificate)">
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
            <Field label="CAC number">
              <Input
                value={form.registrationNumber}
                onChange={(e) => set({ registrationNumber: e.target.value })}
                placeholder="e.g. RC 1234567"
              />
            </Field>
            <Field label="Registered address" className="sm:col-span-2">
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
            <Field label="Business phone">
              <Input
                value={form.contactPhone}
                onChange={(e) => set({ contactPhone: e.target.value })}
                placeholder="+234…"
              />
            </Field>
            <Field label="Business email" className="sm:col-span-2">
              <Input
                type="email"
                value={form.contactEmail}
                onChange={(e) => set({ contactEmail: e.target.value })}
                placeholder="ops@yourfirm.ng"
              />
            </Field>
          </div>
          <Button
            onClick={() => save.mutate()}
            disabled={!complete}
            isLoading={save.isPending}
            loadingText="Saving…"
          >
            {firm ? 'Save details' : 'Create my firm'}
          </Button>

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
