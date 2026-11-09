import { View } from 'react-native';
import { WebView } from 'react-native-webview';

export function EmbedFrame({
  url,
  title,
  fill = false,
}: {
  url: string;
  title: string;
  fill?: boolean;
}) {
  return (
    <View
      style={[
        { width: '100%', backgroundColor: '#000' },
        fill ? { flex: 1 } : { aspectRatio: 16 / 9 },
      ]}
    >
      <WebView
        source={{ uri: url }}
        accessibilityLabel={title}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        // Only the provider's own player may load; links inside it open nothing.
        originWhitelist={['https://*']}
        setSupportMultipleWindows={false}
        style={{ flex: 1, backgroundColor: '#000' }}
      />
    </View>
  );
}
