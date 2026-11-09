import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, Clock, Send, ShieldCheck, UserPlus } from '@sureground/icons/native';
import {
  describeCapacityRule,
  LAND_AUTHORITY_INSTRUMENT_LABELS,
  LAND_AUTHORITY_STATUS_LABELS,
  LAND_CONSENT_LABELS,
  LAND_SELLER_CAPACITIES,
  LAND_SELLER_CAPACITY_LABELS,
  LAND_SIGNATORY_ROLE_LABELS,
  landAuthorityTone,
  signatoryRolesFor,
  type LandAuthorityInstrument,
  type LandAuthoritySignatory,
  type LandAuthorityView,
  type LandCapacityRule,
  type LandSellerCapacity,
  type LandSignatoryRole,
} from '@sureground/shared';
import {
  Badge,
  Button,
  Card,
  DateField,
  DetailSkeleton,
  FormAlert,
  QueryState,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { declareBlocker, isClaim, isEditable, landAuthorityApi } from '@/lib/api/landAuthority';
import { errorMessage } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { LandDocumentChooser } from '@/components/land/LandDocumentChooser';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

type Saved = (view: LandAuthorityView, message: string) => void;

export default function OwnerLandAuthority() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const key = qk.owner.landAuthority(propertyId);
  const query = useQuery({
    queryKey: key,
    queryFn: () => landAuthorityApi.get(propertyId),
    enabled: !!propertyId,
  });

  const saved: Saved = (view, message) => {
    qc.setQueryData(key, view);
    qc.invalidateQueries({ queryKey: qk.owner.land });
    toast.show(message, 'success');
  };
  const view = query.data;
  const claim = isClaim(view) ? view : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Land"
        title="Authority to sell"
        subtitle={claim ? claim.authority.property.title : 'Show you can sell this land'}
        onBack={() => goBack()}
      />
      <QueryState
        query={query}
        skeleton={
          <View style={{ paddingHorizontal: spacing.xl }}>
            <DetailSkeleton />
          </View>
        }
        errorTitle="We could not load your authority to sell"
      >
        {view ? (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: spacing.xl,
              paddingBottom: insets.bottom + spacing['3xl'],
              gap: spacing.lg,
            }}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={query.isRefetching}
                onRefresh={() => void query.refetch()}
                tintColor={colors.mutedForeground}
              />
            }
          >
            <Status view={claim} />
            <Declaration
              key={claim ? `${claim.authority.id}:${claim.authority.status}` : 'new'}
              propertyId={propertyId}
              view={claim}
              rules={view.rules}
              onSaved={saved}
            />
            {claim ? <Signatories propertyId={propertyId} view={claim} onSaved={saved} /> : null}
            {claim ? (
              <Actions
                propertyId={propertyId}
                view={claim}
                onSaved={saved}
                onWithdrawn={() => {
                  qc.invalidateQueries({ queryKey: key });
                  qc.invalidateQueries({ queryKey: qk.owner.land });
                  toast.show('Claim withdrawn.', 'success');
                }}
              />
            ) : null}
          </ScrollView>
        ) : null}
      </QueryState>
    </View>
  );
}

function Status({ view }: { view: LandAuthorityView | null }) {
  const { colors, spacing } = useTheme();
  if (!view) {
    return (
      <Card style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <ShieldCheck size={18} color={colors.primary} />
          <Text variant="bodyStrong">Show you can sell this land</Text>
        </View>
        <Text variant="callout" color="mutedForeground">
          Buyers need to know the person selling has the right to. Tell us how you hold or represent
          this land and what that rests on. Sureground checks it before the land can be approved for
          sale.
        </Text>
      </Card>
    );
  }
  const { authority: a, gaps } = view;
  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">Authority to sell</Text>
          <Text variant="callout" color="mutedForeground">
            {a.capacityLabel}
          </Text>
        </View>
        <Badge label={LAND_AUTHORITY_STATUS_LABELS[a.status]} tone={landAuthorityTone(a.status)} />
      </View>
      {a.status === 'DISPUTED' ? (
        <FormAlert
          tone="error"
          message="Someone has objected to this sale. It is paused, and you cannot change the claim, until Sureground resolves the objection."
        />
      ) : null}
      {a.decision?.note ? (
        <Text variant="callout" color="mutedForeground">
          {a.status === 'REJECTED' ? 'Why it was not accepted' : 'Reviewer note'}: {a.decision.note}
        </Text>
      ) : null}
      {gaps.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <Text variant="callout" style={{ fontWeight: '600' }}>
            Still needed
          </Text>
          {gaps.map((g) => (
            <View key={g} style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Clock size={15} color={colors.mutedForeground} style={{ marginTop: 2 }} />
              <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
                {g}
              </Text>
            </View>
          ))}
        </View>
      ) : a.status !== 'VERIFIED' ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <CheckCircle2 size={15} color={colors.success} />
          <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
            Everything the claim needs is in.
            {a.status === 'DRAFT' ? ' Send it for review below.' : ''}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

function Declaration({
  propertyId,
  view,
  rules,
  onSaved,
}: {
  propertyId: string;
  view: LandAuthorityView | null;
  rules: Record<LandSellerCapacity, LandCapacityRule>;
  onSaved: Saved;
}) {
  const { spacing } = useTheme();
  const toast = useToast();
  const claim = view?.authority ?? null;
  // A rejected claim stays on record; saving starts a new one.
  const startsFresh = !claim || claim.status === 'REJECTED';
  const locked = claim?.status === 'DISPUTED';
  const [capacity, setCapacity] = useState<LandSellerCapacity | ''>(claim?.capacity ?? '');
  const [principalName, setPrincipalName] = useState(claim?.principalName ?? '');
  const [instrumentType, setInstrumentType] = useState<LandAuthorityInstrument | ''>(
    claim?.instrumentType ?? ''
  );
  const [instrumentDocumentId, setInstrumentDocumentId] = useState(
    claim?.instrumentDocumentId ?? ''
  );
  const [expiresAt, setExpiresAt] = useState(claim?.expiresAt?.slice(0, 10) ?? '');
  const rule = capacity ? rules[capacity] : null;
  const blocker = declareBlocker({
    capacity,
    principalRequired: !!rule?.principalRequired,
    principalName,
  });

  const save = useMutation({
    mutationFn: () =>
      landAuthorityApi.declare(propertyId, {
        capacity: capacity as LandSellerCapacity,
        ...(principalName.trim() ? { principalName: principalName.trim() } : {}),
        ...(instrumentType ? { instrumentType } : {}),
        ...(instrumentDocumentId ? { instrumentDocumentId } : {}),
        ...(expiresAt ? { expiresAt } : {}),
      }),
    onSuccess: (updated) =>
      onSaved(
        updated,
        claim?.status === 'VERIFIED'
          ? 'Saved. A change to a verified claim goes back to review.'
          : 'Saved.'
      ),
    onError: (e) => toast.show(errorMessage(e, 'Could not save your authority.'), 'error'),
  });

  return (
    <Card style={{ gap: spacing.lg }}>
      <Text variant="heading">How you can sell it</Text>
      <ChipSelect
        label="Your capacity"
        options={LAND_SELLER_CAPACITIES.map((c) => ({
          value: c,
          label: LAND_SELLER_CAPACITY_LABELS[c],
        }))}
        value={capacity || undefined}
        onChange={(c) => {
          setCapacity(c);
          setInstrumentType('');
        }}
        disabled={locked}
      />
      {rule ? (
        <Text variant="callout" color="mutedForeground">
          {describeCapacityRule(rule)}
        </Text>
      ) : null}
      {rule?.principalRequired ? (
        <TextField
          label="Whose authority you exercise"
          hint="The principal, the deceased, the company or the family, as named on the instrument."
          value={principalName}
          onChangeText={setPrincipalName}
          maxLength={200}
          editable={!locked}
          required
        />
      ) : null}
      {rule && rule.instruments.length > 0 ? (
        <>
          <ChipSelect
            label="The instrument"
            options={rule.instruments.map((i) => ({
              value: i,
              label: LAND_AUTHORITY_INSTRUMENT_LABELS[i],
            }))}
            value={instrumentType || undefined}
            onChange={setInstrumentType}
            disabled={locked}
          />
          <LandDocumentChooser
            propertyId={propertyId}
            label="The instrument document"
            value={instrumentDocumentId}
            onChange={setInstrumentDocumentId}
            uploadType={instrumentType || 'OTHER'}
            hint="Choose it from this land's documents, or upload it here."
            disabled={locked}
          />
          <DateField
            label="Valid until (optional)"
            value={expiresAt}
            onChange={setExpiresAt}
            hint="Leave empty if the instrument has no end date."
          />
        </>
      ) : null}
      <Button
        label={startsFresh ? (claim ? 'Start a new claim' : 'Save') : 'Save changes'}
        loading={save.isPending}
        disabled={!!blocker || locked || save.isPending}
        onPress={() => save.mutate()}
      />
    </Card>
  );
}

function Signatories({
  propertyId,
  view,
  onSaved,
}: {
  propertyId: string;
  view: LandAuthorityView;
  onSaved: Saved;
}) {
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const { authority: a, requirements } = view;
  const editable = isEditable(a.status);
  const roles = signatoryRolesFor(requirements);
  const [role, setRole] = useState<LandSignatoryRole | undefined>(roles[0]);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const add = useMutation({
    mutationFn: () =>
      landAuthorityApi.addSignatory(propertyId, {
        role: role!,
        fullName: fullName.trim(),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        ...(email.trim() ? { email: email.trim() } : {}),
      }),
    onSuccess: (updated) => {
      const hadEmail = !!email.trim();
      setFullName('');
      setPhone('');
      setEmail('');
      onSaved(
        updated,
        hadEmail
          ? 'Added. If they have a Sureground account with that email, we have asked them to answer.'
          : 'Added.'
      );
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not add that person.'), 'error'),
  });

  if (requirements.consentRoles.length === 0 && a.signatories.length === 0) {
    return (
      <Card style={{ gap: spacing.sm }}>
        <Text variant="heading">Consents</Text>
        <Text variant="callout" color="mutedForeground">
          No one else needs to consent for this capacity.
        </Text>
      </Card>
    );
  }

  return (
    <Card style={{ gap: spacing.lg }}>
      <Text variant="heading">Who must consent</Text>
      <Text variant="callout" color="mutedForeground">
        People with a Sureground account answer from it. For anyone else, upload their signed
        consent
        {requirements.witnessRequired ? ' and name a witness' : ''}; Sureground checks it.
      </Text>
      {a.signatories.map((s) => (
        <SignatoryRow
          key={s.id}
          propertyId={propertyId}
          signatory={s}
          witnessRequired={requirements.witnessRequired}
          editable={editable}
          onSaved={onSaved}
        />
      ))}
      {editable ? (
        <View style={{ gap: spacing.md }}>
          <Text variant="bodyStrong">Add someone</Text>
          <ChipSelect
            label="Role"
            options={roles.map((r) => ({ value: r, label: LAND_SIGNATORY_ROLE_LABELS[r] }))}
            value={role}
            onChange={setRole}
          />
          <TextField
            label="Full name"
            value={fullName}
            onChangeText={setFullName}
            maxLength={200}
            required
          />
          <TextField
            label="Phone (optional)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={40}
          />
          <TextField
            label="Sureground email (optional)"
            hint="So they can answer from their own account."
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Button
            label="Add"
            size="sm"
            variant="secondary"
            icon={<UserPlus size={14} color={colors.foreground} />}
            loading={add.isPending}
            disabled={!role || fullName.trim().length < 2 || add.isPending}
            onPress={() => add.mutate()}
            style={{ alignSelf: 'flex-start' }}
          />
        </View>
      ) : null}
    </Card>
  );
}

const consentTone = (s: LandAuthoritySignatory) =>
  s.consent === 'OBJECTED'
    ? 'danger'
    : s.counts
      ? 'success'
      : s.consent === 'CONSENTED'
        ? 'info'
        : 'neutral';

function SignatoryRow({
  propertyId,
  signatory: s,
  witnessRequired,
  editable,
  onSaved,
}: {
  propertyId: string;
  signatory: LandAuthoritySignatory;
  witnessRequired: boolean;
  editable: boolean;
  onSaved: Saved;
}) {
  const { spacing } = useTheme();
  const toast = useToast();
  const [recording, setRecording] = useState(false);
  const [evidenceDocumentId, setEvidenceDocumentId] = useState('');
  const [witnessName, setWitnessName] = useState('');

  const record = useMutation({
    mutationFn: () =>
      landAuthorityApi.recordConsent(propertyId, s.id, {
        evidenceDocumentId,
        ...(witnessName.trim() ? { witnessName: witnessName.trim() } : {}),
      }),
    onSuccess: (updated) => {
      setRecording(false);
      onSaved(updated, 'Consent recorded. It counts once Sureground has checked it.');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not record that consent.'), 'error'),
  });
  const remove = useMutation({
    mutationFn: () => landAuthorityApi.removeSignatory(propertyId, s.id),
    onSuccess: (updated) => onSaved(updated, 'Removed.'),
    onError: (e) => toast.show(errorMessage(e, 'Could not remove that person.'), 'error'),
  });

  const status =
    s.consent === 'CONSENTED' && !s.counts
      ? 'Consent awaiting check'
      : LAND_CONSENT_LABELS[s.consent];
  const canRecord =
    editable && !s.answeredFromAccount && s.consent !== 'OBJECTED' && s.role !== 'THIRD_PARTY';
  const canRemove = editable && s.consent !== 'OBJECTED' && s.role !== 'THIRD_PARTY';
  const facts = [
    LAND_SIGNATORY_ROLE_LABELS[s.role],
    s.answeredFromAccount ? 'answered from their account' : null,
    s.witnessName ? `witness ${s.witnessName}` : null,
    s.respondedAt ? formatDate(s.respondedAt, 'short') : null,
  ].filter(Boolean);

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="callout" style={{ fontWeight: '600' }}>
            {s.fullName}
          </Text>
          <Text variant="caption" color="mutedForeground">
            {facts.join(' · ')}
          </Text>
          {s.objectionReason ? <Text variant="callout">“{s.objectionReason}”</Text> : null}
          {s.waivedReason ? (
            <Text variant="caption" color="mutedForeground">
              {s.waivedReason}
            </Text>
          ) : null}
        </View>
        <Badge label={status} tone={consentTone(s)} />
      </View>
      {recording ? (
        <View style={{ gap: spacing.md }}>
          <LandDocumentChooser
            propertyId={propertyId}
            label="Signed consent"
            value={evidenceDocumentId}
            onChange={setEvidenceDocumentId}
            uploadType="CONSENT_LETTER"
          />
          <TextField
            label={witnessRequired ? 'Witness' : 'Witness (optional)'}
            value={witnessName}
            onChangeText={setWitnessName}
            maxLength={200}
            required={witnessRequired}
          />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              label="Record consent"
              size="sm"
              loading={record.isPending}
              disabled={
                !evidenceDocumentId || (witnessRequired && !witnessName.trim()) || record.isPending
              }
              onPress={() => record.mutate()}
            />
            <Button label="Cancel" size="sm" variant="ghost" onPress={() => setRecording(false)} />
          </View>
        </View>
      ) : canRecord || canRemove ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {canRecord ? (
            <Button
              label={s.consent === 'CONSENTED' ? 'Replace signed consent' : 'Upload signed consent'}
              size="sm"
              variant="secondary"
              onPress={() => setRecording(true)}
            />
          ) : null}
          {canRemove ? (
            <Button
              label="Remove"
              size="sm"
              variant="ghost"
              loading={remove.isPending}
              onPress={() =>
                Alert.alert(`Remove ${s.fullName}?`, undefined, [
                  { text: 'Keep', style: 'cancel' },
                  { text: 'Remove', style: 'destructive', onPress: () => remove.mutate() },
                ])
              }
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function Actions({
  propertyId,
  view,
  onSaved,
  onWithdrawn,
}: {
  propertyId: string;
  view: LandAuthorityView;
  onSaved: Saved;
  onWithdrawn: () => void;
}) {
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const a = view.authority;
  const [appealNote, setAppealNote] = useState('');

  const submit = useMutation({
    mutationFn: () => landAuthorityApi.submit(propertyId),
    onSuccess: (updated) =>
      onSaved(updated, 'Sent for review. We will tell you when it is decided.'),
    onError: (e) => toast.show(errorMessage(e, 'Could not send it for review.'), 'error'),
  });
  const appeal = useMutation({
    mutationFn: () => landAuthorityApi.appeal(propertyId, appealNote.trim()),
    onSuccess: (updated) => {
      setAppealNote('');
      onSaved(updated, 'Appeal sent. A reviewer will look at the claim again.');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not send the appeal.'), 'error'),
  });
  const withdraw = useMutation({
    mutationFn: () => landAuthorityApi.withdraw(propertyId),
    onSuccess: onWithdrawn,
    onError: (e) => toast.show(errorMessage(e, 'Could not withdraw the claim.'), 'error'),
  });

  return (
    <Card style={{ gap: spacing.md }}>
      {a.status === 'DRAFT' ? (
        <>
          <Text variant="callout" color="mutedForeground">
            You can send the claim before every consent is in; the reviewer sees what is still
            missing.
          </Text>
          <Button
            label="Send for review"
            icon={<Send size={16} color={colors.primaryForeground} />}
            loading={submit.isPending}
            disabled={submit.isPending}
            onPress={() => submit.mutate()}
          />
        </>
      ) : a.status === 'PENDING_REVIEW' ? (
        <Text variant="callout" color="mutedForeground">
          Under review{a.submittedAt ? ` since ${formatDate(a.submittedAt)}` : ''}. You can still
          add consents while you wait.
        </Text>
      ) : a.status === 'VERIFIED' ? (
        <Text variant="callout" color="mutedForeground">
          Verified{a.decision ? ` on ${formatDate(a.decision.at)}` : ''}. Changing the claim sends
          it back to review.
        </Text>
      ) : a.status === 'REJECTED' ? (
        <>
          <Text variant="callout" color="mutedForeground">
            Appeal if the reviewer got it wrong, or change the claim above to start a new one.
          </Text>
          <TextField
            label="Why the claim should be accepted"
            value={appealNote}
            onChangeText={setAppealNote}
            multiline
            maxLength={2000}
          />
          <Button
            label="Appeal"
            size="sm"
            loading={appeal.isPending}
            disabled={appealNote.trim().length < 5 || appeal.isPending}
            onPress={() => appeal.mutate()}
            style={{ alignSelf: 'flex-start' }}
          />
        </>
      ) : null}
      {isEditable(a.status) ? (
        <Button
          label="Withdraw this claim"
          size="sm"
          variant="ghost"
          loading={withdraw.isPending}
          onPress={() =>
            Alert.alert(
              'Withdraw the claim?',
              'The land cannot be approved for sale without a verified claim.',
              [
                { text: 'Keep it', style: 'cancel' },
                { text: 'Withdraw', style: 'destructive', onPress: () => withdraw.mutate() },
              ]
            )
          }
          style={{ alignSelf: 'flex-start' }}
        />
      ) : null}
    </Card>
  );
}
