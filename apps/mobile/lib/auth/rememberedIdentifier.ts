import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'getrentos.rememberedIdentifier';

export async function getRememberedIdentifier(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(KEY)) ?? '';
  } catch {
    return '';
  }
}

export function rememberIdentifier(identifier: string) {
  AsyncStorage.setItem(KEY, identifier.trim()).catch(() => undefined);
}

export function forgetIdentifier() {
  AsyncStorage.removeItem(KEY).catch(() => undefined);
}
