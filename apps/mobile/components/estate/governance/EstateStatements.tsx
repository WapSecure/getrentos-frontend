import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, ChevronRight, Info, Landmark, RotateCcw, Send } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Chip,
  DateField,
  Divider,
  ErrorState,
  FormAlert,
  Price,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { errorText } from '@/components/estate/EstateUI';
import { StatusPill } from '@/components/host/HostUI';
import {
  canRetryPayout,
  estateGovernanceApi,
  governanceKeys,
  lastMonthPeriod,
  payoutAccountValid,
  payoutHold,
  payoutOutcome,
  statementBadge,
  statementLadder,
  type EstatePayoutAccount,
  type EstateStatement,
} from '@/lib/api/estateGovernance';
import { COMMON_BANKS } from '@/lib/api/sellerPayout';
import { formatDate, formatNaira } from '@/lib/format';
import { haptics } from '@/lib/haptics';

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
            ? `Payout account: ${account!.bankName}, ${account!.accountNumber}, ${account!.accountName}. ${account!.verified ? 'Verified' : 'Not verified yet'}. Change`
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
                    {account!.accountNumber} · {account!.accountName}
                  </Text>
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
  const [other, setOther] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');

  const save = useMutation({
    mutationFn: () =>
      estateGovernanceApi.updatePayoutAccount(estateId, {
        bankCode: bankCode.trim(),
        accountNumber: accountNumber.trim(),
      }),
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
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {COMMON_BANKS.map((b) => (
          <Chip
            key={b.code}
            label={b.name}
            size="sm"
            selected={!other && bankCode === b.code}
            onPress={() => {
              setOther(false);
              setBankCode(b.code);
            }}
          />
        ))}
        <Chip
          label="Other bank"
          size="sm"
          selected={other}
          onPress={() => {
            setOther(true);
            setBankCode('');
          }}
        />
      </View>
      {other ? (
        <TextField
          label="Bank code"
          value={bankCode}
          onChangeText={(v) => setBankCode(v.replace(/\D/g, ''))}
          keyboardType="number-pad"
          maxLength={6}
          hint="Your bank’s code, e.g. 058 for GTBank"
        />
      ) : null}
      <TextField
        label="Account number"
        value={accountNumber}
        onChangeText={(v) => setAccountNumber(v.replace(/\D/g, ''))}
        keyboardType="number-pad"
        maxLength={10}
        hint="We check the name on the account with the bank"
      />
      <Text variant="caption" color="mutedForeground">
        You’ll be asked to confirm it’s you: this decides where the estate’s money goes.
      </Text>
      {save.error ? (
        <FormAlert message={errorText(save.error, 'We couldn’t check that account. Try again.')} />
      ) : null}
      <Button
        label={account?.accountNumber ? 'Update payout account' : 'Save payout account'}
        disabled={!payoutAccountValid(bankCode, accountNumber)}
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
        <FormAlert message={errorText(generate.error, 'Could not generate that statement.')} />
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
  const { colors, spacing, radius } = useTheme();
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
    onError: (e) => toast.show(errorText(e, 'Could not issue this statement.'), 'error'),
  });
  const retry = useMutation({
    mutationFn: () => estateGovernanceApi.retryPayout(estateId, statementId),
    onSuccess: (r) => settle(r, 'retry'),
    onError: (e) => toast.show(errorText(e, 'Could not retry this payout.'), 'error'),
  });

  if (query.isError && !query.data) return <ErrorState onRetry={() => query.refetch()} />;
  if (query.isPending) return <Skeleton height={260} radius={radius.lg} />;

  const s = query.data;
  const badge = statementBadge(s);
  const hold = payoutHold(s);
  const wht = s.whtAmount ?? 0;
  const where = account?.accountNumber
    ? `${account.bankName} · ${account.accountNumber}`
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
          <Text variant="bodyStrong" accessibilityRole="header">
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
          loading={issue.isPending}
          onPress={() =>
            Alert.alert(
              'Issue this statement?',
              s.netPayout > 0
                ? `It can’t be changed once issued, and ${formatNaira(s.netPayout)} is paid out to ${where}.`
                : 'It can’t be changed once issued. There’s nothing to pay out for this period.',
              [
                { text: 'Not yet', style: 'cancel' },
                { text: 'Issue', onPress: () => issue.mutate() },
              ]
            )
          }
        />
      ) : canRetryPayout(s) ? (
        <Button
          label={s.payoutStatus === 'REJECTED' ? 'Send for approval again' : 'Retry payout'}
          variant="secondary"
          icon={<RotateCcw size={16} color={colors.foreground} />}
          loading={retry.isPending}
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
                  onPress: () => retry.mutate(),
                },
              ]
            )
          }
        />
      ) : null}
    </View>
  );
}
