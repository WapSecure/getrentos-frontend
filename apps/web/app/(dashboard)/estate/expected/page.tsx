'use client';

import { RedirectToEstateSetup } from '@/components/estate/shared/RedirectToEstateSetup';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tierAtLeast } from '@sureground/shared';
import { Alert, Button, CardSkeleton, PageHeader } from '@sureground/ui';
import { Upload } from 'lucide-react';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { EstateFeatureGate } from '@/components/estate/shared/EstateFeatureGate';
import { ExpectedTodayBoard } from '@/components/estate/expected/ExpectedTodayBoard';
import { ImportGuestListModal } from '@/components/estate/expected/ImportGuestListModal';

export default function EstateExpectedPage() {
  const { estate, isLoading: isEstateLoading } = useSelectedEstate();
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Skip the API on a known shortfall; an unknown tier still asks, since an absent plan fails open.
  const entitled = !estate?.planTier || tierAtLeast(estate.planTier, 'ENTERPRISE');

  // `?? ''` rather than `!`: the hook runs before the `!estate` guard; `enabled` stops the request.
  const boardQuery = useQuery({
    queryKey: estateKeys.expectedToday(estate?.id ?? ''),
    queryFn: () => unwrap(estateService.getExpectedToday(estate!.id)),
    enabled: !!estate && entitled,
  });

  if (isEstateLoading) {
    return <CardSkeleton />;
  }

  if (!estate) return <RedirectToEstateSetup />;

  return (
    <EstateFeatureGate feature="Expected today" error={boardQuery.error}>
      <>
        <PageHeader
          title="Expected today"
          description={
            <>
              Unused invitations, regular visitors due today and parcels still waiting. on one
              board.
            </>
          }
          actions={
            <Button
              rounded="md"
              icon={<Upload className="h-4 w-4" />}
              onClick={() => setIsImportOpen(true)}
            >
              Enter a guest list
            </Button>
          }
        />

        <Alert variant="neutral" className="mb-6">
          <p className="text-xs leading-5">
            This is a reference board, not an access control. Every visitor must still presents
            their own pass at the gate, and a guard can always turn somebody away whatever this
            says.
          </p>
        </Alert>

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
