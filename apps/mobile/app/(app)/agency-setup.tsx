import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import type { VerifiedAddress } from '@getrentos/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileText, Send } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  DetailSkeleton,
  FormAlert,
  QueryState,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  agencyFirmApi,
  BUSINESS_TYPES,
  setupEditable,
  setupProblem,
  setupToForm,
  type Onboarding,
  type SetupForm,
} from '@/lib/api/agencyFirm';
import { formatDay } from '@/lib/api/agency';
import { ApiError, errorMessage } from '@/lib/api/client';
import { pickDocument } from '@/lib/filePicker';
import { useAuth } from '@/lib/auth/AuthProvider';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { AddressInput } from '@/components/forms/AddressInput';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

/** The firm's details and its CAC verification (KYB), or starting a firm. */
export default function AgencySetup() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const q = useQuery({
    queryKey: qk.agency.onboarding,
    queryFn: async () => {
      try {
        return await agencyFirmApi.onboarding();
      } catch (e) {
        // No firm yet: this is where one is started.
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }
    },
  });
  const firm = q.data ?? null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Agency"
        title={firm ? firm.name : 'Start your property management firm'}
        subtitle={
          firm ? 'Firm details and verification' : 'GetRentos verifies your CAC registration'
        }
        onBack={() => goBack()}
      />
      <QueryState query={q} skeleton={<DetailSkeleton />} style={{ paddingHorizontal: spacing.xl }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
            gap: spacing.lg,
          }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={q.isRefetching}
              onRefresh={() => q.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
        >
          {firm ? <Status firm={firm} /> : null}
          {!firm ? (
            <Card style={{ gap: spacing.sm }}>
              <Text variant="callout" color="mutedForeground">
                Invited to join a firm instead? Open the link from your invitation email, or paste
                it here.
              </Text>
              <Button
                label="Join a firm"
                size="sm"
                variant="secondary"
                onPress={() => router.push('/(app)/agency-join')}
                style={{ alignSelf: 'flex-start' }}
              />
            </Card>
          ) : null}
          <Details key={firm?.organizationId ?? 'new'} firm={firm} />
          {firm && setupEditable(firm) ? <Verification firm={firm} /> : null}
        </ScrollView>
      </QueryState>
    </View>
  );
}

function Status({ firm }: { firm: Onboarding }) {
  const { spacing } = useTheme();
  const kyb = firm.profile.kybStatus;
  const [label, tone, text] =
    firm.status === 'SUSPENDED'
      ? ['Suspended', 'danger', 'Your firm is suspended. Contact GetRentos support.']
      : firm.status === 'ACTIVE'
        ? ['Verified', 'success', 'Your firm is verified and active.']
        : kyb === 'SUBMITTED'
          ? [
              'In review',
              'info',
              `Sent for verification${firm.profile.kybSubmittedAt ? ` on ${formatDay(firm.profile.kybSubmittedAt)}` : ''}. We’ll tell you when it’s decided.`,
            ]
          : kyb === 'REJECTED'
            ? [
                'Not verified',
                'danger',
                `GetRentos said: ${firm.profile.kybDecisionNote ?? 'the details did not match.'} Fix them and submit again.`,
              ]
            : [
                'Not submitted',
                'warning',
                'Fill in your details, upload the CAC certificate and submit. Until then you can set up, but not receive payouts.',
              ];
  return (
    <Card style={{ gap: spacing.sm }}>
      <Badge label={label as string} tone={tone as 'success'} />
      <Text variant="callout" color="mutedForeground">
        {text}
      </Text>
    </Card>
  );
}

function Details({ firm }: { firm: Onboarding | null }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const { refreshProfile, switchWorkspace } = useAuth();
  const [f, setF] = useState<SetupForm>(() => setupToForm(firm));
  // The checked details of an address picked in this visit, for the field's LGA and state line.
  const [picked, setPicked] = useState<VerifiedAddress | undefined>();
  const editable = setupEditable(firm);
  const set = (k: keyof SetupForm) => (v: string) => setF((x) => ({ ...x, [k]: v }));
  const problem = setupProblem(f);
  const save = useMutation({
    mutationFn: () => (firm ? agencyFirmApi.updateFirm(f) : agencyFirmApi.createFirm(f)),
    onSuccess: async (updated) => {
      qc.setQueryData(qk.agency.onboarding, updated);
      toast.show(
        firm ? 'Details saved.' : 'Your firm is set up. Next, upload the CAC certificate.',
        'success'
      );
      if (!firm) {
        // Starting a firm makes this account a property manager.
        await refreshProfile();
        switchWorkspace('manager');
      }
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not save the firm’s details.'), 'error'),
  });

  return (
    <Card style={{ gap: spacing.lg }}>
      <Text variant="heading">Firm details</Text>
      <TextField
        label="Trading name"
        value={f.name}
        onChangeText={set('name')}
        editable={editable}
        required
      />
      <TextField
        label="Registered name"
        hint="As on the CAC certificate."
        value={f.registeredName}
        onChangeText={set('registeredName')}
        editable={editable}
        required
      />
      <ChipSelect
        label="Business type"
        options={BUSINESS_TYPES}
        value={f.businessType}
        onChange={set('businessType')}
        disabled={!editable}
      />
      <TextField
        label="CAC number"
        placeholder="RC 1234567"
        value={f.registrationNumber}
        onChangeText={set('registrationNumber')}
        autoCapitalize="characters"
        editable={editable}
        required
      />
      <AddressInput
        label="Registered address"
        value={
          f.registeredAddress
            ? { text: f.registeredAddress, placeId: f.registeredPlaceId, verified: picked }
            : null
        }
        onChange={(next) => {
          setPicked(next?.verified);
          setF((x) => ({
            ...x,
            registeredAddress: next?.text ?? '',
            // Typing over a checked address clears the check.
            registeredPlaceId: next?.placeId,
            ...(next?.verified ? { state: next.verified.state } : {}),
          }));
        }}
        allowManual
        editable={editable}
        required
      />
      <TextField label="State" value={f.state} onChangeText={set('state')} editable={editable} />
      <TextField
        label="Business email"
        value={f.contactEmail}
        onChangeText={set('contactEmail')}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={editable}
        required
      />
      <TextField
        label="Business phone"
        value={f.contactPhone}
        onChangeText={set('contactPhone')}
        keyboardType="phone-pad"
        editable={editable}
        required
      />
      {editable ? (
        <>
          {problem && f.name ? (
            <Text variant="caption" color="mutedForeground">
              {problem}
            </Text>
          ) : null}
          <Button
            label={firm ? 'Save details' : 'Create my firm'}
            loading={save.isPending}
            disabled={!!problem || save.isPending}
            onPress={() => save.mutate()}
          />
        </>
      ) : (
        <Text variant="caption" color="mutedForeground">
          {firm?.isOwner
            ? 'Your details are with GetRentos for verification, so they can’t be changed now.'
            : 'Only the firm’s principal can change these details.'}
        </Text>
      )}
    </Card>
  );
}

function Verification({ firm }: { firm: Onboarding }) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const upload = useMutation({
    mutationFn: async () => {
      const file = await pickDocument();
      return file ? agencyFirmApi.uploadCertificate(file) : null;
    },
    onSuccess: (updated) => {
      if (!updated) return;
      qc.invalidateQueries({ queryKey: qk.agency.onboarding });
      toast.show('Certificate uploaded.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not upload the certificate.'), 'error'),
  });
  const submit = useMutation({
    mutationFn: agencyFirmApi.submitFirm,
    onSuccess: (updated) => {
      qc.setQueryData(qk.agency.onboarding, updated);
      toast.show('Sent to GetRentos for verification.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not submit for verification.'), 'error'),
  });
  const certificate = firm.profile.certificateFileName;
  return (
    <Card style={{ gap: spacing.md }}>
      <Text variant="heading">Verification</Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
        <FileText size={16} color={colors.mutedForeground} />
        <Text variant="callout" style={{ flex: 1 }} numberOfLines={1}>
          {certificate ?? 'CAC certificate not uploaded'}
        </Text>
      </View>
      <Button
        label={certificate ? 'Replace certificate' : 'Upload certificate'}
        size="sm"
        variant="secondary"
        loading={upload.isPending}
        onPress={() => upload.mutate()}
        style={{ alignSelf: 'flex-start' }}
      />
      {!certificate ? (
        <FormAlert
          tone="info"
          message="Upload the CAC certificate (PDF or a photo) before submitting."
        />
      ) : null}
      <Button
        label="Submit for verification"
        icon={<Send size={16} color={colors.primaryForeground} />}
        loading={submit.isPending}
        disabled={!certificate || submit.isPending}
        onPress={() => submit.mutate()}
      />
      <Text variant="caption" color="mutedForeground">
        Save any changes to your details before submitting.
      </Text>
    </Card>
  );
}
