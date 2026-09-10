import { useEffect, useRef, useState } from 'react';
import { Pressable, View, type TextInput } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  AtSign,
  Phone,
  MessageCircle,
  User,
  Check,
  CheckCircle2,
  ChevronDown,
  Gift,
} from 'lucide-react-native';
import {
  AuthScaffold,
  Button,
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
  colors,
  radius,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  error?: string;
  colors: Shared['colors'];
  radius: Shared['radius'];
}) {
  return (
    <View style={{ gap: 4 }}>
      <Pressable
        onPress={() => onChange(!value)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: value }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: radius.sm - 2,
            borderWidth: 1.5,
            borderColor: value ? colors.primary : colors.border,
            backgroundColor: value ? colors.primary : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {value ? <Check size={14} color={colors.primaryForeground} strokeWidth={3} /> : null}
        </View>
        <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
          I agree to the Terms of Service and Privacy Policy.
        </Text>
      </Pressable>
      {error ? (
        <Text variant="caption" color="destructive" style={{ marginLeft: 32 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function EmailForm(props: Shared) {
  const { colors, spacing, radius, startVerification, setFormError, formError, referral } = props;
  const emailRef = useRef<TextInput>(null);
  const pwRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    watch,
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
      onBack={() => router.replace('/(auth)/welcome')}
      footer={
        <>
          <Button label="Continue" loading={isSubmitting} onPress={submit} />
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <Text variant="callout" color="mutedForeground">
              Already have an account?{' '}
            </Text>
            <Text
              variant="callout"
              color="primary"
              style={{ fontWeight: '700' }}
              onPress={() => router.replace('/(auth)/sign-in')}
            >
              Sign in
            </Text>
          </View>
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
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                onSubmitEditing={submit}
                error={errors.confirmPassword?.message}
                hint={
                  value.length > 0 && value === watch('password') ? 'Passwords match' : undefined
                }
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
                colors={colors}
                radius={radius}
              />
            )}
          />
          {formError ? (
            <Text variant="callout" color="destructive">
              {formError}
            </Text>
          ) : null}
        </View>
      </View>
    </AuthScaffold>
  );
}

function PhoneForm(props: Shared) {
  const { colors, spacing, radius, startVerification, setFormError, formError, referral } = props;
  const pwRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    watch,
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
      onBack={() => router.replace('/(auth)/welcome')}
      footer={<Button label="Continue" loading={isSubmitting} onPress={submit} />}
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
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.fullName?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Phone number"
                placeholder="+234 801 234 5678"
                leftIcon={<Phone size={18} color={colors.mutedForeground} />}
                keyboardType="phone-pad"
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
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                onSubmitEditing={submit}
                error={errors.confirmPassword?.message}
                hint={
                  value.length > 0 && value === watch('password') ? 'Passwords match' : undefined
                }
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
                colors={colors}
                radius={radius}
              />
            )}
          />
          {formError ? (
            <Text variant="callout" color="destructive">
              {formError}
            </Text>
          ) : null}
        </View>
      </View>
    </AuthScaffold>
  );
}
