import { authFetch, safeCall } from '@/lib/apiHelpers';
import type {
  EstateChangeOrderInput,
  EstateChangeResponse,
  EstateCommitment,
  EstateCommitmentInput,
  EstateProgressInput,
} from '@/types/landEstateInfrastructure';

const post = <T>(path: string, body?: unknown, method = 'POST') =>
  authFetch<T>(path, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

const ownerPath = (propertyId: string) =>
  `/owner/land/${encodeURIComponent(propertyId)}/layout/infrastructure`;
const buyerPath = (purchaseId: string) =>
  `/buyer/land/purchases/${encodeURIComponent(purchaseId)}/infrastructure`;

export const estateInfrastructureKeys = {
  developer: (propertyId: string) => ['land', 'infrastructure', 'developer', propertyId] as const,
  buyer: (purchaseId: string) => ['land', 'infrastructure', 'buyer', purchaseId] as const,
  public: (layoutId: string) => ['land', 'infrastructure', 'public', layoutId] as const,
};

/** Estate infrastructure promises: the developer's, the buyer's and the public's calls. */
export const landEstateInfrastructureService = {
  // ─── The developer ─────────────────────────────────────────────────────────
  forDeveloper: (propertyId: string) =>
    safeCall(() => authFetch<EstateCommitment[]>(ownerPath(propertyId))),

  create: (propertyId: string, input: EstateCommitmentInput) =>
    safeCall(() => post<EstateCommitment[]>(ownerPath(propertyId), input)),

  edit: (propertyId: string, commitmentId: string, input: Partial<EstateCommitmentInput>) =>
    safeCall(() =>
      post<EstateCommitment[]>(
        `${ownerPath(propertyId)}/${encodeURIComponent(commitmentId)}`,
        input,
        'PATCH'
      )
    ),

  report: (propertyId: string, commitmentId: string, input: EstateProgressInput) =>
    safeCall(() =>
      post<EstateCommitment[]>(
        `${ownerPath(propertyId)}/${encodeURIComponent(commitmentId)}/progress`,
        input
      )
    ),

  proposeChange: (propertyId: string, input: EstateChangeOrderInput) =>
    safeCall(() => post<EstateCommitment[]>(`${ownerPath(propertyId)}/change-orders`, input)),

  // ─── The buyer ─────────────────────────────────────────────────────────────
  forPurchase: (purchaseId: string) =>
    safeCall(() => authFetch<EstateCommitment[]>(buyerPath(purchaseId))),

  respond: (
    purchaseId: string,
    changeOrderId: string,
    response: EstateChangeResponse,
    reason?: string
  ) =>
    safeCall(() =>
      post<EstateCommitment[]>(
        `${buyerPath(purchaseId)}/change-orders/${encodeURIComponent(changeOrderId)}/respond`,
        { response, ...(reason?.trim() ? { reason: reason.trim() } : {}) }
      )
    ),

  dispute: (purchaseId: string, commitmentId: string, reason: string) =>
    safeCall(() =>
      post<EstateCommitment[]>(
        `${buyerPath(purchaseId)}/${encodeURIComponent(commitmentId)}/dispute`,
        { reason: reason.trim() }
      )
    ),

  // ─── Anyone ────────────────────────────────────────────────────────────────
  forEstate: (layoutId: string) =>
    safeCall(() =>
      authFetch<EstateCommitment[]>(`/land/layouts/${encodeURIComponent(layoutId)}/infrastructure`)
    ),
};
