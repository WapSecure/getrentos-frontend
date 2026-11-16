export type FunnelMarket = 'all' | 'rent' | 'sale' | 'land' | 'shortlet' | 'unspecified';

export interface FunnelStep {
  sessions: number;
  converted: number;
  rate: number | null;
}

export interface FunnelMarketReport {
  market: FunnelMarket;
  events: Record<string, { count: number; sessions: number }>;
  funnel: {
    impressionToDetailView: FunnelStep;
    detailViewToInquiry: FunnelStep;
    detailViewToInspectionRequest: FunnelStep;
    detailViewToBooking: FunnelStep;
    detailViewToOffer: FunnelStep;
  };
  media: { galleryOpen: FunnelStep; videoStart: FunnelStep; tourStart: FunnelStep };
  devices: { phone: number; tablet: number; desktop: number };
  outcomes?: Record<string, number>;
}

export interface ShowroomFunnelReport {
  from: string;
  to: string;
  market: FunnelMarket | null;
  generatedAt: string;
  markets: FunnelMarketReport[];
}
