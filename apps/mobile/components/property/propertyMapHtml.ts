import { mapTiles, type BoundaryCorner } from '@getrentos/shared';
import { env } from '@/lib/env';

/**
 * The map page both PropertyMapView builds load: Leaflet on Mapbox tiles when
 * EXPO_PUBLIC_MAPBOX_TOKEN is set, OpenStreetMap otherwise. Phones host it in a WebView; the web build in an
 * iframe. Either way the app posts `{ markers, center, zoom, variant,
 * selectedId }` in, and the page posts `{ type: 'markerPress', id }` out.
 */
export interface PropertyMapMarker {
  id: string;
  latitude: number;
  longitude: number;
  /** Compact price label shown on the pin, e.g. "₦200K". */
  priceLabel?: string;
}

export interface PropertyMapViewProps {
  markers: PropertyMapMarker[];
  /** Explicit center; falls back to the first marker, then Lagos. */
  center?: { latitude: number; longitude: number };
  zoom?: number;
  /** Fixed height in px. Omit when the wrapping view's `style` already sizes it (e.g. `flex: 1`). */
  height?: number;
  /**
   * `price` = pill price tags for a multi-listing map. `location` = a single
   * pulsing pin for a property's exact spot. `area` = a shaded circle for a
   * property whose location is only approximate (unverified, or a short stay):
   * it shows the neighbourhood without pointing at a door.
   */
  variant?: 'price' | 'location' | 'area' | 'picker' | 'boundary';
  /** `picker` only: the pin was dragged or the map tapped to a new spot. */
  onPinMove?: (point: { latitude: number; longitude: number }) => void;
  /** `picker` only: change this to move the view to the pin (e.g. after a search). */
  recenter?: number;
  /**
   * A land plot's outline, drawn over any variant. With `variant="boundary"`
   * the owner edits it: a tap adds a corner and corners drag.
   */
  boundary?: BoundaryCorner[];
  /** `boundary` only: the outline was changed on the map. */
  onBoundaryChange?: (corners: BoundaryCorner[]) => void;
  selectedId?: string;
  onMarkerPress?: (id: string) => void;
  borderRadius?: number;
  style?: object;
}

export const LAGOS = { latitude: 6.5244, longitude: 3.3792 };

/** The corners in a `boundaryChanged` message from the map page; null if malformed. */
export function readBoundaryMessage(data: unknown): BoundaryCorner[] | null {
  const msg = data as { type?: unknown; corners?: unknown } | null;
  if (msg?.type !== 'boundaryChanged' || !Array.isArray(msg.corners)) return null;
  const corners: BoundaryCorner[] = [];
  for (const c of msg.corners as { latitude?: unknown; longitude?: unknown }[]) {
    if (typeof c?.latitude !== 'number' || typeof c?.longitude !== 'number') return null;
    corners.push({ latitude: c.latitude, longitude: c.longitude });
  }
  return corners;
}

/**
 * The circle drawn for an approximate location. The API moves such a point up
 * to 500 m from the real one, so a 600 m circle always contains the property.
 */
export const APPROXIMATE_RADIUS_METRES = 600;

export function buildMapHtml(
  scheme: 'light' | 'dark',
  primary: string,
  primaryForeground: string,
  card: string,
  foreground: string,
  border: string
) {
  const tiles = mapTiles(env.mapboxToken, scheme);
  const darkFilter = tiles.needsDarkFilter
    ? 'filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);'
    : '';
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; background: ${card}; }
  .leaflet-tile-pane { ${darkFilter} }
  .leaflet-control-attribution { font-size: 9px; }
  .rp-pin { position: relative; display: flex; align-items: center; justify-content: center; white-space: nowrap; font-family: -apple-system, Roboto, sans-serif; font-weight: 700; font-size: 12px; border-radius: 999px; padding: 6px 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.25); border: 1.5px solid ${border}; background: ${card}; color: ${foreground}; transform: scale(1); transition: transform 120ms ease; }
  .rp-pin.selected { background: ${primary}; color: ${primaryForeground}; border-color: ${primary}; transform: scale(1.12); }
  .rp-pin:after { content: ''; position: absolute; left: 50%; bottom: -5px; width: 9px; height: 9px; background: inherit; border-right: 1.5px solid ${border}; border-bottom: 1.5px solid ${border}; transform: translateX(-50%) rotate(45deg); border-radius: 0 0 3px 0; }
  .rp-pin.selected:after { border-color: ${primary}; }
  .rp-loc { position: relative; width: 22px; height: 22px; }
  .rp-loc .dot { position: absolute; inset: 0; margin: auto; width: 16px; height: 16px; border-radius: 50%; background: ${primary}; border: 3px solid ${card}; box-shadow: 0 1px 6px rgba(0,0,0,0.4); }
  .rp-loc .ring { position: absolute; inset: 0; border-radius: 50%; background: ${primary}; opacity: 0.25; animation: rp-pulse 2.2s ease-out infinite; }
  @keyframes rp-pulse { 0% { transform: scale(0.5); opacity: 0.35; } 100% { transform: scale(2.4); opacity: 0; } }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map', { zoomControl: true, attributionControl: true });
  L.tileLayer(${JSON.stringify(tiles.url)}, {
    maxZoom: ${tiles.maxZoom},
    tileSize: ${tiles.tileSize},
    zoomOffset: ${tiles.zoomOffset},
    attribution: ${JSON.stringify(tiles.attribution)}
  }).addTo(map);
  map.setView([${LAGOS.latitude}, ${LAGOS.longitude}], 11);

  var markerLayer = L.layerGroup().addTo(map);

  function post(msg) {
    var text = JSON.stringify(msg);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(text);
    // The web build hosts this page in an iframe: tell the page around it.
    else if (window.parent && window.parent !== window) window.parent.postMessage(text, '*');
  }

  function pricePinIcon(m, selected) {
    return L.divIcon({
      className: '',
      html: '<div class="rp-pin' + (selected ? ' selected' : '') + '">' + (m.priceLabel ? m.priceLabel : '₦') + '</div>',
      iconSize: null,
      iconAnchor: [20, 40]
    });
  }

  function locationPinIcon() {
    return L.divIcon({
      className: '',
      html: '<div class="rp-loc"><div class="ring"></div><div class="dot"></div></div>',
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
  }

  function cornerIcon() {
    return L.divIcon({
      className: '',
      html: '<div style="width:18px;height:18px;border-radius:50%;background:${card};border:3px solid ${primary};box-shadow:0 1px 4px rgba(0,0,0,0.35)"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
  }

  // The plot outline. Editable: a tap adds a corner, corners drag, and every
  // change is posted back for the app to keep.
  function drawBoundary(payload, editable) {
    var corners = (payload.boundary || []).filter(function (c) { return typeof c.latitude === 'number' && typeof c.longitude === 'number'; });
    var latlngs = corners.map(function (c) { return [c.latitude, c.longitude]; });
    if (corners.length >= 3) {
      L.polygon(latlngs, { color: '${primary}', weight: 2, fillColor: '${primary}', fillOpacity: 0.18, interactive: false }).addTo(markerLayer);
    } else if (corners.length === 2) {
      L.polyline(latlngs, { color: '${primary}', weight: 2, dashArray: '4 4', interactive: false }).addTo(markerLayer);
    }
    if (editable) {
      var send = function (next) { post({ type: 'boundaryChanged', corners: next }); };
      map.off('click');
      map.on('click', function (e) { send(corners.concat([{ latitude: e.latlng.lat, longitude: e.latlng.lng }])); });
      corners.forEach(function (c, i) {
        var handle = L.marker([c.latitude, c.longitude], { icon: cornerIcon(), draggable: true }).addTo(markerLayer);
        handle.on('dragend', function () {
          var ll = handle.getLatLng();
          var next = corners.slice();
          next[i] = { latitude: ll.lat, longitude: ll.lng };
          send(next);
        });
      });
    }
    // Frame the outline once; after that the view stays where the viewer put it.
    if (!window.__boundaryFitted) {
      if (corners.length >= 3) {
        map.fitBounds(L.latLngBounds(latlngs), { padding: [24, 24], maxZoom: 19 });
        window.__boundaryFitted = true;
      } else if (editable && payload.center) {
        map.setView([payload.center.latitude, payload.center.longitude], payload.zoom || 17);
        window.__boundaryFitted = true;
      }
    }
  }

  function render(payload) {
    markerLayer.clearLayers();
    if (payload.variant === 'boundary') {
      drawBoundary(payload, true);
      return;
    }
    var pts = (payload.markers || []).filter(function (m) { return typeof m.latitude === 'number' && typeof m.longitude === 'number'; });

    if (payload.variant === 'picker') {
      var start = pts[0]
        || (payload.center ? { latitude: payload.center.latitude, longitude: payload.center.longitude } : null);
      if (start) {
        var pin = L.marker([start.latitude, start.longitude], { icon: locationPinIcon(), draggable: true }).addTo(markerLayer);
        var report = function (ll) { post({ type: 'pinMoved', latitude: ll.lat, longitude: ll.lng }); };
        pin.on('dragend', function () { report(pin.getLatLng()); });
        // Tapping the map moves the pin there too: easier than dragging on a phone.
        map.off('click');
        map.on('click', function (e) { pin.setLatLng(e.latlng); report(e.latlng); });
        // Recentre only when asked (a fresh "Find on map"), never because the
        // owner just moved the pin themselves.
        if (payload.recenter !== window.__lastRecenter) {
          window.__lastRecenter = payload.recenter;
          map.setView([start.latitude, start.longitude], payload.zoom || 17);
        }
      }
      return;
    }

    pts.forEach(function (m) {
      if (payload.variant === 'area') {
        L.circle([m.latitude, m.longitude], {
          radius: ${APPROXIMATE_RADIUS_METRES},
          color: '${primary}',
          weight: 2,
          fillColor: '${primary}',
          fillOpacity: 0.18,
          interactive: false
        }).addTo(markerLayer);
        return;
      }
      var icon = payload.variant === 'location' ? locationPinIcon() : pricePinIcon(m, m.id === payload.selectedId);
      var marker = L.marker([m.latitude, m.longitude], { icon: icon }).addTo(markerLayer);
      if (payload.variant !== 'location') {
        marker.on('click', function () { post({ type: 'markerPress', id: m.id }); });
      }
    });

    var center = payload.center
      ? [payload.center.latitude, payload.center.longitude]
      : pts.length ? [pts[0].latitude, pts[0].longitude] : null;
    if (payload.boundary && payload.boundary.length >= 3) {
      // The outline frames the view itself; a pin's zoom would fight it.
      drawBoundary(payload, false);
    } else if (center) map.setView(center, payload.zoom || 13);
  }

  function onMessage(e) {
    // Only map data is rendered; anything else posted to the page is ignored.
    try {
      var data = typeof e.data === 'string' ? JSON.parse(e.data) : null;
      if (data && Array.isArray(data.markers)) render(data);
    } catch (err) {}
  }
  document.addEventListener('message', onMessage);
  window.addEventListener('message', onMessage);
</script>
</body>
</html>`;
}
