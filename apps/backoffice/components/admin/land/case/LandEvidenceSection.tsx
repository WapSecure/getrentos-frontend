'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ConfirmDialog } from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';
import { adminLandService } from '@/services/adminLandService';
import type {
  AdminLandDiligenceDetail,
  LandDiligenceCheckInput,
  LandDiligenceDocument,
  LandDiligenceDocumentLink,
  LandDiligenceDocumentLinkInput,
} from '@/types/land';
import { LandChecksPanel } from './LandChecksPanel';
import { LandCiteDocumentDialog, type CiteTarget } from './LandCiteDocumentDialog';
import { LandDocumentsPanel } from './LandDocumentsPanel';
import { LandUploadDocumentDialog, type LandUploadDocumentInput } from './LandUploadDocumentDialog';
import { useInvalidateLandCase, type LandCasePanelProps } from './shared';

const EDITABLE_STATUSES = new Set(['IN_REVIEW', 'ACTION_REQUIRED']);

/**
 * The checklist and the documents it rests on, side by side in one place so
 * citing a document and passing the check it backs is one flow.
 */
export const LandEvidenceSection = ({
  detail,
  canReview,
  onError,
  onSuccess,
  onResolveUrl,
}: Omit<LandCasePanelProps, 'canApprove'> & {
  detail: AdminLandDiligenceDetail;
  onResolveUrl?: (documentId: string) => Promise<string | null | undefined>;
}) => {
  const { propertyId } = detail;
  const invalidate = useInvalidateLandCase();
  const checks = detail.diligence.checks ?? [];
  const [citeTarget, setCiteTarget] = useState<CiteTarget | null>(null);
  const [stopCiting, setStopCiting] = useState<{
    document: LandDiligenceDocument;
    link: LandDiligenceDocumentLink;
  } | null>(null);
  const [uploadTarget, setUploadTarget] = useState<{ checkKey?: string } | null>(null);

  const recordCheck = useMutation({
    mutationFn: ({ key, input }: { key: string; input: LandDiligenceCheckInput }) =>
      unwrap(adminLandService.recordCheck(propertyId, key, input)),
    onSuccess: () => {
      invalidate();
      onSuccess('Check recorded.');
    },
    onError: (error) => onError(error, 'Unable to record that check.', { versioned: true }),
  });

  const link = useMutation({
    mutationFn: (input: LandDiligenceDocumentLinkInput) =>
      unwrap(adminLandService.linkDiligenceDocument(propertyId, input)),
    onSuccess: () => {
      invalidate();
      setCiteTarget(null);
      onSuccess('Document cited: the review now records what this check rests on.');
    },
    onError: (error) => onError(error, 'Unable to cite that document.'),
  });

  // Upload, then cite when a check was chosen. A failed citation leaves the
  // upload in place (it is on the property) and says so.
  const upload = useMutation({
    mutationFn: async ({ checklistKey, note, ...file }: LandUploadDocumentInput) => {
      const document = await unwrap(adminLandService.uploadDocument(propertyId, file));
      if (!checklistKey) return { document, citeError: null };
      try {
        await unwrap(
          adminLandService.linkDiligenceDocument(propertyId, {
            documentId: document.id,
            checklistKey,
            note,
          })
        );
        return { document, citeError: null };
      } catch (citeError) {
        return { document, citeError };
      }
    },
    onSuccess: ({ document, citeError }, { checklistKey }) => {
      invalidate();
      setUploadTarget(null);
      if (citeError) {
        onError(citeError, `${document.name} was uploaded but could not be cited.`);
      } else {
        onSuccess(
          checklistKey
            ? `${document.name} uploaded and cited.`
            : `${document.name} uploaded. Cite it to rest a check on it.`
        );
      }
    },
    onError: (error) => onError(error, 'Unable to upload that document.'),
  });

  const unlink = useMutation({
    mutationFn: ({
      documentId,
      checklistKey,
    }: {
      documentId: string;
      checklistKey: string | null;
    }) => unwrap(adminLandService.unlinkDiligenceDocument(propertyId, documentId, checklistKey)),
    onSuccess: () => {
      invalidate();
      onSuccess('Document is no longer cited. The owner’s file has not been removed.');
    },
    onError: (error) => onError(error, 'Unable to stop citing that document.'),
  });

  return (
    <>
      <LandChecksPanel
        checks={checks}
        templateVersion={detail.diligence.templateVersion}
        policyPack={detail.diligence.policyPack}
        editable={EDITABLE_STATUSES.has(String(detail.diligence.status))}
        canReview={canReview}
        savingKey={recordCheck.isPending ? (recordCheck.variables?.key ?? null) : null}
        onSave={async (key, status, note) => {
          try {
            await recordCheck.mutateAsync({
              key,
              input: {
                status,
                note: note || undefined,
                expectedVersion: detail.diligence.version,
              },
            });
            return true;
          } catch {
            return false;
          }
        }}
        onCite={(checkKey) => setCiteTarget({ checkKey })}
      />

      <LandDocumentsPanel
        documents={detail.documents}
        checks={checks}
        canReview={canReview}
        onCite={(documentId) => setCiteTarget({ documentId })}
        onStopCiting={(document, link) => setStopCiting({ document, link })}
        onUpload={() => setUploadTarget({})}
        unlinkingId={
          unlink.isPending && unlink.variables
            ? `${unlink.variables.documentId}:${unlink.variables.checklistKey ?? ''}`
            : null
        }
        onResolveUrl={onResolveUrl}
      />

      <LandCiteDocumentDialog
        key={citeTarget ? `${citeTarget.documentId ?? ''}:${citeTarget.checkKey ?? ''}` : 'closed'}
        target={citeTarget}
        onClose={() => setCiteTarget(null)}
        documents={detail.documents}
        checks={checks}
        onSubmit={(input) => link.mutate(input)}
        isPending={link.isPending}
        onResolveUrl={onResolveUrl}
        onUploadInstead={
          canReview
            ? (checkKey) => {
                setCiteTarget(null);
                setUploadTarget({ checkKey });
              }
            : undefined
        }
      />

      <LandUploadDocumentDialog
        key={uploadTarget ? `upload:${uploadTarget.checkKey ?? ''}` : 'upload-closed'}
        target={uploadTarget}
        onClose={() => setUploadTarget(null)}
        checks={checks}
        onSubmit={(input) => upload.mutate(input)}
        isPending={upload.isPending}
      />

      <ConfirmDialog
        open={Boolean(stopCiting)}
        onOpenChange={(open) => !open && setStopCiting(null)}
        title="Stop citing this document?"
        description={`${stopCiting?.document.name ?? 'This document'} will no longer back ${
          stopCiting?.link.checklistKey
            ? `the "${
                checks.find((check) => check.key === stopCiting.link.checklistKey)?.label ??
                stopCiting.link.checklistKey
              }" check`
            : 'the review'
        }. Any other checks it is cited on keep it. A passed check that needs evidence will then block approval until another document is cited.`}
        confirmLabel="Stop citing"
        isLoading={unlink.isPending}
        onConfirm={async () => {
          if (stopCiting)
            await unlink
              .mutateAsync({
                documentId: stopCiting.document.id,
                checklistKey: stopCiting.link.checklistKey ?? null,
              })
              .catch(() => undefined);
        }}
      />
    </>
  );
};
