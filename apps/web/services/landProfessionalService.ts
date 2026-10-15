import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { ApplyLandProfessionalInput, LandProfessional } from '@/types/landProfessional';

export const landProfessionalKeys = {
  mine: ['land', 'professionals', 'me'] as const,
};

/** The professional's own accreditation records. */
export const landProfessionalService = {
  mine: () => safeCall(() => authFetch<LandProfessional[]>('/land/professionals/me')),

  /** Multipart: the licence or practising certificate goes up with the application. */
  apply: (input: ApplyLandProfessionalInput) => {
    const form = new FormData();
    form.append('role', input.role);
    form.append('licenceNumber', input.licenceNumber.trim());
    form.append('practiceStates', JSON.stringify(input.practiceStates));
    if (input.regulator?.trim()) form.append('regulator', input.regulator.trim());
    if (input.licenceExpiresAt) form.append('licenceExpiresAt', input.licenceExpiresAt);
    if (input.insurer?.trim()) form.append('insurer', input.insurer.trim());
    if (input.insuranceExpiresAt) form.append('insuranceExpiresAt', input.insuranceExpiresAt);
    if (input.file) form.append('file', input.file);
    return safeCall(() =>
      authFetch<LandProfessional>('/land/professionals/apply', { method: 'POST', body: form })
    );
  },

  appeal: (professionalId: string, reason: string) =>
    safeCall(() =>
      authFetch<LandProfessional[]>(
        `/land/professionals/${encodeURIComponent(professionalId)}/appeal`,
        { method: 'POST', body: JSON.stringify({ reason: reason.trim() }) }
      )
    ),
};
