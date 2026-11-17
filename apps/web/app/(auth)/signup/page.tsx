'use client';

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, MessageCircle, ArrowLeft } from '@sureground/icons';
import { formatPhoneForDisplay } from '@sureground/shared';
import {
  SignupDetailsForm,
  type SignupDetails,
} from '@/components/auth/SignupForm/SignupDetailsForm';
import { OtpVerification } from '@/components/auth/SignupForm/OtpVerification';
import { OAuthSignIn } from '@/components/auth/SignIn/methods/OAuthSignIn';
import { AuthAside } from '@/components/auth/AuthAside';
import { AuthMethodTabs } from '@/components/auth/AuthMethodTabs';
import { Logo } from '@/components/ui/Logo';
import { Alert, Button, ThemeToggle } from '@sureground/ui';
import { useSignup } from '@/hooks/useSignup';
import { useSignupStore } from '@/lib/store/signupStore';
import { SIGNUP_METHODS, type SignupMethod, ROUTES } from '@/lib/constants/auth';
import { rememberSignupNext, safeNextPath, withNext } from '@/lib/nextPath';

const noSubscribe = () => () => {};

const CODE_HEADINGS: Record<SignupMethod, string> = {
  email: 'Check your email',
  phone: 'Check your phone',
  whatsapp: 'Check WhatsApp',
};

export default function SignupPage() {
  const router = useRouter();
  const {
    signupData,
    step: storedStep,
    otpReference,
    channel,
    isLoading,
    isResending,
    error,
    clearError,
    precheck,
    sendOtp,
    verifyOtp,
    resendOtp,
    setStep,
    setChannel,
    setData,
  } = useSignup();
  const notice = useSignupStore((state) => state.notice);

  // The draft lives in session storage, which the server render cannot see.
  const mounted = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false
  );
  const search = useSyncExternalStore(
    noSubscribe,
    () => window.location.search,
    () => ''
  );
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const nextPath = safeNextPath(params.get('next'));
  const invitedEmail = params.get('email')?.trim() || undefined;
  // An agency invitation is tied to its email, so that address is not editable.
  const lockedEmail =
    invitedEmail && nextPath?.startsWith('/agency-invite/') ? invitedEmail : undefined;
  const step = mounted && storedStep === 'otp' && otpReference ? 'otp' : 'signup';
  const formChannel = channel === SIGNUP_METHODS.EMAIL ? 'email' : 'phone';

  useEffect(() => {
    if (nextPath) rememberSignupNext(nextPath);
  }, [nextPath]);

  const handleBack = () => {
    clearError();
    if (step === 'otp') setStep('signup');
    else if (window.history.length > 1) router.back();
    else router.push(ROUTES.HOME);
  };

  const handleContinue = async (details: SignupDetails) => {
    setData({
      fullName: details.fullName,
      email: details.email,
      phone: details.phone,
      password: details.password,
      referralCode: details.referralCode,
      method: formChannel,
    });
    const problem = await precheck(details.password, details.referralCode || undefined);
    if (problem) return problem;
    await sendOtp(details.identifier, channel, details.botCheck);
    return null;
  };

  const sentTo =
    formChannel === 'email' ? signupData.email : formatPhoneForDisplay(signupData.phone);

  return (
    <main className="relative flex min-h-screen bg-background">
      <div className="fixed right-4 top-4 z-30 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <AuthAside variant={step === 'otp' ? 'signupCode' : 'signup'} />

      <section className="relative z-10 flex w-full items-center justify-center px-4 py-20 sm:px-8 lg:w-1/2 lg:px-12 lg:py-16">
        <div className="w-full max-w-[32rem] rounded-2xl border border-border bg-card p-6 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.28)] sm:p-9 dark:shadow-[0_24px_80px_-32px_rgba(0,0,0,0.7)]">
          <Button
            variant="outline"
            rounded="lg"
            onClick={handleBack}
            icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
            className="fixed left-4 top-4 z-30 min-h-11 bg-card/90 px-3 font-medium text-muted-foreground backdrop-blur sm:left-6 sm:top-6 lg:static lg:mb-8"
          >
            Back
          </Button>

          <div className="mb-8">
            <div className="mb-6 flex justify-center lg:hidden">
              <Logo size="md" />
            </div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              {step === 'otp' ? 'Step 2 of 3' : 'Step 1 of 3'}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {step === 'otp' ? CODE_HEADINGS[channel] : 'Create your account'}
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {step === 'otp' ? (
                <>
                  We sent a 6-digit code to{' '}
                  <span className="font-medium text-foreground">{sentTo}</span>.
                </>
              ) : (
                'One account for renting, buying, selling and managing property.'
              )}
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-5"
              >
                <Alert
                  variant="danger"
                  action={
                    error.action === 'signin' ? (
                      <Button href={withNext(ROUTES.LOGIN, nextPath)} variant="outline" size="sm">
                        Sign in instead
                      </Button>
                    ) : undefined
                  }
                >
                  {error.message}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {step === 'signup' && notice && !notice.field && !error && (
            <Alert variant="warning" className="mb-5">
              {notice.message}
            </Alert>
          )}

          <AnimatePresence mode="wait">
            {step === 'signup' && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-7">
                  <AuthMethodTabs
                    label="Choose how to get your code"
                    value={channel}
                    onChange={(next) => {
                      clearError();
                      setChannel(next);
                    }}
                    tabs={[
                      { value: SIGNUP_METHODS.EMAIL, label: 'Email', icon: Mail },
                      { value: SIGNUP_METHODS.PHONE, label: 'Phone', icon: Phone },
                      { value: SIGNUP_METHODS.WHATSAPP, label: 'WhatsApp', icon: MessageCircle },
                    ]}
                  />
                </div>

                <SignupDetailsForm
                  key={`${mounted}-${formChannel}`}
                  channel={formChannel}
                  defaults={{
                    fullName: signupData.fullName,
                    email: signupData.email ?? '',
                    phone: signupData.phone ?? '',
                    password: signupData.password,
                    referralCode: signupData.referralCode || params.get('ref')?.toUpperCase() || '',
                  }}
                  lockedEmail={lockedEmail}
                  notice={notice}
                  isLoading={isLoading}
                  onContinue={handleContinue}
                />

                <div className="mt-6">
                  <OAuthSignIn nextPath={nextPath} />
                </div>
              </motion.div>
            )}

            {step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <OtpVerification
                  channel={channel}
                  onSubmit={verifyOtp}
                  onResend={resendOtp}
                  isLoading={isLoading}
                  isResending={isResending}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {step === 'signup' && (
            <p className="mt-7 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <a
                href={withNext(ROUTES.LOGIN, nextPath)}
                className="font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Sign in
              </a>
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
