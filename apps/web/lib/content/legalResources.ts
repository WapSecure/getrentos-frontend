export type LegalResourceCategory = 'rights' | 'notice_periods' | 'deposits' | 'eviction_process';

export interface LegalResource {
  id: string;
  category: LegalResourceCategory;
  title: string;
  state?: string;
  body: string[];
  source: string;
}

/**
 * Reference guidance only — not legal advice. Each entry's `source` is
 * deliberately framed as "verify with local regulations", matching the
 * same non-authoritative stance as the rent-increase checker in
 * shared/compliance/rent-increase-rules.ts on the backend.
 */
export const LEGAL_RESOURCES: LegalResource[] = [
  {
    id: 'general-tenant-rights',
    category: 'rights',
    title: 'General tenant rights in Nigeria',
    body: [
      'A tenant is generally entitled to quiet enjoyment of the property for the duration of a valid lease or tenancy agreement.',
      'A landlord typically cannot change locks, disconnect utilities, or remove a tenant’s belongings without following a lawful process — this is often called "self-help eviction" and is broadly restricted.',
      'A tenant is usually entitled to receive proper written notice before a tenancy is terminated, with the required notice period depending on the tenancy type and state.',
    ],
    source:
      'Reference guidance only, summarizing common provisions across Nigerian state tenancy laws — verify the specific rules for your state before relying on this.',
  },
  {
    id: 'lagos-notice-periods',
    category: 'notice_periods',
    title: 'Typical notice periods before a tenancy can end',
    state: 'Lagos',
    body: [
      'A monthly tenancy commonly requires about one month’s notice.',
      'A yearly tenancy commonly requires about six months’ notice.',
      'These figures are commonly cited under Lagos State Tenancy Law provisions, but exact requirements can depend on the specific tenancy terms and how the tenancy was created.',
    ],
    source:
      'Reference guidance based on commonly-cited Lagos State Tenancy Law provisions — verify with local regulations before relying on this.',
  },
  {
    id: 'general-notice-periods',
    category: 'notice_periods',
    title: 'Notice periods outside Lagos',
    body: [
      'Notice-period requirements vary by state, and this platform does not currently have verified reference data for most states.',
      'A common general convention is at least 30 days’ written notice, but always confirm against your specific state’s tenancy law and your lease agreement’s own terms.',
    ],
    source:
      'No state-specific reference data is configured for most states yet. Showing a general 30-day notice convention only — verify local regulations before relying on this.',
  },
  {
    id: 'deposit-return-norms',
    category: 'deposits',
    title: 'Security deposit return norms',
    body: [
      'A security deposit is generally intended to cover damage beyond normal wear and tear, not routine maintenance or expected depreciation.',
      'A landlord is generally expected to document the condition of a unit at move-in and move-out — this is exactly what this platform’s inspection acknowledgement feature is designed to support, since dated, agreed-upon condition records are usually the strongest evidence in a deposit dispute.',
      'Timelines and processes for returning a deposit, or itemizing deductions, vary by state and by the specific lease agreement.',
    ],
    source:
      'Reference guidance only, summarizing common practice — verify the specific rules for your state and the terms of your lease before relying on this.',
  },
  {
    id: 'eviction-process-overview',
    category: 'eviction_process',
    title: 'What a lawful eviction process generally involves',
    body: [
      'A lawful eviction typically requires the landlord to first serve valid written notice, then allow any applicable notice or cure period to run.',
      'If the tenancy still has not ended, a landlord is generally expected to apply to a court or tribunal for a possession order rather than removing the tenant directly.',
      'A tenant who receives an eviction notice generally retains the right to seek legal advice and, where applicable, to respond or contest the process through the courts.',
    ],
    source:
      'Reference guidance only, summarizing a common general process — verify the specific rules for your state, and consult a qualified legal professional if you are facing an active eviction case.',
  },
];
