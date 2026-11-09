// Dates are local yyyy-MM-dd; noon avoids DST edges.

export const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function nightsBetween(start: string, end: string): string[] {
  const out: string[] = [];
  const d = new Date(`${start.slice(0, 10)}T12:00:00`);
  const last = new Date(`${end.slice(0, 10)}T12:00:00`);
  while (d <= last && out.length < 800) {
    out.push(isoDay(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export const shiftDay = (iso: string, by: number) => {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  d.setDate(d.getDate() + by);
  return isoDay(d);
};

// The API's end date is exclusive, so the nights taken are start … end − 1.
export const occupied = (start: string, endExclusive: string) =>
  nightsBetween(start, shiftDay(endExclusive, -1));
