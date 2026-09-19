import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from 'react-native-reanimated';
import {
  CheckCircle2,
  ChevronLeft,
  Eye,
  FileText,
  Pencil,
  ShieldAlert,
  Upload,
  X,
} from 'lucide-react-native';
import {
  Button,
  Card,
  Chip,
  DateField,
  Divider,
  Progress,
  Text,
  TextField,
  toISODate,
  useTheme,
} from '@getrentos/ui-native';
import { useAuth } from '@/lib/auth/AuthProvider';
import { qk } from '@/lib/query/keys';
import { propertiesApi } from '@/lib/api/properties';
import { documentsApi } from '@/lib/api/documents';
import { pickDocument } from '@/lib/filePicker';
import { haptics } from '@/lib/haptics';
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

type FieldErrors = Partial<Record<keyof FormState, string>>;

const STEPS = [
  { key: 'personal', title: 'About you', subtitle: "Let's start with the basics." },
  { key: 'move', title: 'Your move', subtitle: 'Where you live now, and when you want in.' },
  {
    key: 'income',
    title: 'Income',
    subtitle: 'Show your landlord you can comfortably afford this.',
  },
  {
    key: 'references',
    title: 'References',
    subtitle: 'Optional, but it strengthens your application.',
  },
  {
    key: 'documents',
    title: 'Documents',
    subtitle: 'Upload what your landlord needs to review you.',
  },
  {
    key: 'review',
    title: 'Review & submit',
    subtitle: 'Check everything before it goes to the landlord.',
  },
] as const;

const EMPLOYMENT_OPTIONS = ['Employed', 'Self-employed', 'Business owner', 'Student'];
const LEASE_TERM_OPTIONS = ['6 months', '12 months', '24 months'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatIncome(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '');
  return digits ? Number(digits).toLocaleString('en-NG') : '';
}

function validateStep(step: number, data: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (step === 0) {
    if (!data.fullName.trim()) errors.fullName = 'Enter your full name';
    if (!data.email.trim() || !EMAIL_RE.test(data.email.trim()))
      errors.email = 'Enter a valid email';
    if (!data.phone.trim()) errors.phone = 'Enter a phone number';
  } else if (step === 1) {
    if (!data.currentAddress.trim()) errors.currentAddress = 'Enter your current address';
  } else if (step === 2) {
    if (!data.employer.trim()) errors.employer = 'Enter your employer or business name';
    if (!data.monthlyIncome.trim()) errors.monthlyIncome = 'Enter your monthly income';
  } else if (step === 4) {
    if (data.documents.some((d) => d.required && !d.uploaded)) {
      errors.documents = 'Upload every required document to continue';
    }
  }
  return errors;
}

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
  const [direction, setDirection] = useState<1 | -1>(1);
  const [attempted, setAttempted] = useState(false);
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
      if (result) {
        setDocument(result.doc.name, {
          uploaded: true,
          documentId: result.uploaded.id,
          url: result.uploaded.url,
        });
        haptics.tap();
      }
    },
    onError: (err) => {
      haptics.error();
      setDocError(
        err instanceof ApiError ? err.message : 'Could not upload the file. Please try again.'
      );
    },
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
      haptics.success();
      setSubmitted(app);
    },
    onError: () => haptics.error(),
  });

  const stepErrors = useMemo(() => validateStep(step, data), [step, data]);
  const canAdvance = Object.keys(stepErrors).length === 0;

  const goToStep = (target: number) => {
    setDirection(target >= step ? 1 : -1);
    setAttempted(false);
    setStep(target);
  };

  const goNext = async () => {
    if (!canAdvance) {
      setAttempted(true);
      await haptics.error();
      return;
    }
    await haptics.tap();
    if (step < STEPS.length - 1) goToStep(step + 1);
    else submitMutation.mutate();
  };
  const goBack = () => (step === 0 ? router.back() : goToStep(step - 1));

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

  const current = STEPS[step];

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
        {property?.image ? (
          <Image
            source={{ uri: property.image }}
            contentFit="cover"
            style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: colors.secondary }}
          />
        ) : null}
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">Apply to rent</Text>
          {property ? (
            <Text variant="caption" color="mutedForeground" numberOfLines={1}>
              {property.title} · {property.location}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ paddingHorizontal: spacing.xl, gap: 6, paddingBottom: spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="caption" color="mutedForeground">
            Step {step + 1} of {STEPS.length}
          </Text>
          <Text variant="caption" color="mutedForeground">
            {Math.round(((step + 1) / STEPS.length) * 100)}%
          </Text>
        </View>
        <Progress value={(step + 1) / STEPS.length} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: spacing['3xl'],
        }}
      >
        <Animated.View
          key={step}
          entering={(direction === 1 ? SlideInRight : SlideInLeft).duration(240)}
          exiting={(direction === 1 ? SlideOutLeft : SlideOutRight).duration(180)}
          style={{ paddingHorizontal: spacing.xl, gap: spacing.lg }}
        >
          <View style={{ gap: 3 }}>
            <Text variant="title">{current.title}</Text>
            <Text variant="body" color="mutedForeground">
              {current.subtitle}
            </Text>
          </View>

          {step === 0 ? (
            <PersonalStep data={data} update={update} errors={attempted ? stepErrors : {}} />
          ) : null}
          {step === 1 ? (
            <MoveStep
              data={data}
              update={update}
              moveInDate={moveInDate}
              errors={attempted ? stepErrors : {}}
            />
          ) : null}
          {step === 2 ? (
            <IncomeStep data={data} update={update} errors={attempted ? stepErrors : {}} />
          ) : null}
          {step === 3 ? <ReferencesStep data={data} update={update} /> : null}
          {step === 4 ? (
            <DocumentsStep
              data={data}
              update={update}
              onUpload={(doc) => uploadDocMutation.mutate(doc)}
              onRemove={removeDocument}
              uploadingName={
                uploadDocMutation.isPending ? uploadDocMutation.variables?.name : undefined
              }
              error={docError ?? (attempted ? stepErrors.documents : undefined) ?? null}
            />
          ) : null}
          {step === 5 ? (
            <ReviewStep
              data={data}
              moveInDate={moveInDate}
              property={property}
              error={submitMutation.error}
              onEditStep={goToStep}
            />
          ) : null}
        </Animated.View>
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
            loading={submitMutation.isPending}
            onPress={goNext}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ------------------------------ steps ----------------------------------- */

function PersonalStep({
  data,
  update,
  errors,
}: {
  data: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  errors: FieldErrors;
}) {
  const { spacing } = useTheme();
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);

  return (
    <View style={{ gap: spacing.lg }}>
      <TextField
        label="Full name"
        placeholder="e.g. David Okoro"
        returnKeyType="next"
        value={data.fullName}
        onChangeText={(v) => update('fullName', v)}
        onSubmitEditing={() => emailRef.current?.focus()}
        error={errors.fullName}
      />
      <TextField
        ref={emailRef}
        label="Email"
        placeholder="you@example.com"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        returnKeyType="next"
        value={data.email}
        onChangeText={(v) => update('email', v)}
        onSubmitEditing={() => phoneRef.current?.focus()}
        error={errors.email}
      />
      <TextField
        ref={phoneRef}
        label="Phone number"
        placeholder="+234 800 000 0000"
        keyboardType="phone-pad"
        returnKeyType="done"
        value={data.phone}
        onChangeText={(v) => update('phone', v)}
        error={errors.phone}
      />
    </View>
  );
}

function MoveStep({
  data,
  update,
  moveInDate,
  errors,
}: {
  data: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  moveInDate: string;
  errors: FieldErrors;
}) {
  const { spacing } = useTheme();

  return (
    <View style={{ gap: spacing.lg }}>
      <TextField
        label="Current address"
        placeholder="Street, area, city"
        returnKeyType="done"
        value={data.currentAddress}
        onChangeText={(v) => update('currentAddress', v)}
        error={errors.currentAddress}
      />
      <DateField
        label="Preferred move-in date"
        value={moveInDate}
        onChange={(v) => update('moveInDate', v)}
        min={toISODate(new Date())}
        hint={
          !data.moveInDate
            ? "We'll use the listing's availability if you leave this blank"
            : undefined
        }
      />

      <Field label="Lease term">
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
      </Field>
    </View>
  );
}

function IncomeStep({
  data,
  update,
  errors,
}: {
  data: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  errors: FieldErrors;
}) {
  const { spacing } = useTheme();
  const incomeRef = useRef<TextInput>(null);

  return (
    <View style={{ gap: spacing.lg }}>
      <Field label="Employment status">
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
      </Field>

      <TextField
        label={data.employmentStatus === 'Student' ? 'School' : 'Employer'}
        placeholder="Company name"
        returnKeyType="next"
        value={data.employer}
        onChangeText={(v) => update('employer', v)}
        onSubmitEditing={() => incomeRef.current?.focus()}
        error={errors.employer}
      />

      <TextField
        ref={incomeRef}
        label="Monthly income"
        placeholder="600,000"
        keyboardType="number-pad"
        returnKeyType="done"
        leftIcon={
          <Text variant="body" color="mutedForeground">
            ₦
          </Text>
        }
        value={formatIncome(data.monthlyIncome)}
        onChangeText={(v) => update('monthlyIncome', v.replace(/[^\d]/g, ''))}
        error={errors.monthlyIncome}
      />
      <Text variant="caption" color="mutedForeground" style={{ marginTop: -spacing.sm }}>
        Only visible to the landlord reviewing this application.
      </Text>
    </View>
  );
}

function ReferencesStep({
  data,
  update,
}: {
  data: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  const { spacing } = useTheme();
  const kinPhoneRef = useRef<TextInput>(null);
  const kinRelRef = useRef<TextInput>(null);
  const refPhoneRef = useRef<TextInput>(null);
  const refRelRef = useRef<TextInput>(null);

  return (
    <View style={{ gap: spacing['2xl'] }}>
      <View style={{ gap: spacing.md }}>
        <SectionLabel title="Next of kin" />
        <TextField
          label="Full name"
          placeholder="e.g. Ngozi Okoro"
          returnKeyType="next"
          value={data.nextOfKinName}
          onChangeText={(v) => update('nextOfKinName', v)}
          onSubmitEditing={() => kinPhoneRef.current?.focus()}
        />
        <TextField
          ref={kinPhoneRef}
          label="Phone number"
          placeholder="+234 800 000 0000"
          keyboardType="phone-pad"
          returnKeyType="next"
          value={data.nextOfKinPhone}
          onChangeText={(v) => update('nextOfKinPhone', v)}
          onSubmitEditing={() => kinRelRef.current?.focus()}
        />
        <TextField
          ref={kinRelRef}
          label="Relationship"
          placeholder="e.g. Sibling"
          returnKeyType="next"
          value={data.nextOfKinRelationship}
          onChangeText={(v) => update('nextOfKinRelationship', v)}
        />
      </View>

      <Divider />

      <View style={{ gap: spacing.md }}>
        <SectionLabel title="Reference" />
        <TextField
          label="Full name"
          placeholder="e.g. Previous landlord"
          returnKeyType="next"
          value={data.referenceName}
          onChangeText={(v) => update('referenceName', v)}
          onSubmitEditing={() => refPhoneRef.current?.focus()}
        />
        <TextField
          ref={refPhoneRef}
          label="Phone number"
          placeholder="+234 800 000 0000"
          keyboardType="phone-pad"
          returnKeyType="next"
          value={data.referencePhone}
          onChangeText={(v) => update('referencePhone', v)}
          onSubmitEditing={() => refRelRef.current?.focus()}
        />
        <TextField
          ref={refRelRef}
          label="Relationship"
          placeholder="e.g. Former landlord"
          returnKeyType="done"
          value={data.referenceRelationship}
          onChangeText={(v) => update('referenceRelationship', v)}
        />
      </View>
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
      <Card elevated padding="none">
        {data.documents.map((doc, i) => {
          const uploading = uploadingName === doc.name;
          return (
            <View key={doc.name}>
              {i > 0 ? <Divider /> : null}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: spacing.md,
                  gap: spacing.sm,
                }}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: radius.sm,
                    backgroundColor: doc.uploaded ? colors.successSubtle : colors.secondary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileText
                    size={16}
                    color={doc.uploaded ? colors.success : colors.mutedForeground}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="callout" numberOfLines={1} style={{ fontWeight: '600' }}>
                    {doc.name}
                  </Text>
                  <Text
                    variant="caption"
                    style={{
                      color: doc.uploaded
                        ? colors.success
                        : doc.required
                          ? colors.destructive
                          : colors.mutedForeground,
                    }}
                  >
                    {doc.uploaded ? 'Uploaded' : doc.required ? 'Required' : 'Optional'}
                  </Text>
                </View>

                {doc.uploaded ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
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
            </View>
          );
        })}
      </Card>
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
  onEditStep,
}: {
  data: FormState;
  moveInDate: string;
  property?: { landlordName?: string; title?: string };
  error: unknown;
  onEditStep: (step: number) => void;
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
  const hasReferences = !!(data.nextOfKinName.trim() || data.referenceName.trim());

  return (
    <View style={{ gap: spacing.lg }}>
      <ReviewSection title="About you" onEdit={() => onEditStep(0)}>
        <SummaryRow label="Name" value={data.fullName} />
        <SummaryRow label="Contact" value={`${data.email} · ${data.phone}`} />
      </ReviewSection>

      <ReviewSection title="Your move" onEdit={() => onEditStep(1)}>
        <SummaryRow label="Current address" value={data.currentAddress || '—'} />
        <SummaryRow label="Move-in date" value={moveInDate || '—'} />
        <SummaryRow label="Lease term" value={data.leaseTerm} />
      </ReviewSection>

      <ReviewSection title="Income" onEdit={() => onEditStep(2)}>
        <SummaryRow
          label={data.employmentStatus === 'Student' ? 'School' : 'Employer'}
          value={data.employer || '—'}
        />
        <SummaryRow label="Status" value={data.employmentStatus} />
        <SummaryRow
          label="Monthly income"
          value={data.monthlyIncome ? nairaFormatter.format(Number(data.monthlyIncome)) : '—'}
        />
      </ReviewSection>

      <ReviewSection title="References" onEdit={() => onEditStep(3)}>
        {hasReferences ? (
          <>
            {data.nextOfKinName.trim() ? (
              <SummaryRow
                label="Next of kin"
                value={`${data.nextOfKinName} · ${data.nextOfKinPhone}`}
              />
            ) : null}
            {data.referenceName.trim() ? (
              <SummaryRow
                label="Reference"
                value={`${data.referenceName} · ${data.referencePhone}`}
              />
            ) : null}
          </>
        ) : (
          <Text variant="callout" color="mutedForeground">
            None added
          </Text>
        )}
      </ReviewSection>

      <ReviewSection title="Documents" onEdit={() => onEditStep(4)}>
        <SummaryRow label="Ready" value={`${readyDocs} of ${data.documents.length}`} />
      </ReviewSection>

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

/* --------------------------- small pieces -------------------------------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="callout" color="mutedForeground" style={{ fontWeight: '600' }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function SectionLabel({ title }: { title: string }) {
  return (
    <Text variant="label" color="primary" uppercase>
      {title}
    </Text>
  );
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  const { colors, spacing } = useTheme();
  return (
    <Card elevated>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.sm,
        }}
      >
        <Text variant="bodyStrong">{title}</Text>
        <Pressable
          onPress={onEdit}
          hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <Pencil size={12} color={colors.primary} />
          <Text variant="caption" color="primary" style={{ fontWeight: '700' }}>
            Edit
          </Text>
        </Pressable>
      </View>
      <View style={{ gap: spacing.sm }}>{children}</View>
    </Card>
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
      <Animated.View
        entering={FadeIn.duration(420)}
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
      </Animated.View>
      <Animated.View
        entering={FadeIn.duration(420).delay(120)}
        style={{ alignItems: 'center', gap: spacing.md }}
      >
        <Text variant="heading" center>
          Application submitted
        </Text>
        <Text variant="body" color="mutedForeground" center style={{ maxWidth: 320 }}>
          Your application for <Text variant="bodyStrong">{propertyTitle}</Text> has been sent to{' '}
          {landlordName || 'the landlord'}. You&apos;ll be notified as soon as there&apos;s an
          update.
        </Text>
      </Animated.View>
      <Animated.View
        entering={FadeIn.duration(420).delay(220)}
        style={{ width: '100%', gap: spacing.sm, marginTop: spacing.lg }}
      >
        <Button label="View my application" onPress={onViewApplication} />
        <Button label="Keep browsing" variant="outline" onPress={onKeepBrowsing} />
      </Animated.View>
    </View>
  );
}
