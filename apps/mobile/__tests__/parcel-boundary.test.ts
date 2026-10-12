import {
  boundaryAreaMismatch,
  boundaryAreaSqm,
  boundaryCorners,
  boundaryGeometry,
} from '@getrentos/shared';

const square = [
  { latitude: 6.44, longitude: 3.47 },
  { latitude: 6.44, longitude: 3.4709 },
  { latitude: 6.4391, longitude: 3.4709 },
  { latitude: 6.4391, longitude: 3.47 },
];

describe('parcel boundary', () => {
  it('round-trips corners through the stored polygon', () => {
    const geometry = boundaryGeometry(square)!;
    expect(geometry.coordinates[0]).toHaveLength(5);
    expect(boundaryCorners(geometry)).toEqual(square);
    expect(boundaryCorners({ type: 'Feature', geometry })).toEqual(square);
  });

  it('has no outline for fewer than 3 corners or unknown shapes', () => {
    expect(boundaryGeometry(square.slice(0, 2))).toBeNull();
    expect(boundaryCorners({ type: 'Point', coordinates: [3.47, 6.44] })).toBeNull();
    expect(boundaryCorners(null)).toBeNull();
    expect(boundaryCorners({ type: 'Polygon', coordinates: [[[3.47, 'x']]] })).toBeNull();
  });

  it('measures a plot roughly 100 m on a side', () => {
    // 0.0009° is about 99.5 m of latitude and 99 m of longitude near Lagos.
    const area = boundaryAreaSqm(square);
    expect(area).toBeGreaterThan(9_700);
    expect(area).toBeLessThan(10_000);
  });

  it('flags an outline far from the stated area, in any unit, and nothing close', () => {
    // The square is about one hectare.
    expect(boundaryAreaMismatch(square, 1, 'HECTARE')).toBeNull();
    expect(boundaryAreaMismatch(square, 2.5, 'ACRE')).toBeNull();
    expect(boundaryAreaMismatch(square, 9_000, 'SQUARE_METERS')).toBeNull();

    const typo = boundaryAreaMismatch(square, 600, 'SQUARE_METERS');
    expect(typo?.ratio).toBeGreaterThan(15);
    expect(boundaryAreaMismatch(square, 3, 'HECTARE')?.ratio).toBeLessThan(0.4);
  });

  it('has nothing to compare without an outline or a stated area', () => {
    expect(boundaryAreaMismatch(square.slice(0, 2), 600, 'SQUARE_METERS')).toBeNull();
    expect(boundaryAreaMismatch(square, 0, 'SQUARE_METERS')).toBeNull();
  });
});
