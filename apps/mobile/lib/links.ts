import * as WebBrowser from 'expo-web-browser';
import { env } from './env';

export type LegalPage = 'terms' | 'privacy';

/** Opens a legal page from the website in an in-app browser sheet. */
export function openLegal(page: LegalPage) {
  return WebBrowser.openBrowserAsync(`${env.webUrl}/${page}`).catch(() => undefined);
}
