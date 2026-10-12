import { mapTiles } from '@getrentos/shared';

describe('mapTiles', () => {
  it('falls back to OpenStreetMap without a token', () => {
    const tiles = mapTiles(undefined, 'light');
    expect(tiles.provider).toBe('osm');
    expect(tiles.url).toContain('tile.openstreetmap.org');
    expect(tiles.needsDarkFilter).toBe(false);
    expect(mapTiles('', 'dark').needsDarkFilter).toBe(true);
  });

  it('ignores anything that is not a public Mapbox token', () => {
    // A secret token (sk.) must never be shipped in a page.
    expect(mapTiles('sk.abc123', 'light').provider).toBe('osm');
    expect(mapTiles('pk.abc"><script>', 'light').provider).toBe('osm');
  });

  it('uses Mapbox styles with a public token', () => {
    const light = mapTiles(' pk.eyJ1Ijoi.abc-123 ', 'light');
    expect(light.provider).toBe('mapbox');
    expect(light.url).toBe(
      'https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/512/{z}/{x}/{y}@2x?access_token=pk.eyJ1Ijoi.abc-123'
    );
    expect(light).toMatchObject({ tileSize: 512, zoomOffset: -1, needsDarkFilter: false });
    expect(light.attribution).toContain('Improve this map');
    expect(mapTiles('pk.abc', 'dark').url).toContain('/dark-v11/');
  });
});
