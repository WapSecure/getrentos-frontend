import { mapTiles } from '@sureground/shared';

export const WEB_MAP_TILES = mapTiles(process.env.NEXT_PUBLIC_MAPBOX_TOKEN, 'light');

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Leaflet is loaded at runtime
export function addBaseTiles(L: any, map: any): void {
  const { url, attribution, maxZoom, tileSize, zoomOffset } = WEB_MAP_TILES;
  L.tileLayer(url, { attribution, maxZoom, tileSize, zoomOffset }).addTo(map);
}
