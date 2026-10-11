import { mapTiles } from '@getrentos/shared';

/** The web maps' tiles: Mapbox when NEXT_PUBLIC_MAPBOX_TOKEN is set, else OpenStreetMap. */
export const WEB_MAP_TILES = mapTiles(process.env.NEXT_PUBLIC_MAPBOX_TOKEN, 'light');

/** Adds the base map to a Leaflet map. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Leaflet is loaded at runtime
export function addBaseTiles(L: any, map: any): void {
  const { url, attribution, maxZoom, tileSize, zoomOffset } = WEB_MAP_TILES;
  L.tileLayer(url, { attribution, maxZoom, tileSize, zoomOffset }).addTo(map);
}
