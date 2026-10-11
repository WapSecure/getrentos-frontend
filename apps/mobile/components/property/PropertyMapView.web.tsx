import { createElement, useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { useTheme } from '@getrentos/ui-native';
import { buildMapHtml, type PropertyMapViewProps } from './propertyMapHtml';

export type { PropertyMapMarker, PropertyMapViewProps } from './propertyMapHtml';

/**
 * The web build's map. react-native-webview has no web implementation, so the
 * same Leaflet page the phones load runs in an iframe instead, talking to this
 * component with postMessage both ways.
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
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const loadedRef = useRef(false);
  const onMarkerPressRef = useRef(onMarkerPress);
  useEffect(() => {
    onMarkerPressRef.current = onMarkerPress;
  });

  const html = useMemo(
    () =>
      buildMapHtml(
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
    () => JSON.stringify({ markers, center, zoom, variant, selectedId }),
    [markers, center, zoom, variant, selectedId]
  );
  const payloadRef = useRef(payload);
  useEffect(() => {
    payloadRef.current = payload;
    if (loadedRef.current) frameRef.current?.contentWindow?.postMessage(payload, '*');
  }, [payload]);

  // A new page (theme change) has to be sent the markers again once it loads.
  useEffect(() => {
    loadedRef.current = false;
  }, [html]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      // Only our own map frame may press a marker.
      if (!frameRef.current || e.source !== frameRef.current.contentWindow) return;
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : null;
        if (data?.type === 'markerPress' && typeof data.id === 'string') {
          onMarkerPressRef.current?.(data.id);
        }
      } catch {
        // ignore malformed messages
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <View
      style={[
        { borderRadius, overflow: 'hidden', backgroundColor: colors.card },
        height != null && { height },
        style,
      ]}
    >
      {createElement('iframe', {
        ref: frameRef,
        srcDoc: html,
        title: variant === 'location' ? 'Where the property is' : 'Properties on a map',
        // Scripts for Leaflet; no same-origin, so the page cannot reach the app.
        sandbox: 'allow-scripts',
        onLoad: () => {
          loadedRef.current = true;
          frameRef.current?.contentWindow?.postMessage(payloadRef.current, '*');
        },
        style: { border: 0, width: '100%', height: '100%', display: 'block' },
      })}
    </View>
  );
}
