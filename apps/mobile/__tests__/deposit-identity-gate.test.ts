import { depositIdentityNotice } from '@/lib/depositIdentityGate';

describe('depositIdentityNotice', () => {
  it('never blocks while the status has not loaded or failed', () => {
    expect(depositIdentityNotice(undefined)).toBeNull();
  });

  it('lets a verified buyer pay, trusting identityVerified over the old review row', () => {
    expect(depositIdentityNotice({ identityVerified: true })).toBeNull();
    expect(
      depositIdentityNotice({
        identity: { id: 'i', documentType: 'NIN', status: 'APPROVED', submittedAt: '' },
      })
    ).toBeNull();
  });

  it('asks an unverified buyer to verify first, with the way to do it', () => {
    expect(depositIdentityNotice({ identityVerified: false })).toEqual({
      message: 'Verify your identity before you pay a deposit. It takes a few minutes.',
      verifyLink: true,
    });
  });

  it('tells a buyer whose check is in review to wait, without a link', () => {
    const notice = depositIdentityNotice({
      identityVerified: false,
      identity: { id: 'i', documentType: 'NIN', status: 'PENDING_REVIEW', submittedAt: '' },
    });
    expect(notice).toEqual({
      message: 'Your identity check is being reviewed. You can pay the deposit once it clears.',
      verifyLink: false,
    });
  });
});
