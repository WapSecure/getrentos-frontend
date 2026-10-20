'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertTriangle, BadgeCheck, CheckCircle2, ShieldAlert, ShieldCheck } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  CurrencyInput,
  Field,
  Input,
  Select,
  Textarea,
} from '@getrentos/ui';

import { unwrap } from '@/lib/apiHelpers';
import { ROUTES } from '@/lib/constants/auth';
import { SUPPORT, hasSupportLine } from '@/lib/support';
import {
  checkContact,
  homeTeam,
  reportImpersonation,
  type CheckKind,
  type CheckResult,
  type ImpersonationChannel,
} from '@/services/homeTeamService';

const CHANNELS: { value: ImpersonationChannel; label: string }[] = [
  { value: 'PHONE', label: 'Phone call or SMS' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'BANK_ACCOUNT', label: 'Asked me to pay a bank account' },
  { value: 'IN_PERSON', label: 'In person' },
  { value: 'OTHER', label: 'Something else' },
];

const Verdict = ({ result }: { result: CheckResult }) => {
  if (result.verdict === 'VERIFIED') {
    return (
      <Alert variant="success" icon={CheckCircle2}>
        This is {result.name}, {result.role.toLowerCase()} for {result.propertyTitle}. Even so, only
        pay rent in GetRentos.
      </Alert>
    );
  }
  if (result.verdict === 'NEVER_PAY_OUTSIDE') {
    return (
      <Alert variant="danger" icon={ShieldAlert}>
        Do not pay into any bank account, whoever asks. Your landlord and manager are paid by
        GetRentos; you pay only in GetRentos. If someone asked you to pay this account, report it
        below.
      </Alert>
    );
  }
  if (result.verdict === 'INVALID') {
    return <p className="text-sm text-destructive">{result.message}</p>;
  }
  return (
    <Alert variant="danger" icon={AlertTriangle}>
      This is not anyone who manages your home. Do not pay them or share codes or documents. Report
      it below.
    </Alert>
  );
};

/**
 * Who really manages the tenant's home, and how to tell an impostor: the
 * verified landlord and managers (contacts shown partly, to compare against),
 * the rule that rent is paid only in GetRentos, a check for any number or
 * email someone used, and a report that reaches GetRentos and the real
 * landlord.
 */
export const HomeTeamCard = () => {
  const team = useQuery({ queryKey: ['renter', 'home-team'], queryFn: () => unwrap(homeTeam()) });
  const [kind, setKind] = useState<CheckKind>('PHONE');
  const [value, setValue] = useState('');
  const [reporting, setReporting] = useState(false);
  const [channel, setChannel] = useState<ImpersonationChannel>('PHONE');
  const [contactValue, setContactValue] = useState('');
  const [claimedToBe, setClaimedToBe] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [paid, setPaid] = useState(false);
  const [reported, setReported] = useState(false);
  const [reportLeaseId, setReportLeaseId] = useState('');

  const check = useMutation({ mutationFn: () => unwrap(checkContact(kind, value.trim())) });
  const report = useMutation({
    mutationFn: () =>
      unwrap(
        reportImpersonation({
          leaseId: reportLeaseId || team.data?.[0]?.leaseId,
          channel,
          contactValue: contactValue.trim() || undefined,
          claimedToBe: claimedToBe.trim(),
          description: description.trim(),
          ...(amount > 0 ? { amountAsked: amount } : {}),
          paid,
        })
      ),
    onSuccess: () => {
      setReported(true);
      setReporting(false);
    },
  });

  const homes = team.data ?? [];
  if (team.isLoading || homes.length === 0) return null;

  return (
    <Card className="p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
        <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
        Who manages your home
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        These are the only people verified to act for your home. Anyone else claiming to be your
        landlord, a new manager or GetRentos is not.
      </p>

      <div className="mt-4 space-y-4">
        {homes.map((h) => (
          <div key={h.leaseId}>
            <p className="text-sm font-medium text-foreground">
              {h.propertyTitle}
              {h.managedBy && (
                <span className="text-muted-foreground"> · managed by {h.managedBy}</span>
              )}
            </p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {h.people.map((p) => (
                <li key={`${p.name}-${p.role}`} className="rounded-xl border border-border p-3">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <BadgeCheck className="h-4 w-4 text-primary" aria-hidden />
                    {p.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{p.role}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[p.phone && `Phone ${p.phone}`, p.email].filter(Boolean).join(' · ') ||
                      'Reach them in Messages'}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground">
        <p className="font-medium">Pay rent only in GetRentos.</p>
        <p className="mt-1 text-muted-foreground">
          Use{' '}
          <Link href={ROUTES.RENTER_PAYMENTS} className="font-medium text-primary hover:underline">
            Payments
          </Link>
          . GetRentos never asks you to pay into a personal account, and a change of manager never
          changes how you pay.
          {hasSupportLine() && (
            <>
              {' '}
              GetRentos support only contacts you from{' '}
              {[SUPPORT.phone, SUPPORT.whatsapp].filter(Boolean).join(' or ')}.
            </>
          )}
        </p>
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-foreground">Check a contact</h3>
        <p className="text-xs text-muted-foreground">
          Someone called, messaged or sent account details? Check them before you do anything.
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <div className="sm:w-48">
            <Select
              ariaLabel="What to check"
              value={kind}
              onValueChange={(v) => {
                setKind(v as CheckKind);
                check.reset();
              }}
              searchable={false}
              options={[
                { value: 'PHONE', label: 'Phone number' },
                { value: 'EMAIL', label: 'Email address' },
                { value: 'BANK_ACCOUNT', label: 'Bank account' },
              ]}
            />
          </div>
          <Input
            aria-label="Number, email or account"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={
              kind === 'EMAIL'
                ? 'name@example.com'
                : kind === 'PHONE'
                  ? '0803 123 4567'
                  : 'Account number'
            }
          />
          <Button
            className="shrink-0"
            isLoading={check.isPending}
            disabled={value.trim().length < 3}
            onClick={() => check.mutate()}
          >
            Check
          </Button>
        </div>
        <div className="mt-2">
          {check.data && <Verdict result={check.data} />}
          {check.error && <Alert variant="danger">{(check.error as Error).message}</Alert>}
        </div>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        {reported ? (
          <p className="flex items-start gap-1.5 text-sm text-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
            Thank you. GetRentos will look into it, and your landlord and manager have been warned
            (without your name). If you already paid, also report it to your bank now.
          </p>
        ) : !reporting ? (
          <Button
            variant="link"
            onClick={() => setReporting(true)}
            className="whitespace-normal text-left font-medium text-destructive"
          >
            Report someone posing as your landlord, manager or GetRentos
          </Button>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Report an impostor</h3>
            {homes.length > 1 && (
              <Field label="Which home">
                <Select
                  ariaLabel="Which home"
                  value={reportLeaseId || homes[0].leaseId}
                  onValueChange={setReportLeaseId}
                  options={homes.map((h) => ({ value: h.leaseId, label: h.propertyTitle }))}
                />
              </Field>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="How they contacted you">
                <Select
                  ariaLabel="How they contacted you"
                  value={channel}
                  onValueChange={(v) => setChannel(v as ImpersonationChannel)}
                  searchable={false}
                  options={CHANNELS}
                />
              </Field>
              <Field label="Their number, email or account" hint="Optional." htmlFor="imp-contact">
                <Input
                  id="imp-contact"
                  value={contactValue}
                  onChange={(e) => setContactValue(e.target.value)}
                />
              </Field>
              <Field label="Who they said they were" htmlFor="imp-claimed">
                <Input
                  id="imp-claimed"
                  value={claimedToBe}
                  onChange={(e) => setClaimedToBe(e.target.value)}
                  placeholder="e.g. your new manager"
                />
              </Field>
              <Field label="Amount they asked for" hint="Optional.">
                <CurrencyInput prefix="₦" value={amount || ''} onValueChange={setAmount} />
              </Field>
            </div>
            <Field label="What happened" htmlFor="imp-description">
              <Textarea
                id="imp-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
            <Checkbox checked={paid} onCheckedChange={setPaid} label="I already paid them" />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="danger"
                isLoading={report.isPending}
                disabled={claimedToBe.trim().length < 2 || description.trim().length < 10}
                onClick={() => report.mutate()}
              >
                Send report
              </Button>
              <Button variant="ghost" onClick={() => setReporting(false)}>
                Cancel
              </Button>
            </div>
            {report.error && <Alert variant="danger">{(report.error as Error).message}</Alert>}
          </div>
        )}
      </div>
    </Card>
  );
};
