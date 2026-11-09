import * as WebBrowser from 'expo-web-browser';
import { env } from './env';

export type LegalPage = 'terms' | 'privacy';

export function openLegal(page: LegalPage) {
  return WebBrowser.openBrowserAsync(`${env.webUrl}/${page}`).catch(() => undefined);
}
