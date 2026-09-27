import { emailSignupSchema, identifierSchema, phoneSignupSchema } from '@/lib/validation';

describe('authentication validation', () => {
  it.each(['tenant@getrentos.com', '+234 803 123 4567', '08031234567'])(
    'accepts a supported identifier: %s',
    (identifier) => {
      expect(identifierSchema.safeParse(identifier).success).toBe(true);
    }
  );

  it('rejects malformed identifiers', () => {
    expect(identifierSchema.safeParse('not-an-account').success).toBe(false);
  });

  it('requires accepted terms for email signup', () => {
    const result = emailSignupSchema.safeParse({
      fullName: 'Ada Okafor',
      email: 'ada@getrentos.com',
      password: 'secure-password',
      confirmPassword: 'secure-password',
      acceptedTerms: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toContain('acceptedTerms');
    }
  });

  it('requires matching passwords for email signup', () => {
    const result = emailSignupSchema.safeParse({
      fullName: 'Ada Okafor',
      email: 'ada@getrentos.com',
      password: 'secure-password',
      confirmPassword: 'different-password',
      acceptedTerms: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toContain('confirmPassword');
    }
  });

  it('accepts a valid Nigerian phone signup', () => {
    expect(
      phoneSignupSchema.safeParse({
        fullName: 'Ada Okafor',
        phone: '+234 803 123 4567',
        password: 'secure-password',
        confirmPassword: 'secure-password',
        acceptedTerms: true,
      }).success
    ).toBe(true);
  });
});
