import { createElement } from 'react';
import { View } from 'react-native';

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
      {createElement('iframe', {
        src: url,
        title,
        allow: 'autoplay; fullscreen; picture-in-picture; encrypted-media',
        allowFullScreen: true,
        style: { border: 0, width: '100%', height: '100%', display: 'block' },
      })}
    </View>
  );
}
