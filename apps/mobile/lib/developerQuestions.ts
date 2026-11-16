import { formatLocation } from '@sureground/shared';
import {
  DEVELOPMENT_ENQUIRY_COPY,
  DEVELOPMENT_ENQUIRY_STATUS_LABEL,
  type BuyerDevelopmentEnquiry,
  type BuyerDevelopmentEnquiryPage,
  type DevelopmentEnquiryStatus,
} from '@sureground/shared/showroom';
import { developmentRoute } from './askDeveloper';

export const DEVELOPER_QUESTIONS_ROUTE = '/(app)/developer-questions';
export const DEVELOPER_QUESTIONS_PAGE_SIZE = 10;

export const questionStatusLabel = (status: DevelopmentEnquiryStatus) =>
  DEVELOPMENT_ENQUIRY_STATUS_LABEL[status].buyer;

/** A question asked while paging shifts the later pages by one, so a repeat is shown once. */
export function mergeQuestionPages(
  pages: Pick<BuyerDevelopmentEnquiryPage, 'items'>[] | undefined
): BuyerDevelopmentEnquiry[] {
  const seen = new Set<string>();
  const out: BuyerDevelopmentEnquiry[] = [];
  for (const page of pages ?? []) {
    for (const item of page.items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
    }
  }
  return out;
}

export function nextQuestionsPage(
  last: Pick<BuyerDevelopmentEnquiryPage, 'items' | 'page' | 'pageSize' | 'total'>
): number | undefined {
  if (last.items.length === 0) return undefined;
  return last.page * last.pageSize < last.total ? last.page + 1 : undefined;
}

export function questionDevelopmentLine(e: Pick<BuyerDevelopmentEnquiry, 'development'>): string {
  const d = e.development;
  return [
    d.developerName,
    formatLocation(d.city, d.state),
    d.live ? null : DEVELOPMENT_ENQUIRY_COPY.noLongerListed,
  ]
    .filter(Boolean)
    .join(' · ');
}

export const questionDevelopmentRoute = (e: Pick<BuyerDevelopmentEnquiry, 'development'>) =>
  e.development.live ? developmentRoute(e.development.id) : null;
