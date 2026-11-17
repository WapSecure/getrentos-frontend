'use client';

import { useEffect, useId, useState, type BaseSyntheticEvent } from 'react';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Eye, EyeOff, Gift, Lock, Mail, Phone, User } from '@sureground/icons';
import { Button, Checkbox, Field, IconButton, Input } from '@sureground/ui';
import { toE164Phone, type OtpBotCheck } from '@sureground/shared';
import {
  SIGNUP_PASSWORD_HINT,
  signupDetailsSchema,
  type SignupDetailsData,
} from '@/lib/validations/auth';
import type { StepOneNotice } from '@/lib/store/signupStore';

export interface SignupDetails {
  fullName: string;
  /** What the person typed, kept for going back. */
  email: string;
  phone: string;
  /** The address the code goes to: the email, or the phone number in +234 form. */
  identifier: string;
  password: string;
  referralCode: string;
  botCheck: OtpBotCheck;
}

interface SignupDetailsFormProps {
  channel: 'email' | 'phone';
  defaults: Omit<SignupDetails, 'identifier' | 'botCheck'>;
  /** Set when an invitation fixed the email: shown, not editable. */
  lockedEmail?: string;
  notice: StepOneNotice | null;
  isLoading: boolean;
  /** Resolves with a field problem to show, or null when the code went out. */
  onContinue: (details: SignupDetails) => Promise<StepOneNotice | null>;
}

const FIELD_ORDER = ['fullName', 'email', 'phone', 'password', 'referralCode', 'terms'] as const;

export const SignupDetailsForm = ({
  channel,
  defaults,
  lockedEmail,
  notice,
  isLoading,
  onContinue,
}: SignupDetailsFormProps) => {
  const termsId = useId();
  const [showPassword, setShowPassword] = useState(false);
  const [showReferral, setShowReferral] = useState(
    Boolean(defaults.referralCode) || notice?.field === 'referralCode'
  );
  // Same clock as an event's timeStamp.
  const [openedAt] = useState(() => performance.now());

  const {
    register,
    handleSubmit,
    control,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<SignupDetailsData>({
    resolver: zodResolver(signupDetailsSchema(channel)),
    mode: 'onTouched',
    defaultValues: {
      fullName: defaults.fullName,
      email: lockedEmail ?? defaults.email,
      phone: defaults.phone,
      password: defaults.password,
      referralCode: defaults.referralCode,
      terms: false,
    },
  });

  const fieldFor = (problem: StepOneNotice) =>
    problem.field === 'contact' ? (channel === 'email' ? 'email' : 'phone') : problem.field;

  const showFieldNotice = (problem: StepOneNotice) => {
    const field = fieldFor(problem);
    if (!field) return;
    if (field === 'referralCode') setShowReferral(true);
    setError(field, { type: 'server', message: problem.message });
    // The referral field may only just have opened.
    requestAnimationFrame(() => setFocus(field));
  };

  // A notice handed back from a later step; the referral field already starts open for it.
  useEffect(() => {
    const field = notice ? fieldFor(notice) : undefined;
    if (!notice || !field) return;
    setError(field, { type: 'server', message: notice.message });
    setFocus(field);
    // Once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onValid = async (values: SignupDetailsData, event?: BaseSyntheticEvent) => {
    const form = event?.target instanceof HTMLFormElement ? new FormData(event.target) : null;
    const identifier =
      channel === 'email' ? values.email.trim() : (toE164Phone(values.phone) ?? values.phone);
    const problem = await onContinue({
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone: values.phone,
      identifier,
      password: values.password,
      referralCode: values.referralCode.trim().toUpperCase(),
      botCheck: {
        website: String(form?.get('website') ?? '') || undefined,
        formElapsedMs: event ? Math.round(event.timeStamp - openedAt) : undefined,
      },
    });
    if (problem) showFieldNotice(problem);
  };

  // The checkbox is not a native input, so the form cannot focus it on its own.
  const onInvalid = (invalid: FieldErrors<SignupDetailsData>) => {
    const first = FIELD_ORDER.find((name) => invalid[name]);
    if (first === 'referralCode') setShowReferral(true);
    if (first === 'terms') document.getElementById(termsId)?.focus();
  };

  return (
    <form
      method="post"
      noValidate
      onSubmit={handleSubmit(onValid, onInvalid)}
      className="space-y-5"
    >
      {/* Off-screen rather than display:none, which bots skip; people and screen readers never reach it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <Field label="Full name" error={errors.fullName?.message}>
        <Input
          type="text"
          autoComplete="name"
          {...register('fullName')}
          leadingIcon={<User className="h-4 w-4" aria-hidden="true" />}
          inputClassName="py-3"
          placeholder="Chinedu Okafor"
        />
      </Field>

      {channel === 'email' ? (
        <Field
          label="Email address"
          error={errors.email?.message}
          hint={lockedEmail ? 'This is the address your invitation was sent to.' : undefined}
        >
          <Input
            type="email"
            autoComplete="email"
            readOnly={Boolean(lockedEmail)}
            {...register('email')}
            leadingIcon={<Mail className="h-4 w-4" aria-hidden="true" />}
            inputClassName="py-3"
            placeholder="you@example.com"
          />
        </Field>
      ) : (
        <Field
          label="Phone number"
          error={errors.phone?.message}
          hint="Nigerian numbers get +234 added. For another country, start with its code."
        >
          <Input
            type="tel"
            autoComplete="tel"
            {...register('phone')}
            leadingIcon={<Phone className="h-4 w-4" aria-hidden="true" />}
            inputClassName="py-3"
            placeholder="0803 123 4567"
          />
        </Field>
      )}

      <Field label="Password" error={errors.password?.message} hint={SIGNUP_PASSWORD_HINT}>
        <Input
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          {...register('password')}
          leadingIcon={<Lock className="h-4 w-4" aria-hidden="true" />}
          inputClassName="py-3"
          placeholder="Create a password"
          trailingIcon={
            <IconButton
              size="lg"
              className="-my-2 -mr-3"
              label={showPassword ? 'Hide password' : 'Show password'}
              icon={showPassword ? <EyeOff /> : <Eye />}
              onClick={() => setShowPassword(!showPassword)}
            />
          }
        />
      </Field>

      {showReferral ? (
        <Field
          label="Referral code"
          optionalLabel="(optional)"
          error={errors.referralCode?.message}
        >
          <Input
            type="text"
            autoCapitalize="characters"
            autoComplete="off"
            {...register('referralCode')}
            leadingIcon={<Gift className="h-4 w-4" aria-hidden="true" />}
            inputClassName="py-3 uppercase"
            placeholder="A friend's code"
          />
        </Field>
      ) : (
        <Button
          type="button"
          variant="ghost"
          rounded="lg"
          className="-ml-3 text-primary"
          onClick={() => {
            setShowReferral(true);
            requestAnimationFrame(() => setFocus('referralCode'));
          }}
        >
          Have a referral code?
        </Button>
      )}

      <Controller
        control={control}
        name="terms"
        render={({ field, fieldState }) => (
          <div className="flex min-h-11 flex-col justify-center [&_[role=checkbox]]:relative [&_[role=checkbox]]:after:absolute [&_[role=checkbox]]:after:-inset-3">
            <Checkbox
              id={termsId}
              checked={field.value}
              onCheckedChange={(checked) => {
                field.onChange(checked);
                field.onBlur();
              }}
              invalid={Boolean(fieldState.error)}
              aria-describedby={fieldState.error ? `${termsId}-error` : undefined}
              label={
                <span className="text-sm font-normal text-muted-foreground">
                  I agree to the{' '}
                  <a
                    href="/terms"
                    onClick={(e) => e.stopPropagation()}
                    className="text-primary underline underline-offset-4 hover:text-primary-hover"
                  >
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a
                    href="/privacy"
                    onClick={(e) => e.stopPropagation()}
                    className="text-primary underline underline-offset-4 hover:text-primary-hover"
                  >
                    Privacy Policy
                  </a>
                </span>
              }
            />
            {fieldState.error && (
              <p
                id={`${termsId}-error`}
                role="alert"
                className="mt-1.5 pl-8 text-xs leading-5 text-destructive"
              >
                {fieldState.error.message}
              </p>
            )}
          </div>
        )}
      />

      <Button
        type="submit"
        isLoading={isLoading}
        fullWidth
        size="lg"
        rounded="lg"
        icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
        iconPosition="right"
      >
        Continue
      </Button>
    </form>
  );
};
