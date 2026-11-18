import { useMemo } from 'react';
import { View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { WebView } from 'react-native-webview';
import { embedFamily, embedNavigation } from '@/lib/embedNavigation';

export function EmbedFrame({
  url,
  title,
  fill = false,
}: {
  url: string;
  title: string;
  fill?: boolean;
}) {
  const family = useMemo(() => embedFamily(url), [url]);
  const onShouldStartLoadWithRequest = (request: { url: string; isTopFrame?: boolean }) => {
    if (!family) return false;
    const decision = embedNavigation(family, request.url, request.isTopFrame ?? true);
    // Off-provider pages open in the browser, where the address bar shows whose page it is.
    if (decision === 'external')
      void WebBrowser.openBrowserAsync(request.url).catch(() => undefined);
    return decision === 'allow';
  };

  return (
    <View
      style={[
        { width: '100%', backgroundColor: '#000' },
        fill ? { flex: 1 } : { aspectRatio: 16 / 9 },
      ]}
    >
      {family ? (
        <WebView
          source={{ uri: url }}
          accessibilityLabel={title}
          allowsFullscreenVideo
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          // The library hands any URL outside the whitelist (any scheme, ours included) to the OS, so the callback is the only gate.
          originWhitelist={['*']}
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          setSupportMultipleWindows={false}
          style={{ flex: 1, backgroundColor: '#000' }}
        />
      ) : null}
    </View>
  );
}
