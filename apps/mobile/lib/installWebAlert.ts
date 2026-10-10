import { Alert, Platform } from 'react-native';
import { showWebAlert } from './webAlert';

/** On web, `Alert.alert` opens the in-app dialog (see webAlert.ts). A no-op on phones. */
export function installWebAlert(): void {
  if (Platform.OS !== 'web') return;
  Alert.alert = ((title, message, buttons) =>
    showWebAlert(title, message, buttons ?? undefined)) as typeof Alert.alert;
}
