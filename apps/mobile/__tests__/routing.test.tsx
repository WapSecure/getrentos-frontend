import { getMockConfig } from 'expo-router/testing-library';

describe('critical deep links', () => {
  it('generates navigation entries for critical detail and landlord routes', () => {
    const config = getMockConfig(['index', '(app)/property/[id]', '(app)/landlord-applications']);
    const serialized = JSON.stringify(config);

    expect(serialized).toContain('property/:id');
    expect(serialized).toContain('landlord-applications');
  });
});
