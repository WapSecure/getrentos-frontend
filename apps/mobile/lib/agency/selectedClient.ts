import AsyncStorage from '@react-native-async-storage/async-storage';

// Cleared on sign-out so the next person on the phone starts with no client selected.
const KEY = 'sureground.agency.client';

export async function readSelectedClient(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export async function writeSelectedClient(id: string | null): Promise<void> {
  try {
    if (id) await AsyncStorage.setItem(KEY, id);
    else await AsyncStorage.removeItem(KEY);
  } catch {
    // Best effort: the choice still applies for this session.
  }
}
