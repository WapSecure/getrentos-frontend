export interface UssdScreen {
  text: string;
  options?: Record<string, string>;
}

export type UssdSessionState = 'idle' | 'active' | 'ended';

export interface UssdMenu {
  code: string;
  screens: Record<string, UssdScreen>;
}
