// Sureground Diaspora Invest: the investor profile, risk acknowledgement and workspace overview.
// The shapes live in @sureground/shared so web and mobile read one copy.
export {
  BUDGET_BANDS,
  DISPLAY_CURRENCIES,
  INTENDED_USES,
  INVESTMENT_HORIZONS,
  INVESTOR_PROPERTY_TYPES,
  OWNERSHIP_STRUCTURES,
  SUMMARY_CHANNELS,
  SUMMARY_FREQUENCIES,
  type BudgetBand,
  type DisplayCurrency,
  type IntendedUse,
  type InvestmentHorizon,
  type InvestorAvailability,
  type InvestorOverview,
  type InvestorPortfolio,
  type InvestorProfile,
  type InvestorProfileField,
  type InvestorProfileInput,
  type InvestorPropertyType,
  type InvestorStatementSummary,
  type InvestorStatusCounts,
  type OwnershipStructure,
  type RiskDeclaration,
  type SummaryChannel,
  type SummaryFrequency,
} from '@sureground/shared';

// Investment analysis of an eligible listing (DIA-19), naira only.

export type FigureSource = 'VERIFIED' | 'THIRD_PARTY_ESTIMATE' | 'YOUR_ASSUMPTION';

export interface AnalysisFigure {
  /** Whole naira, or a percentage; null when it cannot be worked out. */
  value: number | null;
  source: FigureSource;
  basis: string;
  asOf: string;
  methodologyVersion: string;
}

export interface AnalysisCostLine {
  key: 'PURCHASE_PRICE' | 'LEGAL_FEES' | 'AGENCY_FEE' | 'CONSENT_AND_REGISTRATION';
  label: string;
  ratePct: AnalysisFigure | null;
  amount: AnalysisFigure;
  range: { low: number; high: number } | null;
}

export interface AnalysisScenario {
  key: 'CAUTIOUS' | 'CENTRAL' | 'OPTIMISTIC';
  label: string;
  acquisitionCost: AnalysisFigure;
  annualRent: AnalysisFigure;
  netIncome: AnalysisFigure;
  grossYieldPct: AnalysisFigure;
  netYieldPct: AnalysisFigure;
  cashFlowNet: AnalysisFigure;
}

export interface ListingAnalysis {
  listingId: string;
  currency: 'NGN';
  methodologyVersion: string;
  asOf: string;
  costs: AnalysisCostLine[];
  acquisitionCost: AnalysisFigure;
  assumptions: Record<
    'annualRent' | 'vacancyPct' | 'rentGrowthPct' | 'maintenancePct' | 'managementFeePct',
    AnalysisFigure
  >;
  income: Record<
    'grossRent' | 'vacancy' | 'managementFee' | 'maintenance' | 'netIncome',
    AnalysisFigure
  >;
  grossYieldPct: AnalysisFigure;
  netYieldPct: AnalysisFigure;
  cashFlow: {
    years: number;
    rows: {
      year: number;
      grossRent: number;
      vacancy: number;
      managementFee: number;
      maintenance: number;
      net: number;
    }[];
    total: AnalysisFigure;
  };
  scenarios: AnalysisScenario[];
  methodology: string[];
  notIncluded: string[];
  disclaimer: string;
}

/** The investor's own figures; anything left out takes the default. Percentages are 0 to 100. */
export interface ListingAnalysisInput {
  annualRent?: number;
  vacancyPct?: number;
  rentGrowthPct?: number;
  maintenancePct?: number;
  managementFeePct?: number;
  legalFeesPct?: number;
  agencyFeePct?: number;
  consentPct?: number;
}
