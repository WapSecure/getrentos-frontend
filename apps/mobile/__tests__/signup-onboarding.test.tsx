import { fireEvent, screen } from '@testing-library/react-native';
import { OtpInput } from '@sureground/ui-native';
import { ApiError } from '@/lib/api/client';
import { authApi } from '@/lib/api/auth';
import {
  apiErrorCode,
  codeSendErrorCopy,
  precheckSignup,
  signupFieldIssue,
} from '@/lib/auth/signupErrors';
import { parseSignupDraft, SIGNUP_DRAFT_TTL_MS } from '@/lib/auth/signupDraft';
import { SIGNUP_ROLES, VERIFICATION_LABEL } from '@/lib/roles';
import { emailStepOneSchema, phoneStepOneSchema } from '@/lib/validation';
import { renderWithTheme } from './helpers/a11y';

jest.mock('@/lib/env', () => ({ env: { apiUrl: 'https://api.test', clientApp: 'mobile' } }));
jest.mock('@/lib/api/auth', () => ({ authApi: { signupPrecheck: jest.fn() } }));

const precheck = authApi.signupPrecheck as jest.Mock;
const refusal = (status: number, body: Record<string, unknown>) =>
  new ApiError(String(body.message ?? ''), status, body.error as string | undefined, body);

describe('sign-up precheck (contract 1)', () => {
  beforeEach(() => precheck.mockReset());

  it('puts a breached password on the password field', async () => {
    precheck.mockRejectedValue(
      refusal(400, { code: 'PASSWORD_BREACHED', field: 'password', message: 'Breached.' })
    );
    await expect(precheckSignup({ password: 'x'.repeat(12) }, 'email')).resolves.toEqual({
      field: 'password',
      message: expect.stringContaining('data breach'),
    });
  });

  it('puts an unknown referral code on the referral field', async () => {
    precheck.mockRejectedValue(refusal(400, { code: 'REFERRAL_INVALID', field: 'referralCode' }));
    await expect(precheckSignup({ referralCode: 'NOPE' }, 'phone')).resolves.toMatchObject({
      field: 'referralCode',
    });
  });

  it.each([
    ['an older API without the route', refusal(404, { message: 'Cannot POST' })],
    ['no connection', new ApiError('Network request failed.', 0)],
    ['throttling', refusal(429, { message: 'Too many requests' })],
  ])('lets sign-up carry on with %s', async (_label, err) => {
    precheck.mockRejectedValue(err);
    await expect(precheckSignup({ password: 'x'.repeat(12) }, 'email')).resolves.toBeNull();
  });
});

describe('sign-up refusal codes (contract 4)', () => {
  it('reads the new `code` before the older `error` field', () => {
    expect(apiErrorCode(refusal(409, { code: 'ACCOUNT_EXISTS', error: 'Conflict' }))).toBe(
      'ACCOUNT_EXISTS'
    );
    expect(apiErrorCode(refusal(400, { error: 'Bad Request' }))).toBe('Bad Request');
  });

  it('turns an existing account into an identifier error that offers sign-in', () => {
    expect(signupFieldIssue(refusal(409, { code: 'ACCOUNT_EXISTS' }), 'phone')).toEqual({
      field: 'identifier',
      message: 'An account already uses this phone number.',
      accountExists: true,
    });
    // An API from before the code was added still answers 409.
    expect(signupFieldIssue(refusal(409, { error: 'Conflict' }), 'email')).toMatchObject({
      accountExists: true,
    });
  });

  it('words the code-sending limits with the wait the server gives', () => {
    expect(
      codeSendErrorCopy(refusal(429, { code: 'RESEND_TOO_SOON', retryAfterSeconds: 21 }), 'x')
    ).toBe('Wait 21 seconds before asking for another code.');
    expect(
      codeSendErrorCopy(refusal(429, { code: 'TOO_MANY_CODES', retryAfterSeconds: 3000 }), 'x')
    ).toBe('Too many codes sent. Try again in 50 minutes.');
  });
});

describe('saved sign-up draft', () => {
  const draft = {
    method: 'email',
    otpMethod: 'email',
    fullName: 'Ada Okafor',
    identifier: 'ada@getsureground.io',
    otpReference: 'ref-1',
    sentAt: 1_000_000,
  };

  it('restores a draft inside ten minutes and never carries a password', () => {
    const raw = JSON.stringify({ ...draft, password: 'should-not-survive' });
    const parsed = parseSignupDraft(raw, draft.sentAt + SIGNUP_DRAFT_TTL_MS - 1);
    expect(parsed).toMatchObject({ identifier: 'ada@getsureground.io', verified: false });
    expect(parsed).not.toHaveProperty('password');
  });

  it('drops an expired or malformed draft', () => {
    expect(parseSignupDraft(JSON.stringify(draft), draft.sentAt + SIGNUP_DRAFT_TTL_MS + 1)).toBe(
      null
    );
    expect(parseSignupDraft('{not json', draft.sentAt)).toBeNull();
    expect(parseSignupDraft(JSON.stringify({ ...draft, method: 'fax' }), draft.sentAt)).toBeNull();
  });
});

describe('step 1 validation', () => {
  const base = {
    fullName: 'Ada Okafor',
    email: '',
    password: 'a long pass phrase',
    acceptedTerms: true,
  };

  it.each(['0803 123 4567', '+234 803 123 4567', '803-123-4567'])(
    'accepts the Nigerian number %s',
    (phone) => {
      expect(phoneStepOneSchema.safeParse({ ...base, phone }).success).toBe(true);
    }
  );

  it('rejects a number that cannot be dialled, with the shared wording', () => {
    const result = phoneStepOneSchema.safeParse({ ...base, phone: '12345' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toMatch(/0803 123 4567/);
  });

  it('ignores the phone field when signing up with email', () => {
    expect(
      emailStepOneSchema.safeParse({ ...base, email: 'ada@getsureground.io', phone: 'n/a' }).success
    ).toBe(true);
  });
});

describe('role choices', () => {
  it('offers the seven public roles from the shared list, in order', () => {
    expect(SIGNUP_ROLES.map((r) => r.id)).toEqual([
      'renter',
      'landlord',
      'owner',
      'buyer',
      'realtor',
      'agent',
      'estate',
    ]);
  });

  it('words requirements as what each role needs', () => {
    expect(Object.values(VERIFICATION_LABEL)).toEqual([
      'Needs ID check',
      'Needs property documents',
      'Needs licence',
    ]);
  });
});

describe('OtpInput', () => {
  it('is one labelled input that strips non-digits and completes at six', async () => {
    const onChange = jest.fn();
    const onComplete = jest.fn();
    await renderWithTheme(<OtpInput value="" onChange={onChange} onComplete={onComplete} />);

    const inputs = screen.getAllByLabelText('Verification code, 6 digits');
    expect(inputs).toHaveLength(1);
    await fireEvent.changeText(inputs[0], '12 34-56');
    expect(onChange).toHaveBeenCalledWith('123456');
    expect(onComplete).toHaveBeenCalledWith('123456');
  });
});
