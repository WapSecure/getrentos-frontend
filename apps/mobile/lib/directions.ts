import { Linking, Platform } from 'react-native';

export function openDirections(latitude: number, longitude: number, label: string) {
  const encodedLabel = encodeURIComponent(label);
  const url = Platform.select({
    ios: `maps://?daddr=${latitude},${longitude}&q=${encodedLabel}`,
    android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedLabel})`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
  });
  Linking.openURL(url).catch(() =>
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`)
  );
}
