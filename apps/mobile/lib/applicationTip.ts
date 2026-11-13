import type { AssistantStep } from './api/applicationAssistant';

export type IdentityState = 'verified' | 'in_review' | 'not_verified' | 'unknown';

export interface ApplicationTipInput {
  steps: AssistantStep[];
  phone?: string | null;
  phoneVerified?: boolean;
  identity: IdentityState;
}

const stepStatus = (steps: AssistantStep[], key: string) =>
  steps.find((s) => s.key === key)?.status;

/**
 * The profile step counts an email address, so a renter who signed up with a phone alone could
 * never tick it. Here it is done once their phone and identity are both verified.
 */
export function applicationSteps({
  steps,
  phone,
  phoneVerified,
  identity,
}: ApplicationTipInput): AssistantStep[] {
  const ready = !!phone && !!phoneVerified && identity === 'verified';
  return steps.map((s) =>
    s.key === 'complete_profile' && ready ? { ...s, status: 'completed' } : s
  );
}

/**
 * One plain next step for the renter, built from what we know rather than free text. It only asks
 * for checks the app can do (phone and identity), so a phone-only renter is never told to verify an
 * email address.
 */
export function applicationTip({
  steps,
  phone,
  phoneVerified,
  identity,
}: ApplicationTipInput): string | null {
  if (stepStatus(steps, 'submit_application') === 'completed') {
    if (stepStatus(steps, 'upload_documents') !== 'completed') {
      return 'Upload the documents your application still needs so the landlord can review it.';
    }
    if (stepStatus(steps, 'verification') === 'in_progress') {
      return 'The landlord is reviewing your application. We will tell you when they decide.';
    }
    return null;
  }

  const todo: string[] = [];
  if (!phone) todo.push('add a phone number');
  else if (!phoneVerified) todo.push('verify your phone number');
  if (identity === 'not_verified') todo.push('verify your identity');

  if (todo.length > 0) {
    const first = todo.join(' and ');
    return `Next, ${first}. Then your details are ready to send with any application.`;
  }
  if (identity === 'in_review') {
    return 'Your identity check is being reviewed. We will tell you when it is done.';
  }
  if (identity === 'unknown') return null;
  return 'You are ready to apply. Open a home you like and apply from its page.';
}
