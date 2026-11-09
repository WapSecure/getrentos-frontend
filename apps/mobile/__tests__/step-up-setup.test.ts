import {
  addPasskeyWithEmailedCode,
  emailedProofReady,
  isCurrentPin,
  isNewPin,
  newPinReady,
  pinsMismatch,
  transactionPinBody,
  type PasskeySetupDeps,
} from '@/lib/stepUpSetup';

describe('PIN checks', () => {
  it('takes six digits for a new PIN', () => {
    expect(isNewPin('123456')).toBe(true);
    expect(isNewPin('1234')).toBe(false);
    expect(isNewPin('12345a')).toBe(false);
  });

  it('still accepts an older four-digit PIN as the current one', () => {
    expect(isCurrentPin('1234')).toBe(true);
    expect(isCurrentPin('123456')).toBe(true);
    expect(isCurrentPin('12345')).toBe(false);
  });

  it('only says the PINs differ once the confirmation is complete', () => {
    expect(pinsMismatch('123456', '12')).toBe(false);
    expect(pinsMismatch('123456', '123457')).toBe(true);
    expect(newPinReady('123456', '123456')).toBe(true);
    expect(newPinReady('123456', '123457')).toBe(false);
  });

  it('needs the password only when the account has one', () => {
    const base = { password: '', reference: 'ref', code: '123456' };
    expect(emailedProofReady({ ...base, needsPassword: true })).toBe(false);
    expect(emailedProofReady({ ...base, needsPassword: false })).toBe(true);
    expect(emailedProofReady({ ...base, needsPassword: false, reference: null })).toBe(false);
    expect(emailedProofReady({ ...base, needsPassword: false, code: '123' })).toBe(false);
  });
});

describe('transactionPinBody', () => {
  it('changes a PIN with the password and the current PIN', () => {
    expect(
      transactionPinBody({
        password: 'pw',
        pin: '654321',
        currentPin: '1234',
        reference: 'ref',
        code: '111111',
      })
    ).toEqual({ currentPassword: 'pw', pin: '654321', currentPin: '1234' });
  });

  it('sets a first or forgotten PIN with the emailed code', () => {
    expect(
      transactionPinBody({ password: 'pw', pin: '654321', reference: 'ref', code: '111111' })
    ).toEqual({ currentPassword: 'pw', pin: '654321', reference: 'ref', code: '111111' });
  });

  it('leaves the password out for an account without one', () => {
    expect(transactionPinBody({ pin: '654321', reference: 'ref', code: '111111' })).toEqual({
      pin: '654321',
      reference: 'ref',
      code: '111111',
    });
  });
});

describe('addPasskeyWithEmailedCode', () => {
  const deps = (overrides: Partial<PasskeySetupDeps> = {}) => {
    const calls: string[] = [];
    const d: PasskeySetupDeps = {
      confirmStepUp: jest.fn(async () => {
        calls.push('step-up');
        return { stepUpToken: 'setup-tok', expiresIn: 300 };
      }),
      rememberStepUpToken: jest.fn(() => {
        calls.push('remember');
      }),
      startPasskeyRegistration: jest.fn(async () => {
        calls.push('options');
        return { challenge: 'c' };
      }),
      registerPasskey: jest.fn(async () => {
        calls.push('register');
        return { id: 'cred' };
      }),
      finishPasskeyRegistration: jest.fn(async () => {
        calls.push('verify');
        return { hasPasskey: true };
      }),
      clearStepUpToken: jest.fn(() => {
        calls.push('clear');
      }),
      ...overrides,
    };
    return { d, calls };
  };

  it('earns a set-up token, registers the passkey with it, then drops it', async () => {
    const { d, calls } = deps();
    await addPasskeyWithEmailedCode(d, {
      password: 'pw',
      reference: 'ref',
      code: '123456',
      deviceName: 'This phone',
    });
    expect(d.confirmStepUp).toHaveBeenCalledWith({
      password: 'pw',
      reference: 'ref',
      code: '123456',
    });
    expect(d.rememberStepUpToken).toHaveBeenCalledWith('setup-tok', 300);
    expect(d.finishPasskeyRegistration).toHaveBeenCalledWith({ id: 'cred' }, 'This phone');
    expect(calls).toEqual(['step-up', 'remember', 'options', 'register', 'verify', 'clear']);
  });

  it('sends no password for an account without one', async () => {
    const { d } = deps();
    await addPasskeyWithEmailedCode(d, { reference: 'ref', code: '123456' });
    expect(d.confirmStepUp).toHaveBeenCalledWith({ reference: 'ref', code: '123456' });
  });

  it('drops the set-up token even when the passkey prompt is cancelled', async () => {
    const { d, calls } = deps({
      registerPasskey: jest.fn(async () => {
        throw new Error('cancelled');
      }),
    });
    await expect(
      addPasskeyWithEmailedCode(d, { password: 'pw', reference: 'ref', code: '123456' })
    ).rejects.toThrow('cancelled');
    expect(calls).toContain('clear');
    expect(d.finishPasskeyRegistration).not.toHaveBeenCalled();
  });
});

describe('second-factor codes', () => {
  const { cleanSecondFactorInput, isSecondFactorCode } =
    jest.requireActual<typeof import('@sureground/shared')>('@sureground/shared');

  it.each([
    ['123456', true],
    ['k7m2p-x9q4t', true],
    ['K7M2PX9Q4T', true],
    ['12345', false],
    ['k7m2p-x9q4', false],
    ['k7m2p_x9q4t', false],
  ])('%s → %s', (code, ok) => expect(isSecondFactorCode(code)).toBe(ok));

  it('keeps only what a code can contain, so a pasted code with spaces still works', () => {
    expect(cleanSecondFactorInput(' k7m2p - x9q4t\n')).toBe('k7m2p-x9q4t');
    expect(cleanSecondFactorInput('k7m2p-x9q4t-extra')).toBe('k7m2p-x9q4t');
  });
});
