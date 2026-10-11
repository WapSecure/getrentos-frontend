/**
 * Which map tiles the apps draw. With a Mapbox public token (pk.…) the maps
 * use Mapbox's streets and dark styles, which are licensed for production
 * traffic; without one they fall back to the OpenStreetMap community tiles,
 * which are fine for development but not for heavy production use.
 */
export interface MapTiles {
  provider: 'mapbox' | 'osm';
  url: string;
  attribution: string;
  maxZoom: number;
  /** Leaflet tile options: Mapbox serves 512px tiles, one zoom level up. */
  tileSize: number;
  zoomOffset: number;
  /** OSM has no dark style, so the page darkens it with a CSS filter. */
  needsDarkFilter: boolean;
}

const MAPBOX_TOKEN = /^pk\.[A-Za-z0-9._-]+$/;

export function mapTiles(token: string | null | undefined, scheme: 'light' | 'dark'): MapTiles {
  const trimmed = token?.trim();
  if (trimmed && MAPBOX_TOKEN.test(trimmed)) {
    const style = scheme === 'dark' ? 'dark-v11' : 'streets-v12';
    return {
      provider: 'mapbox',
      url: `https://api.mapbox.com/styles/v1/mapbox/${style}/tiles/512/{z}/{x}/{y}@2x?access_token=${encodeURIComponent(trimmed)}`,
      attribution:
        '&copy; <a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noopener">Mapbox</a> ' +
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> ' +
        '<a href="https://www.mapbox.com/map-feedback/" target="_blank" rel="noopener"><strong>Improve this map</strong></a>',
      maxZoom: 20,
      tileSize: 512,
      zoomOffset: -1,
      needsDarkFilter: false,
    };
  }
  return {
    provider: 'osm',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    maxZoom: 19,
    tileSize: 256,
    zoomOffset: 0,
    needsDarkFilter: scheme === 'dark',
  };
}
