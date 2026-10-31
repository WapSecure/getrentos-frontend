'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { ShieldCheck, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Alert, Button } from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';
import { adminService } from '@/services/adminService';
import type { OwnershipDocCheck, OwnershipProofRef } from '@/types/admin';

const NAME_MATCH_STYLE: Record<
  OwnershipDocCheck['nameMatch'],
  { label: string; className: string }
> = {
  MATCH: { label: 'Name matches', className: 'bg-green-500/15 text-green-600' },
  PARTIAL: { label: 'Partial name match', className: 'bg-yellow-500/15 text-yellow-600' },
  MISMATCH: { label: 'Name mismatch', className: 'bg-red-500/15 text-red-600' },
  UNREADABLE: { label: 'Name unreadable', className: 'bg-muted text-muted-foreground' },
};

/**
 * Runs the AI ownership-document cross-check per proof and shows the result:
 * the owner/address read from the document vs what's on file, with reasons. A
 * decision aid for the reviewer — it never approves or rejects the proof.
 */
export const OwnershipDocCheckPanel = ({ proofs }: { proofs: OwnershipProofRef[] }) => {
  const [results, setResults] = useState<Record<string, OwnershipDocCheck>>({});
  const mutation = useMutation({
    mutationFn: (proofId: string) => unwrap(adminService.crossCheckOwnershipDoc(proofId)),
    onSuccess: (data) => setResults((r) => ({ ...r, [data.proofId]: data })),
  });

  if (proofs.length === 0) return null;

  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        Document cross-check
      </p>
      <div className="space-y-2">
        {proofs.map((proof) => {
          const result = results[proof.id];
          const running = mutation.isPending && mutation.variables === proof.id;
          return (
            <div key={proof.id} className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                  {proof.documentType}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => mutation.mutate(proof.id)}
                  isLoading={running}
                >
                  {result ? 'Re-run check' : 'Run check'}
                </Button>
              </div>

              {running && mutation.variables === proof.id && (
                <p className="mt-2 text-xs text-muted-foreground">Reading the document…</p>
              )}

              {result && <DocCheckResult result={result} />}
            </div>
          );
        })}
      </div>
      {mutation.isError && (
        <Alert variant="danger" className="mt-2">
          The cross-check could not be completed. Try again.
        </Alert>
      )}
    </div>
  );
};

const DocCheckResult = ({ result }: { result: OwnershipDocCheck }) => {
  const match = NAME_MATCH_STYLE[result.nameMatch];
  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3">
      {!result.coverage.documentRead ? (
        <Alert variant="warning">
          Automated reading was not possible — review the document manually.
        </Alert>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${match.className}`}>
              {match.label}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                result.addressConsistent === false
                  ? 'bg-red-500/15 text-red-600'
                  : result.addressConsistent === true
                    ? 'bg-green-500/15 text-green-600'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {result.addressConsistent === false
                ? 'Address inconsistent'
                : result.addressConsistent === true
                  ? 'Address consistent'
                  : 'Address not compared'}
            </span>
          </div>

          <dl className="space-y-1 text-xs">
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted-foreground">Document owner</dt>
              <dd className="text-foreground">{result.extraction?.ownerName ?? '—'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted-foreground">On file</dt>
              <dd className="text-foreground">{result.claimedOwnerName || '—'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted-foreground">Document type</dt>
              <dd className="text-foreground">{result.extraction?.documentKind ?? '—'}</dd>
            </div>
          </dl>

          {result.reasons.length > 0 && (
            <ul className="space-y-1">
              {result.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs">
                  <AlertTriangle
                    className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                      r.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
                    }`}
                  />
                  <span className="text-foreground">{r.detail}</span>
                </li>
              ))}
            </ul>
          )}

          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            {result.recommendation}
          </p>
        </>
      )}
    </div>
  );
};
