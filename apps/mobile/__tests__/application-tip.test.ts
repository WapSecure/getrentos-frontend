import { applicationSteps, applicationTip } from '@/lib/applicationTip';
import type { AssistantStep } from '@/lib/api/applicationAssistant';

const steps = (overrides: Partial<Record<string, AssistantStep['status']>> = {}): AssistantStep[] =>
  ['complete_profile', 'upload_documents', 'submit_application', 'verification'].map((key) => ({
    key,
    title: key,
    status: overrides[key] ?? 'pending',
  }));

describe('application tip', () => {
  it('never asks a phone-only renter to verify an email', () => {
    const tip = applicationTip({
      steps: steps({ complete_profile: 'in_progress' }),
      phone: '+2348012345678',
      phoneVerified: true,
      identity: 'not_verified',
    });
    expect(tip).toBe(
      'Next, verify your identity. Then your details are ready to send with any application.'
    );
    expect(tip).not.toMatch(/email/i);
    expect(tip).not.toMatch(/—/);
  });

  it('asks for the phone and identity checks still missing', () => {
    expect(
      applicationTip({
        steps: steps(),
        phone: '+234801',
        phoneVerified: false,
        identity: 'not_verified',
      })
    ).toBe(
      'Next, verify your phone number and verify your identity. Then your details are ready to send with any application.'
    );
    expect(applicationTip({ steps: steps(), phone: null, identity: 'verified' })).toMatch(
      /^Next, add a phone number\./
    );
  });

  it('says when the renter is ready, and stays quiet while identity is unknown', () => {
    const base = { steps: steps(), phone: '+234801', phoneVerified: true };
    expect(applicationTip({ ...base, identity: 'verified' })).toMatch(/^You are ready to apply/);
    expect(applicationTip({ ...base, identity: 'unknown' })).toBeNull();
    expect(applicationTip({ ...base, identity: 'in_review' })).toMatch(/being reviewed/);
  });

  it('points at missing documents once an application is in', () => {
    expect(
      applicationTip({
        steps: steps({ submit_application: 'completed', upload_documents: 'in_progress' }),
        phone: '+234801',
        phoneVerified: true,
        identity: 'verified',
      })
    ).toMatch(/^Upload the documents/);
  });

  it('ticks the profile step for a verified phone-only renter', () => {
    const out = applicationSteps({
      steps: steps({ complete_profile: 'in_progress' }),
      phone: '+234801',
      phoneVerified: true,
      identity: 'verified',
    });
    expect(out.find((s) => s.key === 'complete_profile')?.status).toBe('completed');
  });
});
