'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileBarChart, Landmark, Plus, RotateCcw, Send } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardSkeleton,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DatePicker,
  EmptyState,
  Field,
  Input,
  ListSkeleton,
  NumberInput,
  Pagination,
  Select,
  useToast,
} from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency, formatDate } from '@/lib/format';
import { estateKeys } from '@/lib/queryKeys';
import { estateService } from '@/services/estateService';
import { BUSINESS_TYPE_LABELS, type AgencyBusinessType } from '@/services/agencyOnboardingService';
import { StatementBreakdown } from '@/components/shared/financials/StatementBreakdown';
import { PayoutHeldNotice } from '@/components/shared/financials/PayoutHeldNotice';
import { StatementDisputeSection } from '@/components/shared/financials/StatementDisputeSection';
import type { EstateStatement } from '@/types/estate';

type GenerateForm = { periodStart: string; periodEnd: string };
const initialForm: GenerateForm = { periodStart: '', periodEnd: '' };

const PAGE_SIZE = 10;

const PAYOUT_BADGE: Record<
  EstateStatement['payoutStatus'],
  { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info' }
> = {
  PAID: { label: 'Paid out', variant: 'success' },
  PENDING: { label: 'Payout pending', variant: 'warning' },
  // Neither of these is a failure. Money held for a second signature is the
  // control working, and a refusal holds the money rather than losing it.
  AWAITING_APPROVAL: { label: 'Awaiting 2nd approval', variant: 'info' },
  FAILED: { label: 'Payout failed', variant: 'danger' },
  REJECTED: { label: 'Payout held back', variant: 'warning' },
};

interface EstateStatementsViewProps {
  estateId: string;
}

export function EstateStatementsView({ estateId }: EstateStatementsViewProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState<GenerateForm>(initialForm);
  const toast = useToast();

  const { data, isLoading } = useQuery({
    queryKey: [...estateKeys.statements(estateId), { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(estateService.listStatements(estateId, { page, pageSize: PAGE_SIZE })),
    placeholderData: keepPreviousData,
  });
  const statements = data?.items ?? [];
  const total = data?.total ?? 0;

  const { data: detail } = useQuery({
    queryKey: estateKeys.statement(estateId, detailId ?? ''),
    queryFn: () => unwrap(estateService.getStatement(estateId, detailId as string)),
    enabled: !!detailId,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: estateKeys.statements(estateId) });

  const generateStatement = useMutation({
    mutationFn: (input: { periodStart: string; periodEnd: string }) =>
      unwrap(estateService.generateStatement(estateId, input)),
    onSuccess: () => {
      invalidate();
      setForm(initialForm);
      setIsGenerateOpen(false);
      toast.success('Statement generated as a draft.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Unable to generate this statement.');
    },
  });

  const issueStatement = useMutation({
    mutationFn: (id: string) => unwrap(estateService.issueStatement(estateId, id)),
    onSuccess: (result, id) => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: estateKeys.statement(estateId, id) });
      if (result.payoutStatus === 'AWAITING_APPROVAL') {
        toast.success(
          'Statement issued. The payout is held while a second GetRentos officer approves it. The estate\u2019s money is unaffected.'
        );
      } else if (result.payoutStatus === 'FAILED') {
        toast.error('Statement issued, but the payout failed: retry it below.');
      } else {
        toast.success('Statement issued.');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Unable to issue this statement.');
    },
  });

  const retryPayout = useMutation({
    mutationFn: (id: string) => unwrap(estateService.retryStatementPayout(estateId, id)),
    onSuccess: (result, id) => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: estateKeys.statement(estateId, id) });
      if (result.payoutStatus === 'PAID') {
        toast.success('Payout succeeded.');
      } else if (result.payoutStatus === 'AWAITING_APPROVAL') {
        toast.success(
          'Held for a second approval. Nothing has been sent yet, and nothing will be until it is checked.'
        );
      } else {
        toast.error('The payout failed again. Check the payout account and try again.');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Unable to retry this payout.');
    },
  });

  /**
   * The organisation's owner querying a figure on this statement.
   *
   * The toast says the figure is not going to change, because an owner who
   * expects an edit will sit refreshing a number that is deliberately immutable.
   */
  const raiseDispute = useMutation({
    mutationFn: ({ lineId, reason }: { lineId: string; reason: string }) =>
      unwrap(estateService.disputeStatementLine(estateId, detailId ?? '', lineId, reason)),
    onSuccess: (dispute) => {
      void queryClient.invalidateQueries({
        queryKey: estateKeys.statement(estateId, dispute.statementId),
      });
      invalidate();
      toast.success(
        dispute.moneyEffect === 'HELD'
          ? 'Query raised, and the payout is paused until it is decided. If it is upheld the correction appears on your next statement.'
          : 'Query raised. This payout has already gone, so if it is upheld the correction appears on your next statement.'
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Unable to raise that query.');
    },
  });

  const withdrawDispute = useMutation({
    mutationFn: (disputeId: string) =>
      unwrap(estateService.withdrawStatementLineDispute(estateId, detailId ?? '', disputeId)),
    onSuccess: (dispute) => {
      void queryClient.invalidateQueries({
        queryKey: estateKeys.statement(estateId, dispute.statementId),
      });
      invalidate();
      toast.success('Query withdrawn.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Unable to withdraw that query.');
    },
  });

  const isValid = form.periodStart && form.periodEnd;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) return;
    generateStatement.mutate(form);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Dues Statements</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Generate a per-period statement from real collected dues, and pay it out to the
            estate&apos;s account
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsGenerateOpen(true)}
        >
          Generate statement
        </Button>
      </div>

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : statements.length === 0 ? (
        <EmptyState
          icon={FileBarChart}
          title="No statements yet"
          description="Generate your first statement to see a real dues-collected breakdown for a period."
        />
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {statements.map((statement: EstateStatement) => (
            <button
              key={statement.id}
              type="button"
              onClick={() => setDetailId(statement.id)}
              className="w-full flex flex-wrap items-center justify-between gap-4 p-4 text-left hover:bg-secondary/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {formatDate(statement.periodStart)}: {formatDate(statement.periodEnd)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Generated {formatDate(statement.generatedAt)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(statement.netPayout)}
                </span>
                <Badge variant={statement.status === 'ISSUED' ? 'success' : 'neutral'}>
                  {statement.status === 'ISSUED' ? 'Issued' : 'Draft'}
                </Badge>
                {statement.status === 'ISSUED' && (
                  <Badge variant={PAYOUT_BADGE[statement.payoutStatus].variant}>
                    {PAYOUT_BADGE[statement.payoutStatus].label}
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}

      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent size="md">
          <form onSubmit={submit}>
            <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
              Generate statement
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Computed from real PAID dues collected in the period.
            </DialogDescription>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Period start" required>
                <DatePicker
                  value={form.periodStart}
                  onChange={(value) => setForm((current) => ({ ...current, periodStart: value }))}
                />
              </Field>
              <Field label="Period end" required>
                <DatePicker
                  value={form.periodEnd}
                  onChange={(value) => setForm((current) => ({ ...current, periodEnd: value }))}
                />
              </Field>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-border pt-5">
              <Button
                type="button"
                variant="outline"
                rounded="md"
                onClick={() => setIsGenerateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                rounded="md"
                isLoading={generateStatement.isPending}
                disabled={!isValid}
              >
                Generate
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailId} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent size="lg">
          {!detail ? (
            <>
              <DialogTitle className="sr-only">Statement</DialogTitle>
              <CardSkeleton lines={5} />
            </>
          ) : (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 pr-8">
                <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
                  {formatDate(detail.periodStart)}: {formatDate(detail.periodEnd)}
                </DialogTitle>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={detail.status === 'ISSUED' ? 'success' : 'neutral'}>
                    {detail.status === 'ISSUED' ? 'Issued' : 'Draft'}
                  </Badge>
                  {detail.status === 'ISSUED' && (
                    <Badge variant={PAYOUT_BADGE[detail.payoutStatus].variant}>
                      {PAYOUT_BADGE[detail.payoutStatus].label}
                    </Badge>
                  )}
                </div>
              </div>

              <StatementBreakdown className="mt-5" lineItems={detail.lineItems} totals={detail} />

              <PayoutHeldNotice
                payoutStatus={detail.payoutStatus}
                release={detail.release}
                disputeSummary={detail.disputeSummary}
              />

              <StatementDisputeSection
                lineItems={detail.lineItems}
                disputes={detail.disputes}
                // A draft can be regenerated, so querying one would convene a
                // decision about a document that does not have to exist.
                canRaise={detail.status === 'ISSUED'}
                isRaising={raiseDispute.isPending}
                isWithdrawing={withdrawDispute.isPending}
                onRaise={async (lineId, reason) => {
                  try {
                    await raiseDispute.mutateAsync({ lineId, reason });
                    return true;
                  } catch {
                    return false;
                  }
                }}
                onWithdraw={(disputeId) => withdrawDispute.mutate(disputeId)}
              />

              {detail.status === 'DRAFT' && (
                <div className="mt-6 flex justify-end border-t border-border pt-5">
                  <Button
                    rounded="md"
                    icon={<Send className="w-4 h-4" />}
                    isLoading={issueStatement.isPending}
                    onClick={() => issueStatement.mutate(detail.id)}
                  >
                    Issue statement
                  </Button>
                </div>
              )}

              {detail.status === 'ISSUED' &&
                (detail.payoutStatus === 'FAILED' || detail.payoutStatus === 'REJECTED') && (
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                    <p className="text-xs text-muted-foreground">
                      {detail.payoutStatus === 'REJECTED'
                        ? 'Held back by a second reviewer. Sending it again puts it back in front of them.'
                        : 'The transfer to the estate\u2019s payout account didn\u2019t go through.'}
                    </p>
                    <Button
                      variant="outline"
                      rounded="md"
                      icon={<RotateCcw className="w-4 h-4" />}
                      isLoading={retryPayout.isPending}
                      onClick={() => retryPayout.mutate(detail.id)}
                    >
                      {detail.payoutStatus === 'REJECTED'
                        ? 'Send for approval again'
                        : 'Retry payout'}
                    </Button>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Where estate dues are paid out to once a statement is issued. */
export function EstatePayoutAccountCard({ estateId }: { estateId: string }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [businessType, setBusinessType] = useState<AgencyBusinessType | ''>('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: account } = useQuery({
    queryKey: estateKeys.payoutAccount(estateId),
    queryFn: () => unwrap(estateService.getPayoutAccount(estateId)),
  });

  const canSave = bankCode.trim().length >= 3 && accountNumber.trim().length === 10;

  const save = useMutation({
    mutationFn: () =>
      unwrap(
        estateService.updatePayoutAccount(estateId, {
          bankCode,
          accountNumber,
          registrationNumber: registrationNumber.trim() || undefined,
          businessType: businessType || undefined,
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: estateKeys.payoutAccount(estateId) });
      setBankCode('');
      setAccountNumber('');
      setRegistrationNumber('');
      setBusinessType('');
      setSubmitError(null);
      toast.success('Payout account saved.');
    },
    onError: (error: Error) => {
      setSubmitError(error.message || "Unable to update the estate's payout account.");
    },
  });

  return (
    <Card className="p-6 mb-6">
      <h3 className="text-base font-semibold text-foreground mb-1">Payout Account</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Where estate dues are sent when you issue a statement.
      </p>

      {account?.accountNumber && (
        <div className="rounded-lg border border-border p-3 mb-4">
          <p className="text-sm font-medium text-foreground">
            {account.bankName} · {account.accountNumber} · {account.accountName}
          </p>
          {account.verified ? (
            <Badge variant="success" className="mt-2">
              Bank account verified and active for payouts
            </Badge>
          ) : (
            <p className="text-xs text-muted-foreground mt-2">
              Not yet verified: save it again to resolve it against the bank.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Bank Code">
          <NumberInput
            leadingIcon={<Landmark className="w-4 h-4" />}
            value={bankCode}
            onValueChange={setBankCode}
            placeholder="e.g. 058 for GTBank"
            maxLength={6}
          />
        </Field>
        <Field label="Account Number">
          <NumberInput
            value={accountNumber}
            onValueChange={setAccountNumber}
            placeholder="0123456789"
            maxLength={10}
          />
        </Field>
        <Field
          label="CAC number"
          optionalLabel="(optional)"
          hint="Lets us verify the account belongs to the registered estate."
        >
          <Input
            type="text"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            placeholder="e.g. RC1234567"
          />
        </Field>
        {registrationNumber.trim() && (
          <Field label="Registration type">
            <Select
              value={businessType}
              onValueChange={(value) => setBusinessType(value as AgencyBusinessType | '')}
              placeholder="Select a type…"
              options={(Object.keys(BUSINESS_TYPE_LABELS) as AgencyBusinessType[]).map((t) => ({
                value: t,
                label: BUSINESS_TYPE_LABELS[t],
              }))}
            />
          </Field>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {submitError && <Alert variant="danger">{submitError}</Alert>}
        <Button
          variant="primary"
          disabled={!canSave}
          isLoading={save.isPending}
          loadingText="Saving…"
          onClick={() => save.mutate()}
        >
          Update Payout Account
        </Button>
      </div>
    </Card>
  );
}
