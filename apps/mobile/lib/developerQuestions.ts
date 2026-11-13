import { formatLocation } from '@sureground/shared';
import {
  DEVELOPMENT_ENQUIRY_COPY,
  DEVELOPMENT_ENQUIRY_STATUS_LABEL,
  type BuyerDevelopmentEnquiry,
  type BuyerDevelopmentEnquiryPage,
  type DevelopmentEnquiryStatus,
} from '@sureground/shared/showroom';
import { developmentRoute } from './askDeveloper';

/**
 * Pure helpers for "Questions to developers", the buyer's questions across every development, as on
 * the web's /buyer/developer-questions. Copy and mappers come from the shared `developmentEnquiries.ts`.
 */

export const DEVELOPER_QUESTIONS_ROUTE = '/(app)/developer-questions';
export const DEVELOPER_QUESTIONS_PAGE_SIZE = 10;

/** "Waiting for an answer", "Answered" or "Closed", the buyer's wording on the web. */
export const questionStatusLabel = (status: DevelopmentEnquiryStatus) =>
  DEVELOPMENT_ENQUIRY_STATUS_LABEL[status].buyer;

/**
 * Every loaded page as one list, newest first. A question asked while paging shifts the later pages
 * by one, so the same question can come back twice; it is shown once.
 */
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

/** The next page to load, or undefined once every question has been loaded (or a page came back empty). */
export function nextQuestionsPage(
  last: Pick<BuyerDevelopmentEnquiryPage, 'items' | 'page' | 'pageSize' | 'total'>
): number | undefined {
  if (last.items.length === 0) return undefined;
  return last.page * last.pageSize < last.total ? last.page + 1 : undefined;
}

/** "Palm Developers · Lekki, Lagos", with "No longer listed on Sureground" once the page is gone. */
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

/** The development screen while it is still listed; nothing to open once it is not. */
export const questionDevelopmentRoute = (e: Pick<BuyerDevelopmentEnquiry, 'development'>) =>
  e.development.live ? developmentRoute(e.development.id) : null;
