'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Upload } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Input,
  Select,
} from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import type { GuestListImportResult } from '@/types/estate';

/**
 * Enter a household's guest list, once.
 *
 * One household and one deadline for the whole list because that is how a list
 * arrives — one resident is having the party — and the API insists on it, which
 * is why the two fields sit above the file rather than beside it.
 *
 * The list becomes real visitor passes through the same path a single
 * invitation takes, so every row is screened against the watchlist exactly as it
 * would be on its own. That is why this cannot be a bulk insert, and why the
 * result is per row: one blocked name must not refuse the other twenty-nine, and
 * one unreadable line must not either.
 */
export const ImportGuestListModal = ({
  estateId,
  open,
  onOpenChange,
}: {
  estateId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [householdId, setHouseholdId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<GuestListImportResult | null>(null);

  const householdsQuery = useQuery({
    queryKey: estateKeys.households(estateId),
    queryFn: () => unwrap(estateService.listHouseholds(estateId)),
    enabled: open,
  });

  const importMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('Attach the guest list as a CSV file');
      return unwrap(estateService.importGuestList(estateId, { householdId, expiresAt, file }));
    },
    onSuccess: (data) => {
      setResult(data);
      // The board is the point of doing this, so it is refreshed even when every
      // row was refused: a refusal still means the list was read.
      queryClient.invalidateQueries({ queryKey: estateKeys.expectedToday(estateId) });
    },
  });

  const reset = () => {
    setHouseholdId('');
    setExpiresAt('');
    setFile(null);
    setResult(null);
    importMutation.reset();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const close = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const canSubmit = !!householdId && !!expiresAt && !!file && !importMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg p-6">
        <DialogTitle className="pr-8 text-xl font-semibold tracking-[-0.02em] text-foreground">
          Enter a guest list
        </DialogTitle>
        <DialogDescription className="mt-1 text-sm leading-6 text-muted-foreground">
          Every guest on the list gets their own invitation, screened the same way a single one
          would be. Nobody is admitted by appearing here — each guest still presents their own pass.
        </DialogDescription>

        {result ? (
          <ImportResult result={result} onDone={() => close(false)} />
        ) : (
          <form
            className="mt-6 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (canSubmit) importMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <label
                htmlFor="guest-household"
                className="block text-sm font-medium text-foreground"
              >
                Whose guests are they?
              </label>
              <Select
                ariaLabel="Whose guests are they?"
                value={householdId}
                onValueChange={setHouseholdId}
                placeholder={
                  householdsQuery.isLoading ? 'Loading households…' : 'Choose a household'
                }
                options={(householdsQuery.data?.items ?? []).map((household) => ({
                  value: household.id,
                  label: `${household.unitLabel} — ${household.residentName}`,
                }))}
              />
              <p className="text-xs leading-5 text-muted-foreground">
                One household per list, because one resident is having the party.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="guest-deadline" className="block text-sm font-medium text-foreground">
                Valid until
              </label>
              <Input
                id="guest-deadline"
                type="datetime-local"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
              />
              <p className="text-xs leading-5 text-muted-foreground">
                After this, these passes stop working. A pass is a permission with an end, even for
                a party.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="guest-file" className="block text-sm font-medium text-foreground">
                The list
              </label>
              <input
                ref={fileInputRef}
                id="guest-file"
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="block w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:text-foreground"
              />
              <p className="text-xs leading-5 text-muted-foreground">
                A CSV with a name column, and optional phone and purpose columns. The first row is
                read as headings.
              </p>
            </div>

            {importMutation.isError && (
              <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs leading-5 text-destructive">
                {importMutation.error instanceof Error
                  ? importMutation.error.message
                  : 'That list could not be read'}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                rounded="md"
                onClick={() => close(false)}
                disabled={importMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                rounded="md"
                isLoading={importMutation.isPending}
                disabled={!canSubmit}
              >
                <Upload className="mr-2 h-4 w-4" />
                Add guests
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

/**
 * What the list produced, row by row.
 *
 * The failures are listed rather than summarised, with the spreadsheet's own line
 * numbers, because the office has to go and fix them: "3 rows failed" sends
 * somebody hunting through a file they have already closed. A refusal is also not
 * always the office's fault — a name the estate itself has asked not to be
 * admitted comes back here too — so the reason is repeated verbatim.
 */
const ImportResult = ({
  result,
  onDone,
}: {
  result: GuestListImportResult;
  onDone: () => void;
}) => (
  <div className="mt-6 space-y-5">
    <div
      className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm leading-6 ${
        result.failed === 0
          ? 'bg-success/10 text-success'
          : result.created === 0
            ? 'bg-destructive/10 text-destructive'
            : 'bg-warning/10 text-warning'
      }`}
    >
      {result.failed === 0 ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <div>
        <p>{result.label}</p>
        <p className="text-xs opacity-80">
          Each guest added holds a pass until {result.deadlineLabel}.
        </p>
      </div>
    </div>

    {result.errors.length > 0 && (
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Rows that need attention</p>
        <ul className="max-h-56 space-y-1.5 overflow-y-auto">
          {result.errors.map((error) => (
            <li
              key={error.row}
              className="rounded-xl border border-border bg-card px-3 py-2 text-xs leading-5"
            >
              <span className="font-medium text-foreground">
                Line {error.row}
                {error.visitorName ? ` — ${error.visitorName}` : ''}
              </span>
              <span className="mt-0.5 block text-muted-foreground">{error.message}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button type="button" rounded="md" onClick={onDone}>
        Done
      </Button>
    </div>
  </div>
);
