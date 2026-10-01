'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IdCard, ShieldAlert } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Skeleton,
} from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrapOptional } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';

/**
 * The identity document recorded against one visitor's pass.
 *
 * ## Why this is a dialog rather than a column
 *
 * The document is fetched only when the office asks about ONE pass. Putting it on
 * the list would mean the passes list requesting a signed URL for every visitor's
 * identity document in a page — a far wider disclosure than anybody intended, and
 * a lot of signed URLs minted for rows nobody looked at. The query key is keyed by
 * the pass for the same reason.
 *
 * ## Why the office sees it and the household does not
 *
 * The document belongs to the GUEST. The office is who a dispute lands on and
 * already handles the estate's records; the resident issued the invitation but was
 * never shown the document and did not ask for it. Handing a household a
 * photograph of their visitor's licence is a disclosure the visitor never agreed
 * to, so `mayViewIdDocument` excludes them — and the server enforces that, not
 * this screen.
 *
 * ## What it says when there is nothing
 *
 * "No identity document was recorded" — with the reason it is not a failure. A
 * guard who reads absence as a rule starts turning people away over paperwork,
 * which turns the estate's policy into ours.
 */
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
    /**
     * `unwrapOptional`, NOT `unwrap` — and this is the whole "no document" case.
     *
     * Nest answers a handler that returns `null` with 200 and NO BODY. `unwrap`'s
     * `as T` cast hides that the runtime value is `undefined`, and react-query
     * rejects `undefined` outright with "Query data cannot be undefined" — so the
     * ordinary, allowed outcome of "the guard recorded nothing" arrived as
     * `isError` and the dialog said "That record could not be read just now."
     *
     * The first version of this used `unwrap` and the browser found it
     * immediately. E3 hit the identical trap on the emergency roll call and wrote
     * it into the programme doc; every future "null means none" endpoint has to
     * use this helper.
     */
    queryFn: () => unwrapOptional(estateService.getVisitorIdCheck(estateId, passId), null),
    // Only fetched when the office opens the document. Nothing about this pass's
    // identity document is loaded by rendering a list.
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
            <div className="flex items-start gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-xs leading-5 text-muted-foreground">
                Recording a document does not admit anybody, and a visitor who showed none was still
                admitted on their pass. This is a record of who was at the gate, for the estate to
                look back at if an arrival is ever questioned.
              </p>
            </div>

            {checkQuery.isLoading ? (
              <Skeleton className="h-48 w-full rounded-2xl" />
            ) : checkQuery.isError ? (
              <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs leading-5 text-destructive">
                That record could not be read just now.
              </p>
            ) : !check ? (
              <p className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                No identity document was recorded for this visit. That is not a failure — the estate
                does not require one, and this visit was admitted on its pass.
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
                  /* A plain <img>, not next/image: the src is a short-lived signed
                     URL for a private object, so there is nothing for the
                     optimizer to cache and a cached derivative of somebody's
                     identity document is the last thing to leave lying around. */
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
