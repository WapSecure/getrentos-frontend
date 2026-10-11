import { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useTheme } from '@getrentos/ui-native';
import { buildMapHtml, type PropertyMapViewProps } from './propertyMapHtml';

export type { PropertyMapMarker, PropertyMapViewProps } from './propertyMapHtml';

/**
 * Keyless map powered by Leaflet + OpenStreetMap tiles, embedded via WebView:
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
