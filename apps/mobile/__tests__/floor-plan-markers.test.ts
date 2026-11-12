import { containedRect, markerLabel, numberedMarkers, pointInRect } from '@/lib/floorPlanMarkers';

describe('containedRect', () => {
  it('letterboxes a wide plan top and bottom', () => {
    expect(containedRect({ width: 400, height: 800 }, { width: 2000, height: 1000 })).toEqual({
      left: 0,
      top: 300,
      width: 400,
      height: 200,
    });
  });

  it('pillarboxes a tall plan left and right', () => {
    expect(containedRect({ width: 800, height: 400 }, { width: 1000, height: 2000 })).toEqual({
      left: 300,
      top: 0,
      width: 200,
      height: 400,
    });
  });

  it('scales up a small plan to fill the box', () => {
    expect(containedRect({ width: 300, height: 300 }, { width: 100, height: 100 })).toEqual({
      left: 0,
      top: 0,
      width: 300,
      height: 300,
    });
  });

  it('is null until both sizes are known and positive', () => {
    expect(containedRect(null, { width: 10, height: 10 })).toBeNull();
    expect(containedRect({ width: 10, height: 10 }, null)).toBeNull();
    expect(containedRect({ width: 0, height: 10 }, { width: 10, height: 10 })).toBeNull();
    expect(containedRect({ width: 10, height: 10 }, { width: 10, height: 0 })).toBeNull();
  });
});

describe('pointInRect', () => {
  const rect = { left: 0, top: 300, width: 400, height: 200 };

  it('places percentages against the drawn image, not the box', () => {
    expect(pointInRect(rect, 0, 0)).toEqual({ x: 0, y: 300 });
    expect(pointInRect(rect, 50, 50)).toEqual({ x: 200, y: 400 });
    expect(pointInRect(rect, 100, 100)).toEqual({ x: 400, y: 500 });
  });

  it('keeps a point on the image', () => {
    expect(pointInRect(rect, -10, 120)).toEqual({ x: 0, y: 500 });
  });
});

describe('numberedMarkers', () => {
  it('numbers by list order and skips rooms with no place on the plan', () => {
    const rooms = [
      { id: 'a', name: 'Living room', x: 10, y: 20 },
      { id: 'b', name: 'Kitchen' },
      { id: 'c', name: 'Bedroom', x: 0, y: 0 },
    ];
    expect(numberedMarkers(rooms).map((m) => [m.room.id, m.number])).toEqual([
      ['a', 1],
      ['c', 3],
    ]);
  });
});

describe('markerLabel', () => {
  it('says the photo opens only when there is one', () => {
    expect(markerLabel(1, 'Living room', true)).toBe('1. Living room, open its photo');
    expect(markerLabel(2, 'Kitchen', false)).toBe('2. Kitchen');
  });
});
