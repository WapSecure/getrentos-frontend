import type { BuyerDevelopmentEnquiry } from '@sureground/shared/showroom';
import {
  DEVELOPER_QUESTIONS_ROUTE,
  mergeQuestionPages,
  nextQuestionsPage,
  questionDevelopmentLine,
  questionDevelopmentRoute,
  questionStatusLabel,
} from '@/lib/developerQuestions';
import { routeForActionUrl, routeForNotification } from '@/lib/notificationRoutes';

const DEV = '3f1c2a7e-8b4d-4c1a-9e2f-1a2b3c4d5e6f';

function question(id: string, live = true): BuyerDevelopmentEnquiry {
  return {
    id,
    development: {
      id: DEV,
      name: 'Palm Court',
      city: 'Lekki',
      state: 'Lagos',
      developerName: 'Palm Developers',
      live,
    },
    message: 'Is the first instalment refundable?',
    status: 'NEW',
    createdAt: '2026-11-12T09:00:00.000Z',
  };
}

describe('questions to developers', () => {
  it('labels each status in the buyer wording the web uses', () => {
    expect(questionStatusLabel('NEW')).toBe('Waiting for an answer');
    expect(questionStatusLabel('ANSWERED')).toBe('Answered');
    expect(questionStatusLabel('CLOSED')).toBe('Closed');
  });

  it('merges loaded pages in order and shows a question that shifted pages only once', () => {
    const merged = mergeQuestionPages([
      { items: [question('a'), question('b')] },
      { items: [question('b'), question('c')] },
    ]);
    expect(merged.map((q) => q.id)).toEqual(['a', 'b', 'c']);
    expect(mergeQuestionPages(undefined)).toEqual([]);
  });

  it('asks for the next page only while questions remain', () => {
    const items = [question('a')];
    expect(nextQuestionsPage({ items, page: 1, pageSize: 10, total: 25 })).toBe(2);
    expect(nextQuestionsPage({ items, page: 3, pageSize: 10, total: 25 })).toBeUndefined();
    expect(nextQuestionsPage({ items, page: 1, pageSize: 10, total: 10 })).toBeUndefined();
    expect(nextQuestionsPage({ items: [], page: 1, pageSize: 10, total: 25 })).toBeUndefined();
  });

  it('opens the development while it is listed, and says so once it is not', () => {
    expect(questionDevelopmentRoute(question('a'))).toBe(`/(public)/development/${DEV}`);
    expect(questionDevelopmentRoute(question('a', false))).toBeNull();
    expect(questionDevelopmentLine(question('a'))).toBe('Palm Developers · Lekki, Lagos');
    expect(questionDevelopmentLine(question('a', false))).toBe(
      'Palm Developers · Lekki, Lagos · No longer listed on Sureground'
    );
  });

  it('routes the answered notification to the screen for buyers, and the development for others', () => {
    expect(routeForActionUrl('/buyer/developer-questions')).toBe(DEVELOPER_QUESTIONS_ROUTE);
    expect(
      routeForNotification(
        {
          type: 'DEVELOPMENT_ENQUIRY_ANSWERED',
          actionUrl: '/buyer/developer-questions',
          developmentId: DEV,
        },
        'buyer'
      )
    ).toBe(DEVELOPER_QUESTIONS_ROUTE);
    expect(
      routeForNotification(
        {
          type: 'DEVELOPMENT_ENQUIRY_ANSWERED',
          actionUrl: `/developments/${DEV}#your-questions`,
          developmentId: DEV,
        },
        'renter'
      )
    ).toBe(`/(public)/development/${DEV}`);
  });

  it('leaves the developer reminder in the notification list: the app has no developer inbox', () => {
    expect(
      routeForNotification(
        {
          type: 'DEVELOPMENT_ENQUIRY_REMINDER',
          actionUrl: `/agency/developments/${DEV}#enquiries`,
          developmentId: DEV,
        },
        'manager'
      )
    ).toBe('/(app)/notifications');
  });
});
