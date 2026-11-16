import { useEffect, useRef, useState } from 'react';
import { type TextInputInstance, View } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AtSign, Phone, MessageCircle, User, ChevronDown, Gift } from '@sureground/icons/native';
import {
  AuthScaffold,
  Button,
  Checkbox,
  FormAlert,
  LinkButton,
  PasswordField,
  PressableScale,
  SegmentedControl,
  Text,
  TextField,
  useReducedMotion,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { SignupFieldError, useSignup, type StepOneValues } from '@/lib/auth/SignupContext';
import { codeSendErrorCopy, signupFieldIssue, type SignupIssue } from '@/lib/auth/signupErrors';
import { haptics } from '@/lib/haptics';
import { openLegal } from '@/lib/links';
import { announceFirstError } from '@/lib/formErrors';
import { SocialSignIn } from '@/components/auth/SocialSignIn';
import { emailStepOneSchema, phoneStepOneSchema, type StepOneFormValues } from '@/lib/validation';
import { AUTH_CONSTANTS } from '@sureground/shared';

type Method = 'email' | 'phone' | 'whatsapp';

const FIELD_ORDER = ['fullName', 'email', 'phone', 'password', 'acceptedTerms'] as const;

export default function SignUpStart() {
  const { restored, resumeAt, clearResume, draft, values, saveValues } = useSignup();
  const toast = useToast();
  const [method, setMethod] = useState<Method>(draft?.otpMethod ?? 'email');
  const url = Linking.useURL();

  useEffect(() => {
    if (!resumeAt) return;
    clearResume();
    toast.show('Picked up where you left off.', 'success');
    router.push(resumeAt === 'roles' ? '/(auth)/sign-up/roles' : '/(auth)/sign-up/verify');
  }, [resumeAt, clearResume, toast]);

  // A referral link (sureground://sign-up?ref=CODE) can arrive at launch or while the app is open.
  useEffect(() => {
    if (!url) return;
    const ref = Linking.parse(url).queryParams?.ref;
    if (typeof ref === 'string' && ref.trim()) saveValues({ referral: ref.trim().toUpperCase() });
  }, [url, saveValues]);

  if (!restored) return null;

  const kind = method === 'email' ? 'email' : 'phone';
  return (
    <StepOneForm
      key={kind}
      kind={kind}
      method={method}
      setMethod={setMethod}
      initial={values}
      referral={values.referral}
    />
  );
}

function StepOneForm({
  kind,
  method,
  setMethod,
  initial,
  referral,
}: {
  kind: 'email' | 'phone';
  method: Method;
  setMethod: (m: Method) => void;
  initial: StepOneValues;
  referral: string;
}) {
  const { colors, spacing } = useTheme();
  const { startVerification, saveValues, issue, setIssue } = useSignup();
  const [formError, setFormError] = useState<string | null>(null);
  const identifierRef = useRef<TextInputInstance>(null);
  const pwRef = useRef<TextInputInstance>(null);

  const {
    control,
    handleSubmit,
    getValues,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<StepOneFormValues>({
    resolver: zodResolver(kind === 'email' ? emailStepOneSchema : phoneStepOneSchema),
    defaultValues: {
      fullName: initial.fullName,
      email: initial.email,
      phone: initial.phone,
      password: initial.password,
      acceptedTerms: initial.acceptedTerms as never,
    },
    mode: 'onTouched',
  });

  // A refusal from the server, from this step or sent back from a later one, shown on its field with everything still filled in.
  const issueFor = (field: SignupIssue['field']) =>
    issue?.field === field ? issue.message : undefined;
  const clearIssue = (field: SignupIssue['field']) => {
    if (issue?.field === field) setIssue(null);
  };

  useEffect(() => {
    if (!issue) return;
    if (issue.field !== 'referralCode') setFocus(issue.field === 'identifier' ? kind : 'password');
    announceFirstError({ [issue.field]: issue }, [issue.field]);
  }, [issue, kind, setFocus]);

  const switchMethod = (next: Method) => {
    saveValues(getValues());
    setFormError(null);
    setIssue(null);
    setMethod(next);
  };

  const submit = handleSubmit(
    async (v) => {
      setFormError(null);
      setIssue(null);
      saveValues(v);
      try {
        await startVerification({
          method: kind,
          otpMethod: method,
          fullName: v.fullName.trim(),
          email: kind === 'email' ? v.email.trim() : undefined,
          phone: kind === 'phone' ? v.phone.trim() : undefined,
          password: v.password,
          referralCode: referral.trim() || undefined,
        });
        await haptics.success();
        router.push('/(auth)/sign-up/verify');
      } catch (err) {
        await haptics.error();
        const found = err instanceof SignupFieldError ? err.issue : signupFieldIssue(err, kind);
        if (found) setIssue(found);
        else setFormError(codeSendErrorCopy(err, 'Could not send your code. Try again.'));
      }
    },
    (errs) => announceFirstError(errs, FIELD_ORDER)
  );

  const identifier = () => (kind === 'email' ? getValues('email') : getValues('phone')).trim();

  return (
    <AuthScaffold
      kicker="Step 1 of 3"
      title="Join Sureground"
      subtitle="One account for renting, buying, listing and managing property."
      progress={1 / 3}
      progressLabel="Sign-up step 1 of 3"
      onBack={() => router.replace('/(auth)/welcome')}
      footer={<Button label="Continue" loading={isSubmitting} onPress={() => void submit()} />}
      footerSecondary={<SignInLink />}
    >
      <View style={{ gap: spacing.xl }}>
        <SegmentedControl<Method>
          accessibilityLabel="Sign up with"
          value={method}
          onChange={switchMethod}
          options={[
            {
              value: 'email',
              label: 'Email',
              icon: <AtSign size={15} color={colors.mutedForeground} />,
            },
            {
              value: 'phone',
              label: 'Phone',
              icon: <Phone size={15} color={colors.mutedForeground} />,
            },
            {
              value: 'whatsapp',
              label: 'WhatsApp',
              icon: <MessageCircle size={15} color={colors.mutedForeground} />,
            },
          ]}
        />
        <View style={{ gap: spacing.lg }}>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                ref={ref}
                label="Full name"
                placeholder="Adaeze Okafor"
                leftIcon={<User size={18} color={colors.mutedForeground} />}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                onSubmitEditing={() => identifierRef.current?.focus()}
                error={errors.fullName?.message}
              />
            )}
          />
          <View>
            {kind === 'email' ? (
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value, ref } }) => (
                  <TextField
                    ref={(el) => {
                      ref(el);
                      identifierRef.current = el;
                    }}
                    label="Email address"
                    placeholder="you@example.com"
                    leftIcon={<AtSign size={18} color={colors.mutedForeground} />}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="next"
                    value={value}
                    onChangeText={(t) => {
                      onChange(t);
                      clearIssue('identifier');
                    }}
                    onBlur={onBlur}
                    onSubmitEditing={() => pwRef.current?.focus()}
                    error={errors.email?.message ?? issueFor('identifier')}
                  />
                )}
              />
            ) : (
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value, ref } }) => (
                  <TextField
                    ref={(el) => {
                      ref(el);
                      identifierRef.current = el;
                    }}
                    label="Phone number"
                    placeholder="0803 123 4567"
                    hint="A Nigerian number, or start with + for another country."
                    leftIcon={<Phone size={18} color={colors.mutedForeground} />}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    returnKeyType="next"
                    value={value}
                    onChangeText={(t) => {
                      onChange(t);
                      clearIssue('identifier');
                    }}
                    onBlur={onBlur}
                    onSubmitEditing={() => pwRef.current?.focus()}
                    error={errors.phone?.message ?? issueFor('identifier')}
                  />
                )}
              />
            )}
            {issue?.accountExists ? (
              <LinkButton
                label="Sign in instead"
                onPress={() =>
                  router.replace({
                    pathname: '/(auth)/sign-in',
                    params: { identifier: identifier() },
                  })
                }
              />
            ) : null}
          </View>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <PasswordField
                ref={(el) => {
                  ref(el);
                  pwRef.current = el;
                }}
                label="Password"
                placeholder={`At least ${AUTH_CONSTANTS.PASSWORD_MIN_LENGTH} characters`}
                hint={`At least ${AUTH_CONSTANTS.PASSWORD_MIN_LENGTH} characters. A short phrase works well.`}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="done"
                value={value}
                onChangeText={(t) => {
                  onChange(t);
                  clearIssue('password');
                }}
                onBlur={onBlur}
                onSubmitEditing={() => void submit()}
                error={errors.password?.message ?? issueFor('password')}
              />
            )}
          />
          <Referral
            referral={referral}
            error={issueFor('referralCode') ?? null}
            onChange={(v) => {
              saveValues({ referral: v });
              clearIssue('referralCode');
            }}
          />
          <Controller
            control={control}
            name="acceptedTerms"
            render={({ field: { onChange, value } }) => (
              <Terms
                value={!!value}
                onChange={onChange}
                error={errors.acceptedTerms?.message as string | undefined}
              />
            )}
          />
          <FormAlert message={formError} />
        </View>
        <View style={{ gap: spacing.sm }}>
          <SocialSignIn onError={setFormError} />
          <Text variant="caption" color="mutedForeground" center>
            Continuing with Apple or Google means you agree to the Terms of Service and Privacy
            Policy.
          </Text>
        </View>
      </View>
    </AuthScaffold>
  );
}

function Referral({
  referral,
  error,
  onChange,
}: {
  referral: string;
  error: string | null;
  onChange: (v: string) => void;
}) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(!!referral);
  const shown = open || !!referral;

  return shown ? (
    <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(160)}>
      <TextField
        label="Referral code"
        optional
        placeholder="Enter a code"
        autoCapitalize="characters"
        leftIcon={<Gift size={18} color={colors.mutedForeground} />}
        value={referral}
        onChangeText={onChange}
        error={error}
      />
    </Animated.View>
  ) : (
    <PressableScale
      haptic={false}
      onPress={() => setOpen(true)}
      accessibilityRole="button"
      accessibilityLabel="Have a referral code?"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        minHeight: 44,
      }}
    >
      <Gift size={15} color={colors.primary} />
      <Text variant="callout" color="primary" style={{ fontWeight: '600' }}>
        Have a referral code?
      </Text>
      <ChevronDown size={15} color={colors.primary} />
    </PressableScale>
  );
}

function Terms({
  value,
  onChange,
  error,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  error?: string;
}) {
  return (
    <View>
      <Checkbox
        checked={value}
        onChange={onChange}
        error={error}
        label="I agree to the Terms of Service and Privacy Policy."
      />
      <View style={{ flexDirection: 'row', gap: 16, marginLeft: 32 }}>
        <LinkButton
          label="Terms of Service"
          accessibilityRole="link"
          onPress={() => openLegal('terms')}
        />
        <LinkButton
          label="Privacy Policy"
          accessibilityRole="link"
          onPress={() => openLegal('privacy')}
        />
      </View>
    </View>
  );
}

function SignInLink() {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
      <Text variant="callout" color="mutedForeground">
        Already have an account?{' '}
      </Text>
      <LinkButton label="Sign in" onPress={() => router.replace('/(auth)/sign-in')} />
    </View>
  );
}
