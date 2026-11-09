'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IdCard, ShieldAlert } from '@sureground/icons';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Skeleton,
} from '@sureground/ui';
import { estateService } from '@/services/estateService';
import { unwrapOptional } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';

// Fetched per pass, never on the list, so identity documents aren't signed for every row; the server decides who may view them.
export const IdCheckDialog = ({
  estateId,
  passId,
  visitorName,
}: {
  estateId: string;
  passId: string;
  visitorName: string;
}) => {
  const [open, setOpen] = useState(false);

  const checkQuery = useQuery({
    queryKey: estateKeys.visitorIdCheck(estateId, passId),
    /** `unwrapOptional`, not `unwrap`: Nest answers null with an empty 200, which react-query rejects as undefined. */
    queryFn: () => unwrapOptional(estateService.getVisitorIdCheck(estateId, passId), null),
    enabled: open,
  });

  const check = checkQuery.data;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <IdCard className="mr-1.5 h-3.5 w-3.5" />
        ID
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg p-6">
          <DialogTitle className="pr-8 text-xl font-semibold tracking-[-0.02em] text-foreground">
            Identity document
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm leading-6 text-muted-foreground">
            {visitorName}&rsquo;s document, as recorded at the barrier.
          </DialogDescription>

          <div className="mt-6 space-y-5">
            <Alert variant="neutral" icon={ShieldAlert}>
              <p className="text-xs leading-5">
                Recording a document does not admit anybody, and a visitor who showed none was still
                admitted on their pass. This is a record of who was at the gate, for the estate to
                look back at if an arrival is ever questioned.
              </p>
            </Alert>

            {checkQuery.isLoading ? (
              <Skeleton className="h-48 w-full rounded-2xl" />
            ) : checkQuery.isError ? (
              <Alert variant="danger">That record could not be read just now.</Alert>
            ) : !check ? (
              <p className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                No identity document was recorded for this visit. This does not mean the check
                failed. The estate does not require one, and this visit was admitted on its pass.
              </p>
            ) : (
              <>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{check.documentTypeLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    Recorded {new Date(check.checkedAt).toLocaleString()}
                    {check.checkedByName ? ` by ${check.checkedByName}` : ''}
                  </p>
                </div>

                {check.documentUrl ? (
                  /* Plain <img>, not next/image: a short-lived signed URL to an identity document must not be cached by the optimizer. */
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={check.documentUrl}
                    alt={`${check.documentTypeLabel} recorded for ${visitorName}`}
                    className="max-h-[420px] w-full rounded-2xl border border-border object-contain"
                  />
                ) : (
                  <p className="rounded-xl border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
                    A document was recorded, but it is not available to you.
                  </p>
                )}
              </>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button rounded="md" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
