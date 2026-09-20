import { apiFetch } from './client';

export interface UssdScreen {
  text: string;
  /** Keypad digit → the id of the screen it leads to. */
  options?: Record<string, string>;
}

export interface UssdMenu {
  /** The short code the renter would dial, e.g. `*737*57#`. */
  code: string;
  screens: Record<string, UssdScreen>;
}

export const ussdApi = {
  getMenu: () => apiFetch<UssdMenu>('/renter/ussd/menu'),
};
