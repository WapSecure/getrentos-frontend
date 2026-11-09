import { Alert, Platform } from 'react-native';
import { showWebAlert, type WebAlertButton } from './webAlert';

export function installWebAlert(): void {
  if (Platform.OS !== 'web') return;
  Alert.alert = ((title, message, buttons) =>
    showWebAlert(
      title ?? '',
      message ?? undefined,
      // RN types a button's onPress as a bare Function; the dialog calls it with no arguments.
      (buttons ?? undefined) as WebAlertButton[] | undefined
    )) as typeof Alert.alert;
}
