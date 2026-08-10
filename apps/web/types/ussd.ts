export interface UssdScreen {
  text: string;
  options?: Record<string, string>;
}

export type UssdSessionState = 'idle' | 'active' | 'ended';
