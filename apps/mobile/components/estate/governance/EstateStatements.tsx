import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, ChevronRight, Info, Landmark, RotateCcw, Send } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  DateField,
  Divider,
  FormAlert,
  Price,
  QueryState,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { StatusPill } from '@/components/host/HostUI';
import {
  canRetryPayout,
  estateGovernanceApi,
  governanceKeys,
  lastMonthPeriod,
  payoutHold,
  payoutOutcome,
  statementBadge,
  statementLadder,
  type EstatePayoutAccount,
  type EstateStatement,
} from '@/lib/api/estateGovernance';
import { BankAccountFields } from '@/components/forms/BankAccountFields';
import { PayoutCooldownHint, PayoutHoldNotice } from '@/components/payouts/PayoutHoldNotice';
import { withStepUpSummary } from '@/lib/stepUp';
import {
  INCOMPLETE_ACCOUNT_LOOKUP,
  lookupAllowsSave,
  maskAccountNumber,
  payoutAccountLabel,
  payoutAccountStepUpSummary,
  saveAccountLabel,
  type AccountLookup,
} from '@getrentos/shared';
import { formatDate, formatNaira } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { errorMessage } from '@/lib/api/client';

const period = (s: Pick<EstateStatement, 'periodStart' | 'periodEnd'>) =>
  `${formatDate(s.periodStart, 'medium')} – ${formatDate(s.periodEnd, 'medium')}`;

/* ----------------------------- payout account ----------------------------- */

/** Where estate dues are paid out to when a statement is issued. */
export function PayoutAccountCard({
  estateId,
  account,
  loading,
}: {
  estateId: string;
  account?: EstatePayoutAccount;
  loading: boolean;
}) {
  const { colors, spacing, radius } = useTheme();
  const [editing, setEditing] = useState(false);
  const has = !!account?.accountNumber;

  if (loading) return <Skeleton height={88} radius={radius.lg} />;
  return (
    <>
      <Pressable
        onPress={() => setEditing(true)}
        accessibilityRole="button"
        accessibilityLabel={
          has
            ? `Payout account: ${account!.bankName}, account ending ${maskAccountNumber(account!.accountNumber).replace(/\D/g, '')}, ${account!.accountName}. ${account!.verified ? 'Verified' : 'Not verified yet'}. Change`
            : 'No payout account yet. Add one'
        }
      >
        {({ pressed }) => (
          <Card
            elevated
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              opacity: pressed ? 0.92 : 1,
              ...(has ? {} : { borderWidth: 1, borderColor: colors.warning }),
            }}
          >
            <Landmark size={22} color={has ? colors.primary : colors.warning} />
            <View style={{ flex: 1, gap: 2 }}>
              {has ? (
                <>
                  <Text variant="bodyStrong">{account!.bankName}</Text>
                  <Text variant="caption" color="mutedForeground">
                    {maskAccountNumber(account!.accountNumber)} · {account!.accountName}
                  </Text>
                  <PayoutHoldNotice holdUntil={account!.payoutHoldUntil} />
                </>
              ) : (
                <>
                  <Text variant="bodyStrong">Add a payout account</Text>
                  <Text variant="caption" color="mutedForeground">
                    Where dues go when you issue a statement
                  </Text>
                </>
              )}
            </View>
            {has ? (
              account!.verified ? (
                <BadgeCheck size={20} color={colors.success} />
              ) : (
                <Badge label="Not verified" tone="warning" />
              )
            ) : null}
            <ChevronRight size={18} color={colors.mutedForeground} />
          </Card>
        )}
      </Pressable>
      <Sheet
        open={editing}
        onClose={() => setEditing(false)}
        title={has ? 'Change payout account' : 'Add a payout account'}
      >
        {editing ? (
          <PayoutAccountForm
            estateId={estateId}
            account={account}
            onDone={() => setEditing(false)}
          />
        ) : null}
      </Sheet>
    </>
  );
}

function PayoutAccountForm({
  estateId,
  account,
  onDone,
}: {
  estateId: string;
  account?: EstatePayoutAccount;
  onDone: () => void;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [lookup, setLookup] = useState<AccountLookup>(INCOMPLETE_ACCOUNT_LOOKUP);

  const save = useMutation({
    mutationFn: () =>
      withStepUpSummary(
        payoutAccountStepUpSummary({
          bankName: lookup.bankName,
          accountNumber,
          accountName: lookup.accountName,
          owner: 'the estate’s',
        }),
        () =>
          estateGovernanceApi.updatePayoutAccount(estateId, {
            bankCode: bankCode.trim(),
            accountNumber: accountNumber.trim(),
          })
      ),
    onSuccess: (saved) => {
      void haptics.success();
      qc.setQueryData(governanceKeys.payoutAccount(estateId), saved);
      toast.show(
        saved.verified
          ? `Dues now pay out to ${saved.accountName}.`
          : 'Saved. The bank hasn’t confirmed the account yet.',
        'success'
      );
      onDone();
    },
  });

  return (
    <View style={{ gap: spacing.md }}>
      {account?.accountNumber && !account.verified ? (
        <FormAlert
          tone="warning"
          message="The current account isn’t verified. Save it again to check it against the bank."
        />
      ) : null}
      <BankAccountFields
        bankCode={bankCode}
        onBankCode={setBankCode}
        accountNumber={accountNumber}
        onAccountNumber={setAccountNumber}
        onLookup={setLookup}
      />
      <Text variant="caption" color="mutedForeground">
        We check the name on the account with the bank. You’ll be asked to confirm it’s you: this
        decides where the estate’s money goes.
      </Text>
      {account?.accountNumber ? <PayoutCooldownHint /> : null}
      {save.error ? (
        <FormAlert
          message={errorMessage(save.error, 'We couldn’t check that account. Try again.')}
        />
      ) : null}
      <Button
        label={saveAccountLabel(
          lookup,
          account?.accountNumber ? 'Update payout account' : 'Save payout account'
        )}
        disabled={!lookupAllowsSave(lookup)}
        loading={save.isPending}
        onPress={() => save.mutate()}
      />
    </View>
  );
}

/* -------------------------------- statements ------------------------------ */

export function StatementRow({ s, onPress }: { s: EstateStatement; onPress: () => void }) {
  const { colors, spacing } = useTheme();
  const badge = statementBadge(s);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${period(s)}, ${Math.round(s.netPayout).toLocaleString('en-NG')} naira, ${badge.label}`}
    >
      {({ pressed }) => (
        <Card
          elevated
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            opacity: pressed ? 0.92 : 1,
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {period(s)}
            </Text>
            <Text variant="caption" color="mutedForeground">
              {s.issuedAt
                ? `Issued ${formatDate(s.issuedAt, 'medium')}`
                : `Generated ${formatDate(s.generatedAt, 'medium')}`}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Price amount={s.netPayout} variant="bodyStrong" />
            <StatusPill label={badge.label} tone={badge.tone} />
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Card>
      )}
    </Pressable>
  );
}

export function GenerateStatementSheet({
  open,
  onClose,
  estateId,
}: {
  open: boolean;
  onClose: () => void;
  estateId: string;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Generate a statement">
      {open ? <GenerateForm estateId={estateId} onDone={onClose} /> : null}
    </Sheet>
  );
}

function GenerateForm({ estateId, onDone }: { estateId: string; onDone: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [range, setRange] = useState(lastMonthPeriod);

  const generate = useMutation({
    mutationFn: () => estateGovernanceApi.generateStatement(estateId, range),
    onSuccess: () => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: governanceKeys.statements(estateId) });
      toast.show('Draft statement ready. Open it to check and issue.', 'success');
      onDone();
    },
  });

  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="callout" color="mutedForeground">
        Worked out from the dues actually paid in the period. It starts as a draft; nothing is paid
        out until you issue it.
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <DateField
            label="From"
            value={range.periodStart}
            onChange={(v) => setRange((r) => ({ ...r, periodStart: v }))}
          />
        </View>
        <View style={{ flex: 1 }}>
          <DateField
            label="To"
            value={range.periodEnd}
            min={range.periodStart}
            onChange={(v) => setRange((r) => ({ ...r, periodEnd: v }))}
          />
        </View>
      </View>
      {generate.error ? (
        <FormAlert message={errorMessage(generate.error, 'Could not generate that statement.')} />
      ) : null}
      <Button
        label="Generate draft"
        disabled={!range.periodStart || !range.periodEnd || range.periodEnd < range.periodStart}
        loading={generate.isPending}
        onPress={() => generate.mutate()}
      />
    </View>
  );
}

/** One statement in full, with the action its state allows: issue a draft, or retry a payout. */
export function StatementSheet({
  estateId,
  statementId,
  account,
  onClose,
}: {
  estateId: string;
  statementId: string | null;
  account?: EstatePayoutAccount;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!statementId} onClose={onClose} title="Statement">
      {statementId ? (
        <StatementDetail
          key={statementId}
          estateId={estateId}
          statementId={statementId}
          account={account}
        />
      ) : null}
    </Sheet>
  );
}

function StatementDetail({
  estateId,
  statementId,
  account,
}: {
  estateId: string;
  statementId: string;
  account?: EstatePayoutAccount;
}) {
  const { radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const query = useQuery({
    queryKey: governanceKeys.statement(estateId, statementId),
    queryFn: () => estateGovernanceApi.statement(estateId, statementId),
    enabled: !!estateId,
  });

  const settle = (result: EstateStatement, action: 'issue' | 'retry') => {
    const outcome = payoutOutcome(result.payoutStatus, action);
    if (outcome.ok) void haptics.success();
    qc.setQueryData(governanceKeys.statement(estateId, statementId), (prev?: EstateStatement) =>
      prev ? { ...prev, ...result } : result
    );
    qc.invalidateQueries({ queryKey: governanceKeys.statements(estateId) });
    toast.show(outcome.message, outcome.ok ? 'success' : 'error');
  };
  const issue = useMutation({
    mutationFn: () => estateGovernanceApi.issueStatement(estateId, statementId),
    onSuccess: (r) => settle(r, 'issue'),
    onError: (e) => toast.show(errorMessage(e, 'Could not issue this statement.'), 'error'),
  });
  const retry = useMutation({
    mutationFn: () => estateGovernanceApi.retryPayout(estateId, statementId),
    onSuccess: (r) => settle(r, 'retry'),
    onError: (e) => toast.show(errorMessage(e, 'Could not retry this payout.'), 'error'),
  });

  return (
    <QueryState query={query} skeleton={<Skeleton height={260} radius={radius.lg} />}>
      {query.data ? (
        <StatementBody
          s={query.data}
          account={account}
          issuing={issue.isPending}
          retrying={retry.isPending}
          onIssue={() => issue.mutate()}
          onRetry={() => retry.mutate()}
        />
      ) : null}
    </QueryState>
  );
}

function StatementBody({
  s,
  account,
  issuing,
  retrying,
  onIssue,
  onRetry,
}: {
  s: EstateStatement;
  account?: EstatePayoutAccount;
  issuing: boolean;
  retrying: boolean;
  onIssue: () => void;
  onRetry: () => void;
}) {
  const { colors, spacing } = useTheme();
  const badge = statementBadge(s);
  const hold = payoutHold(s);
  const wht = s.whtAmount ?? 0;
  const where = account?.accountNumber
    ? payoutAccountLabel(account)
    : 'the estate’s payout account';

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          {period(s)}
        </Text>
        <StatusPill label={badge.label} tone={badge.tone} />
      </View>

      {s.lineItems?.length ? (
        <View style={{ gap: 2 }}>
          {s.lineItems.map((l) => (
            <View
              key={l.id}
              accessible
              accessibilityLabel={`${l.label}, ${Math.round(l.amount).toLocaleString('en-NG')} naira`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 28 }}
            >
              <Text variant="caption" color="mutedForeground" style={{ flex: 1 }} numberOfLines={2}>
                {l.label}
              </Text>
              <Price
                amount={l.amount}
                variant="caption"
                color={l.amount < 0 ? 'destructive' : 'foreground'}
              />
            </View>
          ))}
        </View>
      ) : null}

      <Card padding={spacing.md} style={{ gap: spacing.xs, backgroundColor: colors.secondary }}>
        {statementLadder(s).map((row) => (
          <View
            key={row.label}
            accessible
            accessibilityLabel={`${row.label}${row.deduction ? ', less' : ''} ${Math.round(row.amount).toLocaleString('en-NG')} naira`}
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          >
            <Text variant="callout" color="mutedForeground">
              {row.label}
            </Text>
            <Text variant="callout">
              {row.deduction && row.amount !== 0 ? '−' : ''}
              {formatNaira(row.amount)}
            </Text>
          </View>
        ))}
        <Divider />
        <View
          accessible
          accessibilityLabel={`Net payout ${Math.round(s.netPayout).toLocaleString('en-NG')} naira`}
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Text variant="bodyStrong">Net payout</Text>
          <Price amount={s.netPayout} variant="bodyStrong" />
        </View>
        {wht > 0 ? (
          <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs }}>
            <Info size={14} color={colors.mutedForeground} style={{ marginTop: 2 }} />
            <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
              Withholding tax of {formatNaira(wht)} is withheld from the manager’s fee and paid to
              the tax authority. It isn’t taken from the payout.
            </Text>
          </View>
        ) : null}
      </Card>

      {s.paidAt ? (
        <Text variant="caption" color="mutedForeground">
          Paid {formatDate(s.paidAt, 'medium')}
          {s.transferRef ? ` · ref ${s.transferRef}` : ''}
        </Text>
      ) : null}

      {hold ? (
        <FormAlert
          tone={hold.tone === 'warning' ? 'warning' : 'info'}
          title={hold.title}
          message={hold.quote ? `${hold.body}\n\n“${hold.quote}”` : hold.body}
        />
      ) : null}

      {s.disputes?.length ? (
        <View style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong" headingLevel={2}>
            Queries on this statement
          </Text>
          {s.disputes.map((d) => (
            <Card key={d.id} padding={spacing.md} style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text variant="callout" style={{ flex: 1, fontWeight: '600' }} numberOfLines={1}>
                  {d.lineLabel}
                </Text>
                <Badge
                  label={
                    d.status === 'OPEN'
                      ? 'Being looked at'
                      : d.status === 'UPHELD'
                        ? 'Upheld'
                        : d.status === 'REJECTED'
                          ? 'Not upheld'
                          : 'Withdrawn'
                  }
                  tone={
                    d.status === 'OPEN' ? 'warning' : d.status === 'UPHELD' ? 'success' : 'neutral'
                  }
                />
              </View>
              <Text variant="caption" color="mutedForeground">
                “{d.reason}”{d.raisedByName ? ` · ${d.raisedByName}` : ''}
              </Text>
              {d.outcomeNote ? (
                <Text variant="caption" color="mutedForeground">
                  Decision: {d.outcomeNote}
                </Text>
              ) : null}
            </Card>
          ))}
          <Text variant="caption" color="mutedForeground">
            Queries are raised and answered on the GetRentos website.
          </Text>
        </View>
      ) : null}

      {s.status === 'DRAFT' ? (
        <Button
          label="Issue statement"
          icon={<Send size={16} color={colors.primaryForeground} />}
          loading={issuing}
          onPress={() =>
            Alert.alert(
              'Issue this statement?',
              s.netPayout > 0
                ? `It can’t be changed once issued, and ${formatNaira(s.netPayout)} is paid out to ${where}.`
                : 'It can’t be changed once issued. There’s nothing to pay out for this period.',
              [
                { text: 'Not yet', style: 'cancel' },
                { text: 'Issue', onPress: onIssue },
              ]
            )
          }
        />
      ) : canRetryPayout(s) ? (
        <Button
          label={s.payoutStatus === 'REJECTED' ? 'Send for approval again' : 'Retry payout'}
          variant="secondary"
          icon={<RotateCcw size={16} color={colors.foreground} />}
          loading={retrying}
          onPress={() =>
            Alert.alert(
              s.payoutStatus === 'REJECTED' ? 'Send it for approval again?' : 'Retry the payout?',
              s.payoutStatus === 'REJECTED'
                ? 'It goes back to the reviewer who held it. Only do this once their concern is dealt with.'
                : `${formatNaira(s.netPayout)} is sent to ${where}. Check the account is right first.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: s.payoutStatus === 'REJECTED' ? 'Send again' : 'Retry',
                  onPress: onRetry,
                },
              ]
            )
          }
        />
      ) : null}
    </View>
  );
}
