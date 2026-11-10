'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DataTable,
  EmptyState,
  PageErrorState,
  PageHeader,
  SegmentedControl,
  StatGridSkeleton,
  StatGroup,
  type Column,
  type StatGroupItem,
} from '@sureground/ui';
import { BarChart3 } from '@sureground/icons';
import { unwrap } from '@sureground/shared';
import { adminService } from '@/services/adminService';
import { adminKeys } from '@/lib/queryKeys';
import type { FunnelMarket, FunnelMarketReport, FunnelStep } from '@/types/showroomFunnel';

type Period = '7' | '30' | '90';
type MarketChoice = Exclude<FunnelMarket, 'unspecified'>;

const PERIODS = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
] as const;

const MARKETS = [
  { value: 'all', label: 'All' },
  { value: 'rent', label: 'Rent' },
  { value: 'sale', label: 'Sale' },
  { value: 'land', label: 'Land' },
  { value: 'shortlet', label: 'Shortlet' },
] as const;

const EVENT_LABEL: Record<string, string> = {
  property_impression: 'Listing card seen',
  property_card_click: 'Listing card opened',
  property_detail_view: 'Listing page viewed',
  gallery_open: 'Gallery opened',
  media_category_select: 'Room picked',
  video_start: 'Video started',
  video_complete: 'Video finished',
  tour_start: '360 tour opened',
  floor_plan_view: 'Floor plan viewed',
  property_save: 'Saved',
  property_compare: 'Added to compare',
  property_share: 'Shared',
  inquiry_start: 'Enquiry started',
  inspection_request_start: 'Viewing request started',
  booking_start: 'Booking started',
  offer_start: 'Offer started',
};

const OUTCOME_LABEL: Record<string, string> = {
  viewingRequests: 'Viewing requests',
  applications: 'Applications',
  offers: 'Offers',
  viewings: 'Viewings booked',
  siteTours: 'Site tours',
  inspectionsRequested: 'Inspections requested',
  bookingsCreated: 'Bookings made',
  bookingsConfirmed: 'Bookings confirmed',
};

// Next action that matters for each market; "all" shows every one.
const NEXT_STEPS: Record<MarketChoice, (keyof FunnelMarketReport['funnel'])[]> = {
  all: [
    'detailViewToInquiry',
    'detailViewToInspectionRequest',
    'detailViewToOffer',
    'detailViewToBooking',
  ],
  rent: ['detailViewToInquiry', 'detailViewToInspectionRequest'],
  sale: ['detailViewToOffer', 'detailViewToInspectionRequest'],
  land: ['detailViewToOffer', 'detailViewToInspectionRequest'],
  shortlet: ['detailViewToBooking'],
};

const STEP_LABEL: Record<keyof FunnelMarketReport['funnel'], string> = {
  impressionToDetailView: 'Saw a card, then opened the listing',
  detailViewToInquiry: 'Opened, then started an enquiry',
  detailViewToInspectionRequest: 'Opened, then asked for a viewing',
  detailViewToOffer: 'Opened, then started an offer',
  detailViewToBooking: 'Opened, then started a booking',
};

const percent = (step: FunnelStep) =>
  step.rate === null ? '—' : `${(Math.round(step.rate * 1000) / 10).toLocaleString('en-NG')}%`;

const stepItem = (label: string, step: FunnelStep): StatGroupItem => ({
  label,
  value: percent(step),
  subtitle: `${step.converted.toLocaleString('en-NG')} of ${step.sessions.toLocaleString('en-NG')} sessions`,
});

// The window is fixed when the period is picked, so the query key stays stable while the page is open.
const rangeFor = (days: number) => {
  const to = new Date();
  to.setMinutes(0, 0, 0);
  to.setHours(to.getHours() + 1);
  return { from: new Date(to.getTime() - days * 86_400_000).toISOString(), to: to.toISOString() };
};

type EventRow = { name: string; count: number; sessions: number };

const EVENT_COLUMNS: Column<EventRow>[] = [
  { key: 'name', header: 'Event', render: (row) => EVENT_LABEL[row.name] ?? row.name },
  {
    key: 'count',
    header: 'Times',
    numeric: true,
    render: (row) => row.count.toLocaleString('en-NG'),
  },
  {
    key: 'sessions',
    header: 'Sessions',
    numeric: true,
    render: (row) => row.sessions.toLocaleString('en-NG'),
  },
];

export default function ShowroomFunnelPage() {
  const [period, setPeriod] = useState<Period>('30');
  const [range, setRange] = useState(() => rangeFor(30));
  const [market, setMarket] = useState<MarketChoice>('all');

  const query = useQuery({
    queryKey: adminKeys.showroomFunnel(range.from, range.to),
    queryFn: () => unwrap(adminService.getShowroomFunnel(range)),
  });

  const report = query.data?.markets.find((m) => m.market === market);
  const events: EventRow[] = report
    ? Object.entries(report.events)
        .map(([name, v]) => ({ name, ...v }))
        .filter((row) => row.count > 0)
        .sort((a, b) => b.count - a.count)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Listing funnel"
        description="How visitors move from listing cards to enquiries, viewings, offers and bookings. Counts sessions, never people."
        actions={
          <SegmentedControl<Period>
            value={period}
            onValueChange={(next) => {
              setPeriod(next);
              setRange(rangeFor(Number(next)));
            }}
            segments={PERIODS}
            aria-label="Period"
            size="sm"
          />
        }
      />

      <SegmentedControl<MarketChoice>
        value={market}
        onValueChange={setMarket}
        segments={MARKETS}
        aria-label="Market"
      />

      {query.isLoading ? (
        <StatGridSkeleton className="grid-cols-1 gap-3 lg:grid-cols-2" />
      ) : query.isError || !query.data ? (
        <PageErrorState
          title="Funnel unavailable"
          description="The listing funnel could not be loaded."
          onRetry={() => query.refetch()}
          isRetrying={query.isFetching}
        />
      ) : !report || events.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No listing activity in this period"
          description="Events appear here as visitors browse listings on the web app."
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <StatGroup
              className="lg:col-span-2"
              title="Funnel"
              items={[
                stepItem(STEP_LABEL.impressionToDetailView, report.funnel.impressionToDetailView),
                ...NEXT_STEPS[market].map((key) => stepItem(STEP_LABEL[key], report.funnel[key])),
              ]}
            />
            <StatGroup
              title="Media on listing pages"
              items={[
                stepItem('Opened the gallery', report.media.galleryOpen),
                stepItem('Started the video tour', report.media.videoStart),
                stepItem('Opened the 360 tour', report.media.tourStart),
              ]}
            />
            {report.outcomes && (
              <StatGroup
                title="Outcomes recorded"
                footer="From the platform's own records for the same period, not from browser events."
                items={Object.entries(report.outcomes).map(([key, value]) => ({
                  label: OUTCOME_LABEL[key] ?? key,
                  value: value.toLocaleString('en-NG'),
                }))}
              />
            )}
            <StatGroup
              title="Sessions by device"
              items={(['phone', 'tablet', 'desktop'] as const).map((device) => ({
                label: device[0]!.toUpperCase() + device.slice(1),
                value: report.devices[device].toLocaleString('en-NG'),
              }))}
            />
          </div>
          <DataTable
            columns={EVENT_COLUMNS}
            data={events}
            getRowKey={(row) => row.name}
            caption="Listing events in this period"
            variant="card"
          />
        </>
      )}
    </div>
  );
}
