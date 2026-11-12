'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { KeyRound, ReceiptText } from '@sureground/icons';
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardSkeleton,
  CardTitle,
  DescriptionList,
  Disclosure,
  EmptyState,
  PageHeader,
  QueryState,
  SegmentedControl,
  Select,
  type DescriptionItem,
} from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { ROUTES } from '@/lib/constants/auth';
import { DIASPORA_ROUTES } from '@/lib/constants/diasporaRoutes';
import { formatCurrency, formatDate, formatLagosDate } from '@/lib/format';
import { homeManagementKeys, investorKeys, landlordKeys } from '@/lib/queryKeys';
import { landlordService } from '@/services/landlordService';
import { StatementBreakdown } from '@/components/shared/financials/StatementBreakdown';
import { investorService } from '@/services/investorService';
import { homeManagementService } from '@/services/homeManagementService';
import { ApprovalsView } from '@/components/landlord/approvals/ApprovalsView';
import { HomeManagementWorkOrderQueue } from '@/components/home-management/HomeManagementWorkOrderQueue';
import {
  INTAKE_STAGE,
  MANDATE_STATUS_BADGE,
} from '@/components/landlord/managed/SuregroundManagedView';
import type { InvestorManagedProperty } from '@/types/managed';
import { STATEMENT_PAYOUT_LABELS, humaniseStatus } from '@sureground/shared';

const JOB_PAGE_SIZE = 10;
/** Past this many properties a segmented control stops fitting a phone. */
const SEGMENTED_MAX = 3;

const isSet = (value: number | null | undefined): value is number =>
  value !== null && value !== undefined;

/**
 * Sureground Managed for an investor (DIA-20): one property at a time, with its agreement, the
 * spending waiting for them, its repairs and the latest statement. Actions on the agreement stay
 * on the management page; this page links there.
 */
export function InvestorManaged() {
  const managed = useQuery({
    queryKey: investorKeys.managed,
    queryFn: () => unwrap(investorService.getManaged()),
  });
  const properties = managed.data?.properties ?? [];
  // From the workspace: open on the property whose latest statement was linked.
  const linkedStatement = useSearchParams().get('statement');
  const [chosenId, setChosenId] = useState<string | null>(null);
  const property =
    properties.find((p) => p.propertyId === chosenId) ??
    (chosenId === null
      ? properties.find((p) => linkedStatement && p.lastStatement?.id === linkedStatement)
      : undefined) ??
    properties[0] ??
    null;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Managed"
        description="Your homes under Sureground Managed: the agreement, spending waiting for you, repairs and the latest statement."
        breadcrumbs={[
          { label: 'Invest', href: DIASPORA_ROUTES.OWNER_WORKSPACE },
          { label: 'Managed' },
        ]}
      />

      <QueryState
        isLoading={managed.isLoading}
        isError={managed.isError}
        onRetry={() => void managed.refetch()}
        isRetrying={managed.isFetching}
        errorTitle="Your managed properties could not be loaded"
        isEmpty={properties.length === 0}
        empty={{
          icon: KeyRound,
          title: 'No property under Sureground Managed yet',
          description:
            'We find tenants, collect rent, arrange repairs and send you a monthly statement. Spending above your limit waits for your approval.',
          action: <Button href={ROUTES.OWNER_MANAGEMENT}>Set up Sureground Managed</Button>,
        }}
        loading={
          <div className="grid gap-6 lg:grid-cols-2">
            <CardSkeleton lines={5} />
            <CardSkeleton lines={4} />
          </div>
        }
      >
        {property && (
          <>
            {properties.length > 1 && (
              <PropertyPicker
                properties={properties}
                value={property.propertyId}
                onChange={setChosenId}
              />
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <AgreementCard property={property} />
              <StatementCard
                property={property}
                openBreakdown={
                  Boolean(linkedStatement) && property.lastStatement?.id === linkedStatement
                }
              />
            </div>

            <section aria-labelledby="managed-approvals" className="space-y-3">
              <h2 id="managed-approvals" className="text-base font-semibold text-foreground">
                Waiting for your approval
              </h2>
              <ApprovalsView key={property.propertyId} propertyId={property.propertyId} />
            </section>

            <section aria-labelledby="managed-jobs" className="space-y-3">
              <h2 id="managed-jobs" className="text-base font-semibold text-foreground">
                Repairs and jobs
              </h2>
              <PropertyJobs
                key={property.propertyId}
                propertyId={property.propertyId}
                title={property.title}
              />
            </section>
          </>
        )}
      </QueryState>
    </div>
  );
}

function PropertyPicker({
  properties,
  value,
  onChange,
}: {
  properties: InvestorManagedProperty[];
  value: string;
  onChange: (id: string) => void;
}) {
  if (properties.length <= SEGMENTED_MAX) {
    return (
      <SegmentedControl
        aria-label="Property"
        value={value}
        onValueChange={onChange}
        className="max-w-full overflow-x-auto"
        segments={properties.map((p) => ({
          value: p.propertyId,
          label: p.title,
          count: p.pendingApprovals || undefined,
          countTone: 'warning' as const,
        }))}
      />
    );
  }
  return (
    <div className="max-w-sm">
      <Select
        ariaLabel="Property"
        value={value}
        onValueChange={onChange}
        searchable
        options={properties.map((p) => ({
          value: p.propertyId,
          label: p.pendingApprovals ? `${p.title} (${p.pendingApprovals} waiting)` : p.title,
          searchText: p.title,
        }))}
      />
    </div>
  );
}

function AgreementCard({ property }: { property: InvestorManagedProperty }) {
  const { mandate, intake } = property;
  const status = mandate
    ? (MANDATE_STATUS_BADGE[mandate.status] ?? {
        variant: 'neutral' as const,
        label: humaniseStatus(mandate.status),
      })
    : null;

  const rows: DescriptionItem[] = mandate
    ? [
        {
          label: 'Status',
          value: status && <Badge variant={status.variant}>{status.label}</Badge>,
        },
        {
          label: 'Management fee',
          value:
            mandate.feePercent !== null && mandate.feePercent !== undefined
              ? `${mandate.feePercent}%`
              : null,
        },
        { label: 'Started', value: mandate.startedAt ? formatDate(mandate.startedAt) : null },
        {
          label: 'Routine spending',
          value: isSet(mandate.bands.routineCap)
            ? formatCurrency(mandate.bands.routineCap)
            : 'Not set',
          hint: isSet(mandate.bands.routineCap)
            ? 'Your manager spends up to this without asking.'
            : 'Until you set one, your manager can approve repairs of any amount.',
        },
        {
          label: 'Emergency spending',
          value: isSet(mandate.bands.emergencyCap)
            ? formatCurrency(mandate.bands.emergencyCap)
            : 'Not set',
          hint: isSet(mandate.bands.emergencyCap)
            ? 'Urgent repairs up to this go ahead first; you are told at once.'
            : 'Urgent repairs follow your routine limit.',
        },
        {
          label: 'Explicit authorisation',
          value: isSet(mandate.bands.explicitAbove)
            ? `Above ${formatCurrency(mandate.bands.explicitAbove)}`
            : 'Not set',
          hint: 'You confirm it is you before approving.',
        },
      ]
    : intake
      ? [
          {
            label: 'Setting up',
            value: (
              <Badge variant="info">
                {INTAKE_STAGE[intake.status] ?? humaniseStatus(intake.status)}
              </Badge>
            ),
          },
        ]
      : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Agreement</CardTitle>
        <CardDescription>{property.title}</CardDescription>
      </CardHeader>
      <div className="px-5 pb-2">
        {rows.length > 0 ? (
          <DescriptionList layout="rows" items={rows} />
        ) : (
          <p className="py-3 text-sm text-muted-foreground">No agreement yet.</p>
        )}
      </div>
      <CardFooter className="flex-wrap justify-start">
        <Button href={ROUTES.OWNER_MANAGEMENT} variant="outline" size="sm">
          {mandate ? 'Manage agreement' : 'Continue setting up'}
        </Button>
        {mandate?.status === 'ACTIVE' && (
          <Button href={ROUTES.OWNER_APPROVALS} variant="ghost" size="sm">
            Change limits
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

const STATEMENT_STATUS_LABELS: Record<string, string> = { DRAFT: 'Draft', ISSUED: 'Issued' };

function StatementCard({
  property,
  openBreakdown = false,
}: {
  property: InvestorManagedProperty;
  openBreakdown?: boolean;
}) {
  const statement = property.lastStatement;
  const net = statement ? Number(statement.net) : NaN;

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Latest statement</CardTitle>
        <CardDescription>Rent collected, less fees and repairs.</CardDescription>
      </CardHeader>
      {statement ? (
        <>
          <div className="px-5 pb-2">
            <DescriptionList
              layout="rows"
              items={[
                {
                  label: 'Period',
                  value: `${formatLagosDate(statement.periodStart)} to ${formatLagosDate(statement.periodEnd)}`,
                },
                {
                  label: 'Statement net',
                  value: Number.isFinite(net) ? formatCurrency(net) : null,
                  hint: 'For the whole statement, which can cover more than one property.',
                },
                {
                  label: 'Status',
                  value:
                    STATEMENT_STATUS_LABELS[statement.status] ?? humaniseStatus(statement.status),
                },
              ]}
            />
          </div>
          <StatementDetail
            key={statement.id}
            statementId={statement.id}
            defaultOpen={openBreakdown}
          />
        </>
      ) : (
        <EmptyState
          size="compact"
          bare
          icon={ReceiptText}
          title="No statement yet"
          description={
            property.mandate?.status === 'ACTIVE'
              ? 'Your first statement arrives at the end of the month.'
              : 'Statements start once Sureground manages this property.'
          }
        />
      )}
    </Card>
  );
}

/** The ledger lines behind the statement, read when opened. */
function StatementDetail({
  statementId,
  defaultOpen = false,
}: {
  statementId: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const detail = useQuery({
    queryKey: landlordKeys.ownerStatement(statementId),
    queryFn: () => unwrap(landlordService.getOwnerStatement(statementId)),
    enabled: open,
  });

  return (
    <Disclosure
      className="border-t border-border"
      summary="See the breakdown"
      defaultOpen={defaultOpen}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <QueryState
        isLoading={detail.isLoading}
        isError={detail.isError}
        onRetry={() => void detail.refetch()}
        isRetrying={detail.isFetching}
        errorTitle="The statement could not be loaded"
        loading={<CardSkeleton lines={4} />}
      >
        {detail.data && (
          <>
            <StatementBreakdown lineItems={detail.data.lineItems ?? []} totals={detail.data} />
            <p className="mt-3 text-xs">
              {STATEMENT_PAYOUT_LABELS[detail.data.payoutStatus] ??
                humaniseStatus(detail.data.payoutStatus)}
            </p>
          </>
        )}
      </QueryState>
    </Disclosure>
  );
}

function PropertyJobs({ propertyId, title }: { propertyId: string; title: string }) {
  const [page, setPage] = useState(1);
  const workOrders = useQuery({
    queryKey: [...homeManagementKeys.workOrders, { page, pageSize: JOB_PAGE_SIZE, propertyId }],
    queryFn: () =>
      unwrap(homeManagementService.listWorkOrders({ page, pageSize: JOB_PAGE_SIZE, propertyId })),
    placeholderData: keepPreviousData,
  });
  const vendors = useQuery({
    queryKey: [...homeManagementKeys.vendors, 'assignable', propertyId],
    queryFn: () => unwrap(homeManagementService.listAssignableVendors(propertyId)),
  });

  return (
    <HomeManagementWorkOrderQueue
      compact
      viewerRole="owner"
      workOrders={workOrders.data?.items ?? []}
      properties={[{ id: propertyId, title }]}
      vendors={vendors.data ?? []}
      isLoading={workOrders.isLoading}
      error={workOrders.error as Error | null}
      page={page}
      pageSize={JOB_PAGE_SIZE}
      total={workOrders.data?.total ?? 0}
      onPageChange={setPage}
    />
  );
}
