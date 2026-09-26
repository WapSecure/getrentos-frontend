import { useEffect, useRef, useState } from 'react';
import { View, type TextInput } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AtSign, Phone, MessageCircle, User, ChevronDown, Gift } from 'lucide-react-native';
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
  useTheme,
} from '@getrentos/ui-native';
import { ApiError } from '@/lib/api/client';
import { useSignup } from '@/lib/auth/SignupContext';
import { haptics } from '@/lib/haptics';
import { openLegal } from '@/lib/links';
import {
  emailSignupSchema,
  phoneSignupSchema,
  type EmailSignupValues,
  type PhoneSignupValues,
} from '@/lib/validation';

type Method = 'email' | 'phone' | 'whatsapp';

export default function SignUpStart() {
  const { colors, spacing, radius } = useTheme();
  const { startVerification } = useSignup();
  const [method, setMethod] = useState<Method>('email');
  const [formError, setFormError] = useState<string | null>(null);
  const [showReferral, setShowReferral] = useState(false);
  const [referral, setReferral] = useState('');

  // Pre-fill a referral code carried on the deep link (getrentos://sign-up?ref=CODE).
  useEffect(() => {
    let alive = true;
    Linking.getInitialURL()
      .then((url) => {
        if (!alive || !url) return;
        const ref = Linking.parse(url).queryParams?.ref;
        if (typeof ref === 'string' && ref.trim()) {
          setReferral(ref.trim().toUpperCase());
          setShowReferral(true);
        }
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  return method === 'email' ? (
    <EmailForm
      key="email"
      method={method}
      setMethod={setMethod}
      formError={formError}
      setFormError={setFormError}
      showReferral={showReferral}
      setShowReferral={setShowReferral}
      referral={referral}
      setReferral={setReferral}
      colors={colors}
      spacing={spacing}
      radius={radius}
      startVerification={startVerification}
    />
  ) : (
    <PhoneForm
      key="phone"
      method={method}
      setMethod={setMethod}
      formError={formError}
      setFormError={setFormError}
      showReferral={showReferral}
      setShowReferral={setShowReferral}
      referral={referral}
      setReferral={setReferral}
      colors={colors}
      spacing={spacing}
      radius={radius}
      startVerification={startVerification}
    />
  );
}

type Shared = {
  method: Method;
  setMethod: (m: Method) => void;
  formError: string | null;
  setFormError: (v: string | null) => void;
  showReferral: boolean;
  setShowReferral: (v: boolean) => void;
  referral: string;
  setReferral: (v: string) => void;
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  radius: ReturnType<typeof useTheme>['radius'];
  startVerification: ReturnType<typeof useSignup>['startVerification'];
};

function MethodSwitch({
  method,
  setMethod,
  colors,
}: Pick<Shared, 'method' | 'setMethod' | 'colors'>) {
  return (
    <SegmentedControl<Method>
      accessibilityLabel="Sign up with"
      value={method}
      onChange={setMethod}
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
  );
}

function Referral({
  showReferral,
  setShowReferral,
  referral,
  setReferral,
  colors,
}: Pick<Shared, 'showReferral' | 'setShowReferral' | 'referral' | 'setReferral' | 'colors'>) {
  return showReferral ? (
    <Animated.View entering={FadeIn.duration(160)}>
      <TextField
        label="Referral code (optional)"
        placeholder="Enter a code"
        autoCapitalize="characters"
        leftIcon={<Gift size={18} color={colors.mutedForeground} />}
        value={referral}
        onChangeText={setReferral}
      />
    </Animated.View>
  ) : (
    <PressableScale
      haptic={false}
      onPress={() => setShowReferral(true)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}
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
        accessibilityLabel="I agree to the Terms of Service and Privacy Policy"
        label="I agree to the Terms of Service and Privacy Policy."
      />
      <View style={{ flexDirection: 'row', gap: 16, marginLeft: 32 }}>
        <LinkButton
          label="Read the Terms"
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

function EmailForm(props: Shared) {
  const { colors, spacing, startVerification, setFormError, formError, referral } = props;
  const emailRef = useRef<TextInput>(null);
  const pwRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailSignupValues>({
    resolver: zodResolver(emailSignupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptedTerms: false as never,
    },
    mode: 'onTouched',
  });
  const password = useWatch({ control, name: 'password' });

  const submit = handleSubmit(async (v) => {
    setFormError(null);
    try {
      await startVerification({
        method: 'email',
        otpMethod: 'email',
        fullName: v.fullName.trim(),
        email: v.email.trim(),
        password: v.password,
        referralCode: referral.trim() || undefined,
      });
      await haptics.success();
      router.push('/(auth)/sign-up/verify');
    } catch (err) {
      await haptics.error();
      setFormError(err instanceof ApiError ? err.message : 'Could not start signup. Try again.');
    }
  });

  return (
    <AuthScaffold
      kicker="Create account"
      title="Join GetRentos"
      subtitle="One account for renting, buying, listing and managing property."
      progress={1 / 3}
      progressLabel="Sign-up step 1 of 3"
      onBack={() => router.replace('/(auth)/welcome')}
      footer={
        <>
          <Button label="Continue" loading={isSubmitting} onPress={submit} />
          <SignInLink />
        </>
      }
    >
      <View style={{ gap: spacing.xl }}>
        <MethodSwitch {...props} />
        <View style={{ gap: spacing.lg }}>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Full name"
                placeholder="Ada Lovelace"
                leftIcon={<User size={18} color={colors.mutedForeground} />}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                onSubmitEditing={() => emailRef.current?.focus()}
                error={errors.fullName?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                ref={emailRef}
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
                onChangeText={onChange}
                onBlur={onBlur}
                onSubmitEditing={() => pwRef.current?.focus()}
                error={errors.email?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <PasswordField
                ref={pwRef}
                label="Password"
                placeholder="At least 8 characters"
                showStrength
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="next"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                onSubmitEditing={() => confirmRef.current?.focus()}
                error={errors.password?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <PasswordField
                ref={confirmRef}
                label="Confirm password"
                placeholder="Re-enter your password"
                autoComplete="new-password"
                textContentType="newPassword"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                onSubmitEditing={submit}
                error={errors.confirmPassword?.message}
                hint={value.length > 0 && value === password ? 'Passwords match' : undefined}
              />
            )}
          />
          <Referral {...props} />
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
      </View>
    </AuthScaffold>
  );
}

function PhoneForm(props: Shared) {
  const { colors, spacing, startVerification, setFormError, formError, referral } = props;
  const phoneRef = useRef<TextInput>(null);
  const pwRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PhoneSignupValues>({
    resolver: zodResolver(phoneSignupSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      password: '',
      confirmPassword: '',
      acceptedTerms: false as never,
    },
    mode: 'onTouched',
  });
  const password = useWatch({ control, name: 'password' });

  const submit = handleSubmit(async (v) => {
    setFormError(null);
    try {
      await startVerification({
        method: 'phone',
        otpMethod: props.method === 'whatsapp' ? 'whatsapp' : 'phone',
        fullName: v.fullName.trim(),
        phone: v.phone.trim(),
        password: v.password,
        referralCode: referral.trim() || undefined,
      });
      await haptics.success();
      router.push('/(auth)/sign-up/verify');
    } catch (err) {
      await haptics.error();
      setFormError(err instanceof ApiError ? err.message : 'Could not start signup. Try again.');
    }
  });

  return (
    <AuthScaffold
      kicker="Create account"
      title="Join GetRentos"
      subtitle="One account for renting, buying, listing and managing property."
      progress={1 / 3}
      progressLabel="Sign-up step 1 of 3"
      onBack={() => router.replace('/(auth)/welcome')}
      footer={
        <>
          <Button label="Continue" loading={isSubmitting} onPress={submit} />
          <SignInLink />
        </>
      }
    >
      <View style={{ gap: spacing.xl }}>
        <MethodSwitch {...props} />
        <View style={{ gap: spacing.lg }}>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Full name"
                placeholder="Ada Lovelace"
                leftIcon={<User size={18} color={colors.mutedForeground} />}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                onSubmitEditing={() => phoneRef.current?.focus()}
                error={errors.fullName?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                ref={phoneRef}
                label="Phone number"
                placeholder="+234 801 234 5678"
                leftIcon={<Phone size={18} color={colors.mutedForeground} />}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                returnKeyType="next"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                onSubmitEditing={() => pwRef.current?.focus()}
                error={errors.phone?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <PasswordField
                ref={pwRef}
                label="Password"
                placeholder="At least 8 characters"
                showStrength
                autoComplete="new-password"
                textContentType="newPassword"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                onSubmitEditing={() => confirmRef.current?.focus()}
                error={errors.password?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <PasswordField
                ref={confirmRef}
                label="Confirm password"
                placeholder="Re-enter your password"
                autoComplete="new-password"
                textContentType="newPassword"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                onSubmitEditing={submit}
                error={errors.confirmPassword?.message}
                hint={value.length > 0 && value === password ? 'Passwords match' : undefined}
              />
            )}
          />
          <Referral {...props} />
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
      </View>
    </AuthScaffold>
  );
}
