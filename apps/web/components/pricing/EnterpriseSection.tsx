'use client';

import { useState, type FormEvent } from 'react';
import { Check } from '@sureground/icons';
import { Alert } from '@sureground/ui/Alert';
import { Button } from '@sureground/ui/Button';
import { Card } from '@sureground/ui/Card';
import { Field } from '@sureground/ui/Field';
import { Input } from '@sureground/ui/Input';
import { Select } from '@sureground/ui/Select';
import { Textarea } from '@sureground/ui/Textarea';
import { formatCurrency } from '@sureground/shared';
import { Container } from '@/components/marketing/Container';
import { SectionIntro } from '@/components/marketing/SectionIntro';
import {
  subscriptionService,
  type EnterpriseLeadType,
  type PlanPricing,
} from '@/services/subscriptionService';

const naira = (kobo: number) => formatCurrency(kobo / 100);

const TYPES: { value: EnterpriseLeadType; label: string }[] = [
  { value: 'AGENCY', label: 'Agency or property management company' },
  { value: 'ESTATE', label: 'Estate or several estates' },
  { value: 'DEVELOPER', label: 'Developer' },
  { value: 'OWNER', label: 'Large landlord or institutional owner' },
  { value: 'OTHER', label: 'Something else' },
];

const EMPTY = {
  organizationName: '',
  organizationType: '' as EnterpriseLeadType | '',
  contactName: '',
  email: '',
  phone: '',
  size: '',
  message: '',
};

type FormState = typeof EMPTY;
type FieldName = 'organizationName' | 'organizationType' | 'contactName' | 'email';

function validate(form: FormState): Partial<Record<FieldName, string>> {
  const errors: Partial<Record<FieldName, string>> = {};
  if (!form.organizationName.trim()) errors.organizationName = 'Enter your organisation’s name.';
  if (!form.organizationType) errors.organizationType = 'Choose what kind of organisation it is.';
  if (!form.contactName.trim()) errors.contactName = 'Enter your name.';
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim()))
    errors.email = 'Enter an email address we can reply to.';
  return errors;
}

export function EnterpriseSection({ pricing }: { pricing?: PlanPricing }) {
  const org = pricing?.organization;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  const set = (name: keyof FormState) => (value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
    if (name in errors) setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    const first = (Object.keys(found) as FieldName[])[0];
    if (first) {
      document.getElementById(`enterprise-${first}`)?.focus();
      return;
    }
    setStatus('sending');
    const response = await subscriptionService.createEnterpriseLead({
      organizationName: form.organizationName.trim(),
      organizationType: form.organizationType as EnterpriseLeadType,
      contactName: form.contactName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      size: form.size.trim() || undefined,
      message: form.message.trim() || undefined,
    });
    setStatus(response.success ? 'sent' : 'failed');
  };

  const included = [
    org
      ? `${org.includedSeats} team seats, ${org.includedUnits} managed units or ${org.includedEstates} estates`
      : 'Team seats, managed units and estates sized to your organisation',
    'Team roles and permissions, client money, payout runs and the KPI pack',
    'Estate security: patrol rounds, dwell analytics, contractor passes and visitor ID checks',
    'Portfolio import, onboarding and a named contact',
  ];

  return (
    <section
      id="enterprise"
      aria-labelledby="pricing-enterprise"
      className="scroll-mt-24 py-20 md:py-28"
    >
      <Container className="grid items-start gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-16">
        <div>
          <SectionIntro
            id="pricing-enterprise"
            eyebrow="Enterprise"
            title="For agencies, estate operators and developers"
            lead="One plan for the whole organisation, with seats for your team. We agree the size with you and set it up together."
          />
          {org && (
            <p className="mt-2 text-[0.9375rem] text-muted-foreground">
              <span className="text-2xl font-medium text-foreground tabular-nums">
                From {naira(org.fromMonthlyKobo)}
              </span>{' '}
              a month, or {naira(org.fromAnnualKobo)} a year. Extra seats{' '}
              {naira(org.extraSeatMonthlyKobo)} a month each; every extra 100 units{' '}
              {naira(org.extraHundredUnitsMonthlyKobo)} a month.
            </p>
          )}
          <ul className="mt-8 flex flex-col gap-3">
            {included.map((item) => (
              <li key={item} className="flex gap-3 text-[0.9375rem]">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <Card className="p-6 sm:p-8">
          {status === 'sent' ? (
            <div role="status">
              <h3 className="text-lg font-semibold text-foreground">
                Thanks, we have your details
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Someone from our team will email {form.email.trim()} to arrange a short call.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold text-foreground">Talk to us about Enterprise</h3>
              <Field label="Organisation" error={errors.organizationName}>
                <Input
                  id="enterprise-organizationName"
                  autoComplete="organization"
                  value={form.organizationName}
                  onChange={(e) => set('organizationName')(e.target.value)}
                />
              </Field>
              <Field label="What kind of organisation is it?" error={errors.organizationType}>
                <Select
                  id="enterprise-organizationType"
                  value={form.organizationType}
                  onValueChange={set('organizationType')}
                  options={TYPES}
                  placeholder="Choose one"
                  searchable={false}
                  invalid={Boolean(errors.organizationType)}
                />
              </Field>
              <Field label="Your name" error={errors.contactName}>
                <Input
                  id="enterprise-contactName"
                  autoComplete="name"
                  value={form.contactName}
                  onChange={(e) => set('contactName')(e.target.value)}
                />
              </Field>
              <Field label="Email" error={errors.email}>
                <Input
                  id="enterprise-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => set('email')(e.target.value)}
                />
              </Field>
              <Field label="Phone (optional)">
                <Input
                  id="enterprise-phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => set('phone')(e.target.value)}
                />
              </Field>
              <Field
                label="Size (optional)"
                hint="For example: 350 units, or 3 estates with 900 homes"
              >
                <Input
                  id="enterprise-size"
                  value={form.size}
                  onChange={(e) => set('size')(e.target.value)}
                />
              </Field>
              <Field label="Anything else (optional)">
                <Textarea
                  id="enterprise-message"
                  rows={3}
                  value={form.message}
                  onChange={(e) => set('message')(e.target.value)}
                />
              </Field>
              {status === 'failed' && (
                <Alert variant="danger">
                  We couldn’t send that. Check your connection and try again.
                </Alert>
              )}
              <Button type="submit" variant="primary" isLoading={status === 'sending'}>
                Send
              </Button>
            </form>
          )}
        </Card>
      </Container>
    </section>
  );
}
