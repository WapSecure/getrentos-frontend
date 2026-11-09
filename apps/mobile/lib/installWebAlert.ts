import { Alert, Platform } from 'react-native';
import { showWebAlert } from './webAlert';

export function installWebAlert(): void {
  if (Platform.OS !== 'web') return;
  Alert.alert = ((title, message, buttons) =>
    showWebAlert(title, message, buttons ?? undefined)) as typeof Alert.alert;
}
