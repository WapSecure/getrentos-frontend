'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  CalendarClock,
  ChevronDown,
  CircleAlert,
  ClipboardCheck,
  ClipboardList,
  ClipboardPlus,
  PackagePlus,
  Settings2,
  ShieldCheck,
  TriangleAlert,
  Wrench,
  Zap,
} from '@sureground/icons';
import { HomeAssetRegistry } from '@/components/home-management/HomeAssetRegistry';
import { HomeManagementInspectionFeed } from '@/components/home-management/HomeManagementInspectionFeed';
import { HomeManagementOverview } from '@/components/home-management/HomeManagementOverview';
import { HomeManagementRecordsPanel } from '@/components/home-management/HomeManagementRecordsPanel';
import { HomeManagementTimeline } from '@/components/home-management/HomeManagementTimeline';
import { HomeManagementVendorPerformance } from '@/components/home-management/HomeManagementVendorPerformance';
import {
  Alert,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  PageHeader,
  Skeleton,
  StatGroup,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  type StatGroupItem,
} from '@sureground/ui';
import dynamic from 'next/dynamic';
import { unwrap } from '@/lib/apiHelpers';
import {
  UTILITIES_VIEW_FOR,
  homeManagementTabHref,
  parseHomeManagementTab,
  utilitiesViewHref,
  type HomeManagementTab,
  type UtilitiesCreateKind,
} from '@/lib/homeManagementTabs';
import { homeManagementKeys } from '@/lib/queryKeys';
import { landlordService } from '@/services/landlordService';
import {
  homeManagementService,
  type HomeManagementProperty,
  type HomeManagementVendor,
} from '@/services/homeManagementService';
import { ownerService } from '@/services/ownerService';
import { utilitiesService } from '@/services/utilitiesService';
import {
  formatSpendOrNoData,
  shouldShowUtilityTiles,
  generatorServiceSummary,
} from '@sureground/shared';
import { propertyAuthorityService } from '@/services/propertyAuthorityService';
import type { WorkOrderForm } from '@/components/home-management/HomeManagementWorkOrderQueue';

const sectionFallback = () => <Skeleton className="h-48 w-full rounded-xl" />;
const HomeManagementSlaPolicies = dynamic(
  () =>
    import('@/components/home-management/HomeManagementSlaPolicies').then(
      (m) => m.HomeManagementSlaPolicies
    ),
  { loading: sectionFallback }
);
const PreventiveMaintenancePlans = dynamic(
  () =>
    import('@/components/home-management/PreventiveMaintenancePlans').then(
      (m) => m.PreventiveMaintenancePlans
    ),
  { loading: sectionFallback }
);
const HomeManagementWorkOrderQueue = dynamic(
  () =>
    import('@/components/home-management/HomeManagementWorkOrderQueue').then(
      (m) => m.HomeManagementWorkOrderQueue
    ),
  { loading: sectionFallback }
);
const HomeManagementUtilities = dynamic(
  () =>
    import('@/components/home-management/utilities/HomeManagementUtilities').then(
      (m) => m.HomeManagementUtilities
    ),
  { loading: sectionFallback }
);
const HomeManagementEscalationQueue = dynamic(
  () =>
    import('@/components/home-management/HomeManagementEscalationQueue').then(
      (m) => m.HomeManagementEscalationQueue
    ),
  { loading: sectionFallback }
);

export type HomeManagementWorkspaceRole = 'owner' | 'landlord' | 'manager';

interface HomeManagementWorkspaceProps {
  role: HomeManagementWorkspaceRole;
  /** Narrows everything to the client's property, so pickers, lists and history can't reach another client's home. */
  scopePropertyId?: string;
  eyebrow?: string;
  /** One plain line of context under the title; each role has a default. */
  description?: ReactNode;
  /**
   * The query parameter that holds the open tab. The landlord hub already uses `tab` for its own
   * Requests / Home Management switch, so it passes another name.
   */
  tabParam?: string;
  /** A field agent records readings and purchases; set-up actions such as adding a meter are hidden. */
  recordOnly?: boolean;
}

type CreateKind = 'work-order' | 'asset' | 'plan' | 'policy' | UtilitiesCreateKind;

const CREATE_TAB: Record<CreateKind, HomeManagementTab> = {
  'work-order': 'work-orders',
  asset: 'assets',
  plan: 'preventive-care',
  policy: 'service-standards',
  fuel: 'utilities',
  meter: 'utilities',
  'water-test': 'utilities',
};

const isUtilitiesKind = (kind: CreateKind): kind is UtilitiesCreateKind =>
  kind === 'fuel' || kind === 'meter' || kind === 'water-test';

const DEFAULT_DESCRIPTION: Record<HomeManagementWorkspaceRole, string> = {
  owner: 'Work orders, care plans, assets and records for the homes you own.',
  landlord: 'Work orders, care plans, assets and records for the homes you let.',
  manager: 'Work orders, care plans, assets and records for the properties you manage.',
};

const ASSET_PAGE_SIZE = 12;
const PLAN_PAGE_SIZE = 10;
const WORK_ORDER_PAGE_SIZE = 10;

const normalizeProperties = (properties: HomeManagementProperty[]): HomeManagementProperty[] =>
  properties.map((property) => ({
    id: property.id,
    name: property.name,
    title: property.title,
    city: property.city,
    state: property.state,
  }));

export function HomeManagementWorkspace({
  role,
  scopePropertyId,
  eyebrow = 'Property care',
  description,
  tabParam = 'tab',
  recordOnly = false,
}: HomeManagementWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = parseHomeManagementTab(searchParams.get(tabParam));
  const tabHref = useCallback(
    (tab: HomeManagementTab) =>
      homeManagementTabHref(pathname, searchParams.toString(), tab, tabParam),
    [pathname, searchParams, tabParam]
  );
  // A push, not a replace, so the back button returns to the previous tab.
  const setTab = (tab: HomeManagementTab) => router.push(tabHref(tab), { scroll: false });
  const [createRequest, setCreateRequest] = useState<{ kind: CreateKind; id: number } | null>(null);
  const clearCreateRequest = useCallback(() => setCreateRequest(null), []);
  // Never reused, so a section that stays mounted still sees the next click as a new request.
  const requestSequence = useRef(0);
  // A failed water test opens the work order already on its property, as a water job.
  const [workOrderPrefill, setWorkOrderPrefill] = useState<Partial<WorkOrderForm> | undefined>();
  const requestCreate = (kind: CreateKind, prefill?: Partial<WorkOrderForm>) => {
    setWorkOrderPrefill(kind === 'work-order' ? prefill : undefined);
    if (isUtilitiesKind(kind)) {
      // One navigation for the tab and its sub-view, so the right form's panel is mounted.
      const tabUrl = new URL(tabHref('utilities'), 'http://local');
      router.push(
        utilitiesViewHref(tabUrl.pathname, tabUrl.search.slice(1), UTILITIES_VIEW_FOR[kind]),
        { scroll: false }
      );
    } else if (activeTab !== CREATE_TAB[kind]) setTab(CREATE_TAB[kind]);
    requestSequence.current += 1;
    setCreateRequest({ kind, id: requestSequence.current });
  };
  const requestFor = (kind: CreateKind) =>
    createRequest?.kind === kind ? createRequest.id : undefined;
  const utilitiesRequest =
    createRequest && isUtilitiesKind(createRequest.kind)
      ? { kind: createRequest.kind, id: createRequest.id }
      : undefined;

  const [assetPage, setAssetPage] = useState(1);
  const [chosenAssetPropertyId, setAssetPropertyId] = useState('');
  const assetPropertyId = scopePropertyId ?? chosenAssetPropertyId;
  const [planPage, setPlanPage] = useState(1);
  const [workOrderPage, setWorkOrderPage] = useState(1);

  const propertiesQuery = useQuery({
    queryKey: homeManagementKeys.properties(role),
    queryFn: async (): Promise<HomeManagementProperty[]> => {
      if (role === 'manager') {
        const managed = await unwrap(propertyAuthorityService.managed());
        return managed
          .filter((property) => property.canManage && !property.archived)
          .map((property) => ({
            id: property.propertyId,
            title: property.title,
            city: property.city,
            state: property.state,
          }));
      }
      if (role === 'owner') {
        const res = await unwrap(ownerService.listProperties({ page: 1, pageSize: 100 }));
        return normalizeProperties(res.items);
      }
      const res = await unwrap(landlordService.listProperties({ page: 1, pageSize: 100 }));
      return normalizeProperties(res.items);
    },
  });

  const assetsQuery = useQuery({
    queryKey: [
      ...homeManagementKeys.assets(assetPropertyId || undefined),
      { page: assetPage, pageSize: ASSET_PAGE_SIZE },
    ],
    queryFn: () =>
      unwrap(
        homeManagementService.listAssets({
          propertyId: assetPropertyId || undefined,
          page: assetPage,
          pageSize: ASSET_PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });

  const plansQuery = useQuery({
    queryKey: [
      ...homeManagementKeys.plans,
      { page: planPage, pageSize: PLAN_PAGE_SIZE, propertyId: scopePropertyId },
    ],
    queryFn: () =>
      unwrap(
        homeManagementService.listPlans({
          page: planPage,
          pageSize: PLAN_PAGE_SIZE,
          propertyId: scopePropertyId,
        })
      ),
    placeholderData: keepPreviousData,
  });

  const workOrdersQuery = useQuery({
    queryKey: [
      ...homeManagementKeys.workOrders,
      { page: workOrderPage, pageSize: WORK_ORDER_PAGE_SIZE, propertyId: scopePropertyId },
    ],
    queryFn: () =>
      unwrap(
        homeManagementService.listWorkOrders({
          page: workOrderPage,
          pageSize: WORK_ORDER_PAGE_SIZE,
          propertyId: scopePropertyId,
        })
      ),
    placeholderData: keepPreviousData,
  });

  // The health summary counts every property the caller holds, so it is hidden while narrowed to one client.
  const dashboardQuery = useQuery({
    queryKey: homeManagementKeys.dashboard,
    enabled: !scopePropertyId,
    queryFn: () => unwrap(homeManagementService.getDashboard()),
  });

  // Utilities figures follow the same rule: hidden while narrowed to one client, and tiles only once something is recorded.
  const utilitiesQuery = useQuery({
    queryKey: homeManagementKeys.utilities.summary(),
    enabled: !scopePropertyId,
    queryFn: () => unwrap(utilitiesService.summary()),
  });
  const utilities = utilitiesQuery.data;

  // A manager's assignable vendors are the owners' directories for the properties they control; assignment is still validated against each owner at write time.
  const vendorsQuery = useQuery({
    queryKey: [...homeManagementKeys.vendors, role],
    queryFn: async (): Promise<HomeManagementVendor[]> => {
      if (role === 'manager') {
        return unwrap(homeManagementService.listAssignableVendors());
      }
      const res = await unwrap(landlordService.listVendors({ page: 1, pageSize: 100 }));
      return res.items.map((vendor) => ({
        id: vendor.id,
        name: vendor.name,
        serviceType: vendor.serviceType,
        rating: vendor.rating,
        jobsCompleted: vendor.jobsCompleted,
      }));
    },
  });

  const allProperties = propertiesQuery.data ?? [];
  const properties = scopePropertyId
    ? allProperties.filter((property) => property.id === scopePropertyId)
    : allProperties;
  const assets = assetsQuery.data?.items ?? [];
  const plans = plansQuery.data?.items ?? [];
  const workOrders = workOrdersQuery.data?.items ?? [];
  const vendors = vendorsQuery.data ?? [];

  const summary = dashboardQuery.data;
  const propertiesPending = propertiesQuery.isLoading;
  const hasProperties = properties.length > 0;
  const noPropertyTitle = propertiesPending
    ? 'Loading your properties'
    : hasProperties
      ? undefined
      : 'Add a property first';
  const figure = (value: number | undefined) =>
    dashboardQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (value ?? 0);
  const summaryItems: StatGroupItem[] = [
    {
      label: 'Open work orders',
      value: figure(summary?.openWorkOrders),
      icon: ClipboardList,
      href: tabHref('work-orders'),
    },
    {
      label: 'Awaiting approval',
      value: figure(summary?.approvalQueue),
      icon: ShieldCheck,
      href: tabHref('work-orders'),
      attention: (summary?.approvalQueue ?? 0) > 0,
    },
    {
      label: 'Overdue',
      value: figure(summary?.overdue),
      icon: TriangleAlert,
      href: tabHref('work-orders'),
      attention: (summary?.overdue ?? 0) > 0,
    },
    {
      label: 'Care plans due',
      value: figure(summary?.plansDue),
      icon: CalendarClock,
      href: tabHref('preventive-care'),
    },
    {
      label: 'Assets needing service',
      value: figure(summary?.assetsNeedingService),
      icon: Wrench,
      href: tabHref('assets'),
    },
    ...(shouldShowUtilityTiles(utilities)
      ? [
          {
            label: `Utility spend (${utilities!.monthLabel.split(' ')[0]})`,
            value: formatSpendOrNoData(utilities!.spendThisMonth),
            icon: Zap,
            href: tabHref('utilities'),
          },
          {
            label: 'Generators due a service',
            value: generatorServiceSummary(utilities!.generatorsDue, utilities!.generatorsDueSoon),
            icon: Wrench,
            href: tabHref('utilities'),
            attention: utilities!.generatorsDue > 0,
          },
        ]
      : []),
  ];
  // Only server-calculated, portfolio-wide counts earn a badge; a paginated list's length would mislead.
  const tabCounts: Partial<Record<HomeManagementTab, number>> = scopePropertyId
    ? {}
    : {
        'work-orders': summary?.openWorkOrders,
        'preventive-care': summary?.plansDue,
        utilities: utilities?.generatorsDue,
      };
  const tabs: { id: HomeManagementTab; label: string; countLabel?: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'work-orders', label: 'Work orders', countLabel: 'open' },
    { id: 'preventive-care', label: 'Preventive care', countLabel: 'due' },
    { id: 'assets', label: 'Assets' },
    { id: 'utilities', label: 'Utilities', countLabel: 'generators due a service' },
    { id: 'service-standards', label: 'Service standards' },
    { id: 'history', label: 'History & records' },
  ];
  const panelClass =
    'rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background';

  return (
    <div className="pb-10">
      <PageHeader
        eyebrow={eyebrow}
        title="Home management"
        description={description ?? DEFAULT_DESCRIPTION[role]}
        actions={
          <>
            <Button
              icon={<ClipboardPlus className="h-4 w-4" />}
              rounded="md"
              disabled={propertiesPending || !hasProperties}
              title={
                propertiesPending
                  ? 'Loading your property portfolio'
                  : hasProperties
                    ? undefined
                    : 'Add a property and unit before creating a work order'
              }
              onClick={() => requestCreate('work-order')}
            >
              Create work order
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  rounded="md"
                  icon={<ChevronDown className="h-4 w-4" />}
                  iconPosition="right"
                >
                  Add
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  disabled={!hasProperties}
                  title={noPropertyTitle}
                  onSelect={() => requestCreate('asset')}
                >
                  <PackagePlus className="h-4 w-4 text-primary" aria-hidden="true" />
                  Add asset
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!hasProperties}
                  title={noPropertyTitle}
                  onSelect={() => requestCreate('plan')}
                >
                  <CalendarClock className="h-4 w-4 text-primary" aria-hidden="true" />
                  Create care plan
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!hasProperties}
                  title={noPropertyTitle}
                  onSelect={() => requestCreate('policy')}
                >
                  <Settings2 className="h-4 w-4 text-primary" aria-hidden="true" />
                  Add service policy
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!hasProperties}
                  title={noPropertyTitle}
                  onSelect={() => requestCreate('fuel')}
                >
                  <Zap className="h-4 w-4 text-primary" aria-hidden="true" />
                  Log fuel
                </DropdownMenuItem>
                {!recordOnly && (
                  <DropdownMenuItem
                    disabled={!hasProperties}
                    title={noPropertyTitle}
                    onSelect={() => requestCreate('meter')}
                  >
                    <Zap className="h-4 w-4 text-primary" aria-hidden="true" />
                    Add meter
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  disabled={!hasProperties}
                  title={noPropertyTitle}
                  onSelect={() => requestCreate('water-test')}
                >
                  <ClipboardCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                  Record water test
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      {/* The totals count every property the caller holds, so they stay hidden while narrowed to one client. */}
      {!scopePropertyId &&
        (dashboardQuery.isError && !summary ? (
          <Alert variant="danger" className="mb-6">
            Your portfolio totals could not be loaded. Refresh the page to try again.
          </Alert>
        ) : (
          <StatGroup
            title="Across your portfolio"
            items={summaryItems}
            className="mb-6"
            action={
              summary && summary.propertiesTotal > 0 ? (
                <span className="text-xs text-muted-foreground">
                  {summary.propertiesTotal}{' '}
                  {summary.propertiesTotal === 1 ? 'property' : 'properties'}
                </span>
              ) : undefined
            }
          />
        ))}

      {propertiesQuery.isError && !propertiesQuery.data && (
        <div className="mb-6">
          <EmptyState
            icon={CircleAlert}
            title="Your properties could not be loaded"
            description="New assets, care plans and work orders need your properties. Refresh the page to try again."
          />
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(value) => setTab(parseHomeManagementTab(value))}
        activationMode="manual"
      >
        <TabsList variant="underline" aria-label="Home management sections" className="mb-6">
          {tabs.map((tab) => {
            const count = tabCounts[tab.id];
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex min-h-11 shrink-0 items-center gap-2"
              >
                {tab.label}
                {count !== undefined && count > 0 && (
                  <Badge variant="primary" className="px-1.5 py-0">
                    {count}
                    <span className="sr-only"> {tab.countLabel}</span>
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="overview" className={panelClass}>
          <HomeManagementOverview
            summary={summary}
            isLoading={dashboardQuery.isLoading}
            scopePropertyId={scopePropertyId}
            tabHref={tabHref}
            utilities={utilities}
          />
        </TabsContent>

        <TabsContent value="work-orders" className={`space-y-8 ${panelClass}`}>
          <HomeManagementEscalationQueue
            properties={properties}
            isPropertiesLoading={propertiesQuery.isLoading}
          />

          <HomeManagementWorkOrderQueue
            workOrders={workOrders}
            properties={properties}
            vendors={vendors}
            isLoading={workOrdersQuery.isLoading}
            isPropertiesLoading={propertiesQuery.isLoading}
            error={workOrdersQuery.error as Error | null}
            page={workOrderPage}
            pageSize={WORK_ORDER_PAGE_SIZE}
            total={workOrdersQuery.data?.total ?? 0}
            onPageChange={setWorkOrderPage}
            viewerRole={role}
            showCreateAction={false}
            createRequest={requestFor('work-order')}
            createPrefill={workOrderPrefill}
            onCreateRequestHandled={clearCreateRequest}
          />
        </TabsContent>

        <TabsContent value="preventive-care" className={panelClass}>
          <PreventiveMaintenancePlans
            plans={plans}
            properties={properties}
            vendors={vendors}
            isLoading={plansQuery.isLoading || propertiesQuery.isLoading}
            error={plansQuery.error as Error | null}
            page={planPage}
            pageSize={PLAN_PAGE_SIZE}
            total={plansQuery.data?.total ?? 0}
            onPageChange={setPlanPage}
            createRequest={requestFor('plan')}
            onCreateRequestHandled={clearCreateRequest}
          />
        </TabsContent>

        <TabsContent value="assets" className={panelClass}>
          <HomeAssetRegistry
            assets={assets}
            properties={properties}
            isLoading={assetsQuery.isLoading || propertiesQuery.isLoading}
            error={assetsQuery.error as Error | null}
            page={assetPage}
            pageSize={ASSET_PAGE_SIZE}
            total={assetsQuery.data?.total ?? 0}
            selectedPropertyId={assetPropertyId}
            onPageChange={setAssetPage}
            onSelectedPropertyChange={(propertyId) => {
              setAssetPropertyId(propertyId);
              setAssetPage(1);
            }}
            createRequest={requestFor('asset')}
            onCreateRequestHandled={clearCreateRequest}
          />
        </TabsContent>

        <TabsContent value="utilities" className={panelClass}>
          <HomeManagementUtilities
            properties={properties}
            scopePropertyId={scopePropertyId}
            recordOnly={recordOnly}
            createRequest={utilitiesRequest}
            onCreateRequestHandled={clearCreateRequest}
            onRaiseWorkOrder={(from) =>
              requestCreate('work-order', {
                propertyId: from.propertyId,
                assetId: from.assetId ?? '',
                category: 'WATER_BOREHOLE',
                issueTitle: from.sourceName
                  ? `Treat the water from ${from.sourceName}`
                  : 'Treat the water after a failed water test',
                description: `The latest water test (${from.labName}) failed. Treat the water, then book a retest.`,
              })
            }
          />
        </TabsContent>

        <TabsContent value="service-standards" className={panelClass}>
          <HomeManagementSlaPolicies
            properties={properties}
            isPropertiesLoading={propertiesQuery.isLoading}
            createRequest={requestFor('policy')}
            onCreateRequestHandled={clearCreateRequest}
          />
        </TabsContent>

        <TabsContent value="history" className={`space-y-10 ${panelClass}`}>
          <HomeManagementTimeline propertyId={scopePropertyId} />

          <HomeManagementInspectionFeed propertyId={scopePropertyId} />

          {/* The records panel links to owner/landlord routes the agency portal lacks, so managers don't get it. */}
          {role !== 'manager' && <HomeManagementRecordsPanel role={role} />}

          {role === 'landlord' && (
            <HomeManagementVendorPerformance vendors={vendors} isLoading={vendorsQuery.isLoading} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
