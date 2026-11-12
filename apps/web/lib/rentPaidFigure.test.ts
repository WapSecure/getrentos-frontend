import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rentPaidFigure } from './rentPaidFigure';

test('no figure while the payments are loading', () => {
  assert.deepEqual(rentPaidFigure(undefined, { isLoading: true, isError: false }), {
    state: 'loading',
  });
});

test('a failed or empty load is not ₦0 paid', () => {
  assert.deepEqual(rentPaidFigure(undefined, { isLoading: false, isError: true }), {
    state: 'error',
  });
  assert.deepEqual(rentPaidFigure(undefined, { isLoading: false, isError: false }), {
    state: 'error',
  });
});

test('uses the summary total, falling back to paid items', () => {
  assert.deepEqual(
    rentPaidFigure({ summary: { totalPaidNaira: 400_000 } }, { isLoading: false, isError: false }),
    { state: 'ready', naira: 400_000 }
  );
  assert.deepEqual(
    rentPaidFigure(
      {
        items: [
          { status: 'paid', amount: 150_000 },
          { status: 'pending', amount: 150_000 },
        ],
      },
      { isLoading: false, isError: false }
    ),
    { state: 'ready', naira: 150_000 }
  );
});
