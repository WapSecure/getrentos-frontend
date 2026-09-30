'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { tierAtLeast } from '@getrentos/shared';
import { Button } from '@getrentos/ui';
import { Upload } from 'lucide-react';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { EstateFeatureGate } from '@/components/estate/shared/EstateFeatureGate';
import { ExpectedTodayBoard } from '@/components/estate/expected/ExpectedTodayBoard';
import { ImportGuestListModal } from '@/components/estate/expected/ImportGuestListModal';

/**
 * Who the estate expects today.
 *
 * One screen rather than the three it replaces, because a guard asking "who is
 * coming?" does not care which table the answer lives in — invitations nobody
 * has used, standing authorisations due today, and parcels still waiting are one
 * question asked of three sources.
 *
 * It is a HINT board and the page says so out loud. Nothing on it opens a
 * barrier: admissions stay exactly where they were, with the pass PIN and the
 * guard. That is also why the guard console reads the same board — see the guard
 * page — even though the guest list behind it is the office's.
 *
 * ENTERPRISE, and the gate is on the OFFICE. The board replaces a phone call;
 * a guard without it still checks anybody in by PIN, so an estate that has not
 * bought this is slower rather than less safe. That is the same test dwell and
 * patrol pass, and it is why the API leaves the read to the guard ungated.
 */
export default function EstateExpectedPage() {
  const router = useRouter();
  const { estate, isLoading: isEstateLoading } = useSelectedEstate();
  const [isImportOpen, setIsImportOpen] = useState(false);

  /**
   * Whether it is worth asking the API at all.
   *
   * A known shortfall is not worth a guaranteed 403 on every visit — in a
   * browser console that is a red error which makes a real one harder to find.
   * An UNKNOWN tier is not a shortfall: an absent plan fails open everywhere in
   * this codebase, so it still asks and lets the API be the authority.
   */
  const entitled = !estate?.planTier || tierAtLeast(estate.planTier, 'ENTERPRISE');

  // `estate?.id ?? ''` rather than `estate!.id`: the hook runs before the
  // `!estate` guard below, so the assertion would be a lie on the first render.
  // `enabled` is what stops the request; the key only has to be stable.
  const boardQuery = useQuery({
    queryKey: estateKeys.expectedToday(estate?.id ?? ''),
    queryFn: () => unwrap(estateService.getExpectedToday(estate!.id)),
    enabled: !!estate && entitled,
  });

  if (isEstateLoading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  }

  if (!estate) {
    router.replace(ROUTES.ESTATE_SETUP);
    return null;
  }

  return (
    <EstateFeatureGate feature="Expected today" error={boardQuery.error}>
      <>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Expected today</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Invitations nobody has used, regular visitors due today, and parcels still waiting —
              on one board.
            </p>
          </div>
          <Button rounded="md" onClick={() => setIsImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Enter a guest list
          </Button>
        </div>

        <div className="mb-6 rounded-xl border border-border bg-card px-3 py-2.5 text-xs leading-5 text-muted-foreground">
          This is a hint board, not a door. Nothing here admits anybody — every visitor still
          presents their own pass at the gate, and a guard can always turn somebody away whatever
          this says.
        </div>

        <ExpectedTodayBoard estateId={estate.id} />

        <ImportGuestListModal
          estateId={estate.id}
          open={isImportOpen}
          onOpenChange={setIsImportOpen}
        />
      </>
    </EstateFeatureGate>
  );
}
