import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FLOOR_PLAN_MEASUREMENT_LABEL,
  floorPlanFor,
  floorPlansOf,
  formatMetres,
  roomSizeLabel,
} from '../src/showroom/floorPlans.ts';
import { fromRental, fromSale } from '../src/showroom/map.ts';
import type { MediaItem } from '../src/showroom/types.ts';

const photo = (id: string, order: number, extra: Partial<MediaItem> = {}): MediaItem => ({
  id,
  kind: 'image',
  url: `https://cdn.test/${id}.jpg`,
  order,
  ...extra,
});

const media = [
  photo('img_living', 0, { room: 'living' }),
  photo('img_plan', 1, { room: 'floor_plan', caption: 'Ground floor' }),
];

const apiPlan = {
  id: 'plan-1',
  levelName: 'Ground floor',
  imageMediaId: 'img_plan',
  measurementStatus: 'ESTIMATED',
  rooms: [
    {
      id: 'room-1',
      name: 'Living room',
      widthM: 4.2,
      lengthM: 3.8,
      photoMediaId: 'img_living',
      planX: 20,
      planY: 30,
    },
    { id: 'room-2', name: 'Store', widthM: 2 },
    { id: 'room-3', name: 'Hall', photoMediaId: 'img_gone', planX: 120, planY: 4 },
  ],
};

test('floor plans: rooms keep only whole sizes, known photos and on-plan targets', () => {
  const [plan] = floorPlansOf([apiPlan], media);
  assert.deepEqual(plan, {
    id: 'plan-1',
    levelName: 'Ground floor',
    imageMediaId: 'img_plan',
    measurement: 'estimated',
    rooms: [
      {
        id: 'room-1',
        name: 'Living room',
        widthM: 4.2,
        lengthM: 3.8,
        photoMediaId: 'img_living',
        x: 20,
        y: 30,
      },
      { id: 'room-2', name: 'Store' },
      { id: 'room-3', name: 'Hall' },
    ],
  });
});

test('floor plans: a level whose plan image is not in the media is dropped', () => {
  assert.deepEqual(floorPlansOf([{ ...apiPlan, imageMediaId: 'img_other' }], media), []);
  assert.deepEqual(floorPlansOf('nope', media), []);
  assert.deepEqual(floorPlansOf(undefined, media), []);
});

test('floor plans: checked only with CHECKED and a real check time', () => {
  const at = '2026-11-11T10:00:00.000Z';
  assert.equal(
    floorPlansOf([{ ...apiPlan, measurementStatus: 'CHECKED' }], media)[0]!.measurement,
    'estimated'
  );
  assert.equal(
    floorPlansOf([{ ...apiPlan, measurementStatus: 'CHECKED', checkedAt: 'soon' }], media)[0]!
      .measurement,
    'estimated'
  );
  const checked = floorPlansOf(
    [{ ...apiPlan, measurementStatus: 'CHECKED', checkedAt: at }],
    media
  )[0]!;
  assert.equal(checked.measurement, 'checked');
  assert.equal(checked.checkedAt, at);
});

test('floor plans: every size carries its label, and there is no area', () => {
  assert.equal(
    roomSizeLabel({ widthM: 4.2, lengthM: 3.8 }, 'estimated'),
    'about 4.2 × 3.8 m (estimated)'
  );
  assert.equal(
    roomSizeLabel({ widthM: 4.2, lengthM: 3.8 }, 'checked'),
    '4.2 × 3.8 m (measured, checked by Sureground)'
  );
  assert.equal(roomSizeLabel({ widthM: 4.2 }, 'estimated'), undefined);
  assert.equal(roomSizeLabel({}, 'checked'), undefined);
  assert.doesNotMatch(roomSizeLabel({ widthM: 4, lengthM: 3 }, 'estimated')!, /m²|sqm|12/);
  assert.equal(FLOOR_PLAN_MEASUREMENT_LABEL.estimated, 'Estimated');
  assert.equal(FLOOR_PLAN_MEASUREMENT_LABEL.checked, 'Measured, checked by Sureground');
  assert.doesNotMatch(FLOOR_PLAN_MEASUREMENT_LABEL.estimated, /verified/i);
});

test('floor plans: metres show at most two decimals', () => {
  assert.equal(formatMetres(4.2), '4.2');
  assert.equal(formatMetres(3.85), '3.85');
  assert.equal(formatMetres(4), '4');
  assert.equal(formatMetres(12.5), '12.5');
});

test('floor plans: rental and sale carry them only when there is a level', () => {
  const rental = fromRental({
    id: 'r1',
    title: 'Flat',
    location: 'Lekki, Lagos',
    price: 1,
    period: 'year',
    media,
    floorPlans: [apiPlan],
  });
  assert.equal(rental.floorPlans?.length, 1);
  assert.equal(floorPlanFor(rental.floorPlans, 'img_plan')?.id, 'plan-1');
  assert.equal(floorPlanFor(rental.floorPlans, 'img_living'), undefined);

  const sale = fromSale({ id: 's1', title: 'House', price: 1, media, floorPlans: [] });
  assert.equal('floorPlans' in sale, false);
});
