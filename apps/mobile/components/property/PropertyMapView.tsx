import { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useTheme } from '@getrentos/ui-native';

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
  /** `price` = pill price tags for a multi-listing map. `location` = a single pulsing pin for a property's exact spot. */
  variant?: 'price' | 'location';
  selectedId?: string;
  onMarkerPress?: (id: string) => void;
  borderRadius?: number;
  style?: object;
}

const LAGOS = { latitude: 6.5244, longitude: 3.3792 };

function buildHtml(
  scheme: 'light' | 'dark',
  primary: string,
  primaryForeground: string,
  card: string,
  foreground: string,
  border: string
) {
  const darkFilter =
    scheme === 'dark'
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
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  map.setView([${LAGOS.latitude}, ${LAGOS.longitude}], 11);

  var markerLayer = L.layerGroup().addTo(map);

  function post(msg) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
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

  function render(payload) {
    markerLayer.clearLayers();
    var pts = (payload.markers || []).filter(function (m) { return typeof m.latitude === 'number' && typeof m.longitude === 'number'; });

    pts.forEach(function (m) {
      var icon = payload.variant === 'location' ? locationPinIcon() : pricePinIcon(m, m.id === payload.selectedId);
      var marker = L.marker([m.latitude, m.longitude], { icon: icon }).addTo(markerLayer);
      if (payload.variant !== 'location') {
        marker.on('click', function () { post({ type: 'markerPress', id: m.id }); });
      }
    });

    var center = payload.center
      ? [payload.center.latitude, payload.center.longitude]
      : pts.length ? [pts[0].latitude, pts[0].longitude] : null;
    if (center) map.setView(center, payload.zoom || 13);
  }

  document.addEventListener('message', function (e) { render(JSON.parse(e.data)); });
  window.addEventListener('message', function (e) { render(JSON.parse(e.data)); });
</script>
</body>
</html>`;
}

/**
 * Keyless map powered by Leaflet + OpenStreetMap tiles, embedded via WebView —
 * mirrors the web app's `PropertyMap` (no Google/Mapbox key or billing needed).
 */
export function PropertyMapView({
  markers,
  center,
  zoom = 13,
  height,
  variant = 'price',
  selectedId,
  onMarkerPress,
  borderRadius = 16,
  style,
}: PropertyMapViewProps) {
  const { scheme, colors } = useTheme();
  const webRef = useRef<WebView>(null);
  const loadedRef = useRef(false);

  const html = useMemo(
    () =>
      buildHtml(
        scheme,
        colors.primary,
        colors.primaryForeground,
        colors.card,
        colors.foreground,
        colors.border
      ),
    [
      scheme,
      colors.primary,
      colors.primaryForeground,
      colors.card,
      colors.foreground,
      colors.border,
    ]
  );

  const payload = useMemo(
    () => ({ markers, center, zoom, variant, selectedId }),
    [markers, center, zoom, variant, selectedId]
  );

  useEffect(() => {
    if (loadedRef.current) webRef.current?.postMessage(JSON.stringify(payload));
  }, [payload]);

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(e.nativeEvent.data);
      if (data.type === 'markerPress' && data.id) onMarkerPress?.(data.id);
    } catch {
      // ignore malformed messages
    }
  };

  return (
    <View
      style={[
        { borderRadius, overflow: 'hidden', backgroundColor: colors.card },
        height != null && { height },
        style,
      ]}
    >
      <WebView
        ref={webRef}
        source={{ html }}
        style={StyleSheet.absoluteFill}
        onMessage={onMessage}
        onLoadEnd={() => {
          loadedRef.current = true;
          webRef.current?.postMessage(JSON.stringify(payload));
        }}
        originWhitelist={['*']}
        nestedScrollEnabled={Platform.OS === 'android'}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
