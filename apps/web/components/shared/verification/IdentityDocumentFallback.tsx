'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, DocumentUpload, Field, Select } from '@sureground/ui';
import {
  kycService,
  IDENTITY_DOCUMENT_TYPES,
  type IdentityDocumentType,
} from '@/services/kycService';
import { unwrap } from '@/lib/apiHelpers';
import { trustKeys } from '@/lib/queryKeys';

const DOCUMENT_TYPE_LABELS: Record<IdentityDocumentType, string> = {
  NATIONAL_ID: 'National ID',
  PASSPORT: 'International passport',
  DRIVERS_LICENSE: "Driver's Licence",
  VOTERS_CARD: "Voter's Card",
  NIN: 'NIN slip',
  BVN: 'BVN',
};

/**
 * The manual identity route, for people who cannot use their NIN: an ID
 * document checked by our team. It never verifies on its own: a live selfie is
 * still required (security gap ID-16), and there is no photo "selfie" upload,
 * because an uploaded photo is not a liveness check. Hidden once identity is
 * verified or while a document is already with our team.
 */
export function IdentityDocumentFallback() {
  const queryClient = useQueryClient();
  const [documentType, setDocumentType] = useState<IdentityDocumentType>('NATIONAL_ID');
  const [document, setDocument] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: status } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: () => unwrap(kycService.getStatus()),
  });

  const submit = useMutation({
    mutationFn: () => unwrap(kycService.submitIdentity({ documentType, document: document! })),
    onSuccess: () => {
      setDocument(null);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['kyc-status'] });
      queryClient.invalidateQueries({ queryKey: trustKeys.all });
    },
    onError: (reason) =>
      setError(reason instanceof Error ? reason.message : 'Unable to submit your document.'),
  });

  if (!status) return null;
  const identity = status.identity;
  const verified = status.identityVerified ?? identity?.status === 'APPROVED';
  const canSubmit =
    !verified &&
    (!identity || identity.status === 'REJECTED' || identity.status === 'NEEDS_CLARIFICATION');
  if (!canSubmit) return null;

  return (
    <details className="group rounded-xl border border-border bg-card">
      <summary className="cursor-pointer list-none rounded-xl px-4 py-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/12">
        Can&apos;t use your NIN?
        <span className="ml-1 font-normal text-muted-foreground">
          Upload an ID document instead
        </span>
      </summary>
      <div className="space-y-4 border-t border-border px-4 py-4">
        <Alert variant="info">
          Our team checks your document by hand. You will still need to take a live selfie: a
          document alone does not verify you.
        </Alert>
        <Field label="Document type">
          <Select
            value={documentType}
            onValueChange={(value) => setDocumentType(value as IdentityDocumentType)}
            options={IDENTITY_DOCUMENT_TYPES.map((type) => ({
              value: type,
              label: DOCUMENT_TYPE_LABELS[type],
            }))}
            ariaLabel="Identity document type"
          />
        </Field>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Document photo</label>
          <DocumentUpload
            checkPhotoQuality
            value={document ? [{ id: 'document', file: document }] : []}
            onChange={(items) => setDocument(items[0]?.file ?? null)}
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            multiple={false}
            label=""
            hint="PDF or image: preview before submitting"
          />
        </div>
        {error && <Alert variant="danger">{error}</Alert>}
        <Button
          variant="secondary"
          onClick={() => submit.mutate()}
          disabled={!document}
          isLoading={submit.isPending}
          loadingText="Submitting…"
        >
          Submit document for review
        </Button>
      </div>
    </details>
  );
}
