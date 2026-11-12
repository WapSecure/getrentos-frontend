import {
  ENQUIRY_STATUS_TONE,
  NO_UNIT_LABEL,
  SEND_FAILED,
  SEND_TOO_OFTEN,
  developmentRoute,
  developmentRouteForPath,
  enquiryBody,
  rememberAskIntent,
  sendProblem,
  takeAskIntent,
  unitTypeChoices,
} from '@/lib/askDeveloper';
import { routeForActionUrl, routeForNotification } from '@/lib/notificationRoutes';

const ID = '3f1c2a7e-8b4d-4c1a-9e2f-1a2b3c4d5e6f';
const SCREEN = `/(public)/development/${ID}`;

function apiError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

describe('ask the developer', () => {
  it('opens the development screen from its web path, with host, query or hash', () => {
    expect(developmentRoute(ID)).toBe(SCREEN);
    expect(developmentRouteForPath(`/developments/${ID}#your-questions`)).toBe(SCREEN);
    expect(developmentRouteForPath(`https://getsureground.io/developments/${ID}/?x=1`)).toBe(
      SCREEN
    );
    expect(developmentRouteForPath('/developments/not-an-id')).toBeNull();
    expect(developmentRouteForPath('/developments')).toBeNull();
    expect(developmentRouteForPath(`/developments/${ID}/edit`)).toBeNull();
    expect(developmentRouteForPath(null)).toBeNull();
  });

  it('routes an answered question to the development, by link or by id', () => {
    expect(routeForActionUrl(`/developments/${ID}#your-questions`)).toBe(SCREEN);
    expect(
      routeForNotification(
        {
          type: 'DEVELOPMENT_ENQUIRY_ANSWERED',
          actionUrl: `/developments/${ID}#your-questions`,
        },
        'buyer'
      )
    ).toBe(SCREEN);
    expect(
      routeForNotification({ type: 'DEVELOPMENT_ENQUIRY_ANSWERED', developmentId: ID }, 'renter')
    ).toBe(SCREEN);
    expect(
      routeForNotification({ type: 'DEVELOPMENT_ENQUIRY_ANSWERED', developmentId: 'x' }, 'buyer')
    ).toBe('/(app)/notifications');
  });

  it('returns to the development once after sign-in, and forgets a stale or bad intent', () => {
    rememberAskIntent(ID, 1_000);
    expect(takeAskIntent(2_000)).toBe(SCREEN);
    expect(takeAskIntent(3_000)).toBeNull();

    rememberAskIntent(ID, 0);
    expect(takeAskIntent(31 * 60 * 1000)).toBeNull();

    rememberAskIntent('nope', 0);
    expect(takeAskIntent(1)).toBeNull();
  });

  it('offers "none in particular" first, and no picker without unit types', () => {
    expect(unitTypeChoices([])).toEqual([]);
    expect(unitTypeChoices([{ id: 'u1', name: '3 bed terrace' }])).toEqual([
      { id: undefined, label: NO_UNIT_LABEL },
      { id: 'u1', label: '3 bed terrace' },
    ]);
  });

  it('sends a trimmed message, and a unit type only when one is picked', () => {
    expect(enquiryBody('  Is the first instalment refundable?  ')).toEqual({
      message: 'Is the first instalment refundable?',
    });
    expect(enquiryBody('Is parking included?', 'u1')).toEqual({
      message: 'Is parking included?',
      unitTypeId: 'u1',
    });
  });

  it("shows the API's own words, including the rate limit message", () => {
    expect(sendProblem(apiError('You have asked a lot of questions today.', 429))).toBe(
      'You have asked a lot of questions today.'
    );
    expect(sendProblem(apiError('', 429))).toBe(SEND_TOO_OFTEN);
    expect(sendProblem(apiError('This development is not live.', 400))).toBe(
      'This development is not live.'
    );
    expect(sendProblem(apiError('Network request failed', 0))).toBe(SEND_FAILED);
    expect(sendProblem(new Error('boom'))).toBe(SEND_FAILED);
    expect(sendProblem(undefined)).toBe(SEND_FAILED);
  });

  it('gives each status a badge tone', () => {
    expect(ENQUIRY_STATUS_TONE).toEqual({ NEW: 'warning', ANSWERED: 'success', CLOSED: 'neutral' });
  });
});
