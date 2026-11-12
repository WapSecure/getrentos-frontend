import Link from 'next/link';
import { ArrowRight, Building2, Home, LandPlot, type SgIcon } from '@sureground/icons';
import { Badge, Button, Progress } from '@sureground/ui';
import { stageProgress } from '@sureground/shared';
import { purchaseWorkspaceHref } from '@/lib/transactionWorkspace';
import type { PurchaseSummary } from '@/types/transactionWorkspace';
import { AcquisitionStatusBadges } from './AcquisitionStatusBadges';

const TYPE_ICON: Record<string, SgIcon> = {
  LAND: LandPlot,
  HOUSE: Home,
  DUPLEX: Home,
  BUNGALOW: Home,
};

/**
 * Purchases with their three separate statuses (progress, deposit, legal transfer), how far along
 * the usual path each is, and what happens next. Rows open the buyer's or the representative's
 * workspace. A released deposit never reads as legal completion.
 */
export function PurchaseSummaryList({ purchases }: { purchases: readonly PurchaseSummary[] }) {
  return (
    <ul className="divide-y divide-border">
      {purchases.map((purchase) => {
        const href = purchaseWorkspaceHref(purchase);
        const Icon = TYPE_ICON[purchase.propertyType?.toUpperCase()] ?? Building2;
        const progress = stageProgress(purchase.operationalStage.code);
        return (
          <li
            key={`${purchase.role}-${purchase.transactionId}`}
            className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-start lg:gap-6"
          >
            <div className="flex min-w-0 flex-1 gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1 space-y-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={href}
                      className="min-w-0 truncate text-sm font-semibold text-foreground hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                    >
                      {purchase.title}
                    </Link>
                    {purchase.role === 'REPRESENTATIVE' && (
                      <Badge variant="purple">
                        {`Representing ${purchase.representing?.principalName ?? 'a buyer'}`}
                      </Badge>
                    )}
                  </div>
                  <AcquisitionStatusBadges
                    statuses={{
                      operationalStage: purchase.operationalStage,
                      moneyStatus: purchase.moneyStatus,
                      legalStatus: purchase.legalStatus,
                    }}
                  />
                </div>
                {progress && (
                  <Progress
                    size="sm"
                    label={`Stage: ${purchase.operationalStage.label}`}
                    value={progress.step}
                    max={progress.total}
                    showValue="fraction"
                    tone={progress.step === progress.total ? 'success' : 'primary'}
                    className="max-w-md"
                  />
                )}
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Next: </span>
                  {purchase.nextAction ?? 'Nothing due from anyone right now'}
                  {purchase.waitingForYou && (
                    <Badge variant="warning" dot className="ml-2 align-middle">
                      {purchase.pendingApprovals > 0
                        ? `${purchase.pendingApprovals} approval${purchase.pendingApprovals === 1 ? '' : 's'} for you`
                        : 'Waiting for you'}
                    </Badge>
                  )}
                </p>
              </div>
            </div>
            <Button
              href={href}
              variant={purchase.waitingForYou ? 'primary' : 'outline'}
              icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
              iconPosition="right"
              className="ml-16 shrink-0 self-start lg:ml-0"
            >
              {purchase.waitingForYou ? 'Take action' : 'Open'}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
