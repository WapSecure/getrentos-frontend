import { toQuery } from '@/lib/api/query';

describe('toQuery', () => {
  it('builds a query string and leaves out empty values', () => {
    expect(toQuery({ page: 2, search: 'lekki', status: undefined, x: null, y: '' })).toBe(
      '?page=2&search=lekki'
    );
    expect(toQuery({})).toBe('');
  });

  it('drops false (an unticked filter) but keeps true', () => {
    expect(toQuery({ verified: false, furnished: true })).toBe('?furnished=true');
  });

  it('joins arrays and skips empty ones', () => {
    expect(toQuery({ amenities: ['pool', 'gym'], tags: [] })).toBe('?amenities=pool%2Cgym');
  });

  it('encodes values', () => {
    expect(toQuery({ q: 'a&b c' })).toBe('?q=a%26b+c');
  });
});
