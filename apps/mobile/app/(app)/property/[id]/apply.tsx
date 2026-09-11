import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Briefcase,
  Check,
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  Eye,
  FileText,
  ShieldAlert,
  Upload,
  User,
  X,
} from 'lucide-react-native';
import { Button, Card, Chip, Progress, Text, TextField, useTheme } from '@getrentos/ui-native';
import { useAuth } from '@/lib/auth/AuthProvider';
import { qk } from '@/lib/query/keys';
import { propertiesApi } from '@/lib/api/properties';
import { documentsApi } from '@/lib/api/documents';
import { pickDocument } from '@/lib/filePicker';
import {
  applicationsApi,
  DEFAULT_APPLICATION_DOCUMENTS,
  type ApplicationDocument,
  type RenterApplication,
} from '@/lib/api/applications';
import { ApiError } from '@/lib/api/client';
import { track } from '@/lib/analytics';

interface FormState {
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
  nextOfKinName: string;
  nextOfKinPhone: string;
  nextOfKinRelationship: string;
  referenceName: string;
  referencePhone: string;
  referenceRelationship: string;
  documents: ApplicationDocument[];
}

const STEPS = [
  { key: 'personal', label: 'Personal', icon: User },
  { key: 'employment', label: 'Employment', icon: Briefcase },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'review', label: 'Review', icon: ClipboardCheck },
] as const;

const EMPLOYMENT_OPTIONS = ['Employed', 'Self-employed', 'Business owner', 'Student'];
const LEASE_TERM_OPTIONS = ['6 months', '12 months', '24 months'];

export default function ApplyToRent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const qc = useQueryClient();

  const propertyQuery = useQuery({
    queryKey: qk.listings.detail(id),
    queryFn: () => propertiesApi.getById(id),
    enabled: !!id,
  });
  const property = propertyQuery.data;

  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormState>({
    fullName: profile?.legalName ?? '',
    email: profile?.email ?? '',
    phone: profile?.phone ?? '',
    currentAddress: '',
    employer: '',
    employmentStatus: 'Employed',
    monthlyIncome: '',
    moveInDate: '',
    leaseTerm: '12 months',
    notes: '',
    nextOfKinName: '',
    nextOfKinPhone: '',
    nextOfKinRelationship: '',
    referenceName: '',
    referencePhone: '',
    referenceRelationship: '',
    documents: DEFAULT_APPLICATION_DOCUMENTS.map((d) => ({ ...d })),
  });
  const [submitted, setSubmitted] = useState<RenterApplication | null>(null);

  // Until the renter picks their own date, fall back to the listing's availability.
  const moveInDate = data.moveInDate || property?.availableFrom || '';

  useEffect(() => {
    track('application_started', { id });
  }, [id]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const setDocument = (name: string, patch: Partial<ApplicationDocument>) =>
    setData((d) => ({
      ...d,
      documents: d.documents.map((doc) => (doc.name === name ? { ...doc, ...patch } : doc)),
    }));

  const [docError, setDocError] = useState<string | null>(null);
  const uploadDocMutation = useMutation({
    mutationFn: async (doc: ApplicationDocument) => {
      const file = await pickDocument();
      if (!file) return null;
      const uploaded = await documentsApi.upload(file, doc.name, 'other', 'Rental application', [
        'application',
      ]);
      return { doc, uploaded };
    },
    onMutate: () => setDocError(null),
    onSuccess: (result) => {
      if (result)
        setDocument(result.doc.name, {
          uploaded: true,
          documentId: result.uploaded.id,
          url: result.uploaded.url,
        });
    },
    onError: (err) =>
      setDocError(
        err instanceof ApiError ? err.message : 'Could not upload the file. Please try again.'
      ),
  });

  const removeDocument = (name: string) =>
    setDocument(name, { uploaded: false, documentId: undefined, url: undefined });

  const submitMutation = useMutation({
    mutationFn: () =>
      applicationsApi.submit({
        listingId: id,
        fullName: data.fullName.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        currentAddress: data.currentAddress.trim() || undefined,
        employer: data.employer.trim() || undefined,
        employmentStatus: data.employmentStatus,
        monthlyIncome: Number(data.monthlyIncome.replace(/[^\d]/g, '')) || 0,
        moveInDate: moveInDate || undefined,
        leaseTerm: data.leaseTerm,
        notes: data.notes.trim() || undefined,
        nextOfKinName: data.nextOfKinName.trim() || undefined,
        nextOfKinPhone: data.nextOfKinPhone.trim() || undefined,
        nextOfKinRelationship: data.nextOfKinRelationship.trim() || undefined,
        references: data.referenceName.trim()
          ? [
              {
                name: data.referenceName.trim(),
                phone: data.referencePhone.trim(),
                relationship: data.referenceRelationship.trim(),
              },
            ]
          : undefined,
        documents: data.documents,
      }),
    onSuccess: (app) => {
      track('application_submitted', { id: app.id, listingId: id });
      qc.invalidateQueries({ queryKey: qk.renter.applications });
      qc.invalidateQueries({ queryKey: qk.renter.dashboardStats });
      setSubmitted(app);
    },
  });

  const canAdvance = useMemo(() => {
    if (step === 0) return !!(data.fullName.trim() && data.email.trim() && data.phone.trim());
    if (step === 1) return !!(data.employer.trim() && data.monthlyIncome.trim());
    if (step === 2) return data.documents.filter((d) => d.required).every((d) => d.uploaded);
    return true;
  }, [step, data]);

  const goNext = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else submitMutation.mutate();
  };
  const goBack = () => (step === 0 ? router.back() : setStep((s) => s - 1));

  if (submitted) {
    return (
      <SuccessView
        propertyTitle={property?.title ?? 'this home'}
        landlordName={property?.landlordName}
        onViewApplication={() => router.replace(`/(app)/application/${submitted.id}`)}
        onKeepBrowsing={() => router.replace('/(app)/(renter)/discover')}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingTop: insets.top + 8,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}
        >
          <ChevronLeft size={24} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">Apply to rent</Text>
          {property ? (
            <Text variant="caption" color="mutedForeground" numberOfLines={1}>
              {property.title} · {property.location}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ paddingHorizontal: spacing.xl, gap: spacing.sm, paddingBottom: spacing.md }}>
        <Progress value={(step + 1) / STEPS.length} />
        <Text variant="caption" color="mutedForeground">
          Step {step + 1} of {STEPS.length} · {STEPS[step].label}
        </Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        {step === 0 ? <PersonalStep data={data} update={update} /> : null}
        {step === 1 ? <EmploymentStep data={data} update={update} moveInDate={moveInDate} /> : null}
        {step === 2 ? (
          <DocumentsStep
            data={data}
            update={update}
            onUpload={(doc) => uploadDocMutation.mutate(doc)}
            onRemove={removeDocument}
            uploadingName={
              uploadDocMutation.isPending ? uploadDocMutation.variables?.name : undefined
            }
            error={docError}
          />
        ) : null}
        {step === 3 ? (
          <ReviewStep
            data={data}
            moveInDate={moveInDate}
            property={property}
            error={submitMutation.error}
          />
        ) : null}
      </ScrollView>

      <View
        style={{
          flexDirection: 'row',
          gap: spacing.md,
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + spacing.md,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <View style={{ flex: 1 }}>
          <Button label="Back" variant="secondary" onPress={goBack} />
        </View>
        <View style={{ flex: 2 }}>
          <Button
            label={step === STEPS.length - 1 ? 'Submit application' : 'Continue'}
            disabled={!canAdvance}
            loading={submitMutation.isPending}
            onPress={goNext}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function StepField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      {children}
      <Text variant="caption" color="mutedForeground">
        {label}
      </Text>
    </View>
  );
}

function PersonalStep({
  data,
  update,
}: {
  data: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.lg }}>
      <TextField
        label="Full name"
        placeholder="e.g. David Okoro"
        value={data.fullName}
        onChangeText={(v) => update('fullName', v)}
      />
      <TextField
        label="Email"
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={data.email}
        onChangeText={(v) => update('email', v)}
      />
      <TextField
        label="Phone number"
        placeholder="+234 800 000 0000"
        keyboardType="phone-pad"
        value={data.phone}
        onChangeText={(v) => update('phone', v)}
      />
      <TextField
        label="Current address"
        placeholder="Street, area, city"
        value={data.currentAddress}
        onChangeText={(v) => update('currentAddress', v)}
      />
    </View>
  );
}

function EmploymentStep({
  data,
  update,
  moveInDate,
}: {
  data: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  moveInDate: string;
}) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.lg }}>
      <TextField
        label="Employer"
        placeholder="Company name"
        value={data.employer}
        onChangeText={(v) => update('employer', v)}
      />

      <StepField label="Employment status">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {EMPLOYMENT_OPTIONS.map((o) => (
            <Chip
              key={o}
              label={o}
              selected={data.employmentStatus === o}
              onPress={() => update('employmentStatus', o)}
            />
          ))}
        </View>
      </StepField>

      <TextField
        label="Monthly income (₦)"
        placeholder="e.g. 600000"
        keyboardType="number-pad"
        value={data.monthlyIncome}
        onChangeText={(v) => update('monthlyIncome', v)}
      />

      <TextField
        label="Preferred move-in date"
        placeholder="YYYY-MM-DD"
        value={moveInDate}
        onChangeText={(v) => update('moveInDate', v)}
      />

      <StepField label="Lease term">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {LEASE_TERM_OPTIONS.map((o) => (
            <Chip
              key={o}
              label={o}
              selected={data.leaseTerm === o}
              onPress={() => update('leaseTerm', o)}
            />
          ))}
        </View>
      </StepField>

      <Text variant="callout" style={{ fontWeight: '700', marginTop: spacing.sm }}>
        Next of kin (optional)
      </Text>
      <TextField
        label="Full name"
        placeholder="e.g. Ngozi Okoro"
        value={data.nextOfKinName}
        onChangeText={(v) => update('nextOfKinName', v)}
      />
      <TextField
        label="Phone number"
        placeholder="+234 800 000 0000"
        keyboardType="phone-pad"
        value={data.nextOfKinPhone}
        onChangeText={(v) => update('nextOfKinPhone', v)}
      />
      <TextField
        label="Relationship"
        placeholder="e.g. Sibling"
        value={data.nextOfKinRelationship}
        onChangeText={(v) => update('nextOfKinRelationship', v)}
      />

      <Text variant="callout" style={{ fontWeight: '700', marginTop: spacing.sm }}>
        Reference (optional)
      </Text>
      <TextField
        label="Full name"
        placeholder="e.g. Previous landlord"
        value={data.referenceName}
        onChangeText={(v) => update('referenceName', v)}
      />
      <TextField
        label="Phone number"
        placeholder="+234 800 000 0000"
        keyboardType="phone-pad"
        value={data.referencePhone}
        onChangeText={(v) => update('referencePhone', v)}
      />
      <TextField
        label="Relationship"
        placeholder="e.g. Former landlord"
        value={data.referenceRelationship}
        onChangeText={(v) => update('referenceRelationship', v)}
      />
    </View>
  );
}

function DocumentsStep({
  data,
  update,
  onUpload,
  onRemove,
  uploadingName,
  error,
}: {
  data: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  onUpload: (doc: ApplicationDocument) => void;
  onRemove: (name: string) => void;
  uploadingName?: string;
  error: string | null;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        Upload the documents your landlord requires to review your application. PDF or photo, one
        file each.
      </Text>
      <View style={{ gap: spacing.sm }}>
        {data.documents.map((doc) => {
          const uploading = uploadingName === doc.name;
          return (
            <View
              key={doc.name}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: spacing.md,
                borderRadius: radius.md,
                backgroundColor: colors.secondary,
                gap: spacing.sm,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <FileText size={16} color={colors.mutedForeground} />
                <Text variant="callout" numberOfLines={1} style={{ flexShrink: 1 }}>
                  {doc.name}
                </Text>
                {doc.required && !doc.uploaded ? (
                  <Text variant="caption" style={{ color: colors.destructive }}>
                    Required
                  </Text>
                ) : null}
              </View>

              {doc.uploaded ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {doc.url ? (
                    <Pressable
                      onPress={() => Linking.openURL(doc.url!)}
                      hitSlop={8}
                      style={{ padding: 6 }}
                      accessibilityRole="button"
                      accessibilityLabel="View uploaded file"
                    >
                      <Eye size={16} color={colors.mutedForeground} />
                    </Pressable>
                  ) : null}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Check size={14} color={colors.success} />
                    <Text variant="caption" style={{ color: colors.success, fontWeight: '600' }}>
                      Uploaded
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => onRemove(doc.name)}
                    hitSlop={8}
                    style={{ padding: 6 }}
                    accessibilityRole="button"
                    accessibilityLabel="Remove file"
                  >
                    <X size={16} color={colors.mutedForeground} />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => onUpload(doc)}
                  disabled={uploading}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    paddingVertical: 7,
                    paddingHorizontal: 12,
                    borderRadius: radius.full,
                    backgroundColor: colors.primary,
                    opacity: uploading ? 0.7 : 1,
                  }}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                  ) : (
                    <Upload size={13} color={colors.primaryForeground} />
                  )}
                  <Text
                    variant="caption"
                    style={{ fontWeight: '700', color: colors.primaryForeground }}
                  >
                    {uploading ? 'Uploading…' : 'Upload'}
                  </Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>
      {error ? (
        <Text variant="caption" color="destructive">
          {error}
        </Text>
      ) : null}
      <TextField
        label="Additional notes for the landlord (optional)"
        placeholder="Anything you'd like the landlord to know"
        multiline
        numberOfLines={4}
        value={data.notes}
        onChangeText={(v) => update('notes', v)}
      />
    </View>
  );
}

function ReviewStep({
  data,
  moveInDate,
  property,
  error,
}: {
  data: FormState;
  moveInDate: string;
  property?: { landlordName?: string; title?: string };
  error: unknown;
}) {
  const { colors, spacing } = useTheme();
  const nairaFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    []
  );
  const readyDocs = data.documents.filter((d) => d.uploaded).length;

  return (
    <View style={{ gap: spacing.lg }}>
      <Card elevated>
        <View style={{ gap: spacing.sm }}>
          <SummaryRow label="Applicant" value={data.fullName} />
          <SummaryRow label="Contact" value={`${data.email} · ${data.phone}`} />
          <SummaryRow label="Employer" value={data.employer || '—'} />
          <SummaryRow
            label="Monthly income"
            value={
              data.monthlyIncome
                ? nairaFormatter.format(Number(data.monthlyIncome.replace(/[^\d]/g, '')))
                : '—'
            }
          />
          <SummaryRow label="Move-in / Term" value={`${moveInDate || '—'} · ${data.leaseTerm}`} />
          <SummaryRow label="Documents ready" value={`${readyDocs}/${data.documents.length}`} />
        </View>
      </Card>

      <Text variant="caption" color="mutedForeground">
        By submitting, you agree to share this information with{' '}
        {property?.landlordName || 'the landlord'} for the purpose of reviewing your rental
        application for {property?.title || 'this home'}.
      </Text>

      {error ? (
        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            alignItems: 'flex-start',
            padding: 12,
            borderRadius: 10,
            backgroundColor: colors.warningSubtle,
          }}
        >
          <ShieldAlert size={16} color={colors.warning} style={{ marginTop: 1 }} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="callout" style={{ color: colors.warning }}>
              {error instanceof ApiError
                ? error.message
                : 'Could not submit your application. Please try again.'}
            </Text>
            {error instanceof ApiError && error.code === 'IDENTITY_REQUIRED' ? (
              <Pressable onPress={() => router.push('/(app)/verify-identity')} hitSlop={6}>
                <Text variant="callout" color="primary" style={{ fontWeight: '700' }}>
                  Verify identity
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text variant="callout" color="mutedForeground">
        {label}
      </Text>
      <Text
        variant="callout"
        style={{ fontWeight: '600', color: colors.foreground, flexShrink: 1, textAlign: 'right' }}
      >
        {value}
      </Text>
    </View>
  );
}

function SuccessView({
  propertyTitle,
  landlordName,
  onViewApplication,
  onKeepBrowsing,
}: {
  propertyTitle: string;
  landlordName?: string;
  onViewApplication: () => void;
  onKeepBrowsing: () => void;
}) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        gap: spacing.md,
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.successSubtle,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CheckCircle2 size={30} color={colors.success} />
      </View>
      <Text variant="heading" center>
        Application submitted
      </Text>
      <Text variant="body" color="mutedForeground" center style={{ maxWidth: 320 }}>
        Your application for <Text variant="bodyStrong">{propertyTitle}</Text> has been sent to{' '}
        {landlordName || 'the landlord'}. You&apos;ll be notified as soon as there&apos;s an update.
      </Text>
      <View style={{ width: '100%', gap: spacing.sm, marginTop: spacing.lg }}>
        <Button label="View my application" onPress={onViewApplication} />
        <Button label="Keep browsing" variant="outline" onPress={onKeepBrowsing} />
      </View>
    </View>
  );
}
