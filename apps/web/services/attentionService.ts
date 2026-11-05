import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { AttentionItem, AttentionPersona } from '@/types/attention';

const PATH: Record<Exclude<AttentionPersona, 'estate'>, string> = {
  renter: '/renter/assistant/attention',
  landlord: '/landlord/assistant/attention',
  owner: '/owner/assistant/attention',
  buyer: '/buyer/assistant/attention',
  realtor: '/realtor/assistant/attention',
  agent: '/agent/assistant/attention',
  manager: '/agency/assistant/attention',
  resident: '/resident/assistant/attention',
};

export const attentionService = {
  /** "Needs your attention", built by rules from the person's own data. `estateId` is required for an estate. */
  get: (persona: AttentionPersona, estateId?: string) =>
    safeCall<{ items: AttentionItem[] }>(() =>
      authFetch(persona === 'estate' ? `/estate/${estateId}/attention` : PATH[persona])
    ),
};
