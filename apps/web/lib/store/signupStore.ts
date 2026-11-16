import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { SignupMethod } from '@sureground/shared';

export interface SignupData {
  email?: string;
  phone?: string;
  fullName: string;
  password: string;
  method: 'email' | 'phone';
  selectedRoles: string[];
  isVerified: boolean;
  referralCode?: string;
}

export type SignupStep = 'signup' | 'otp' | 'roles';

/** A problem found after step one that the person fixes there. */
export interface StepOneNotice {
  field?: 'password' | 'referralCode' | 'contact';
  message: string;
}

interface SignupStore {
  data: SignupData;
  step: SignupStep;
  channel: SignupMethod;
  /** Needed again at /auth/signup, after navigating to /role-selection. */
  otpReference: string | null;
  notice: StepOneNotice | null;
  setData: (data: Partial<SignupData>) => void;
  setStep: (step: SignupStep) => void;
  setChannel: (channel: SignupMethod) => void;
  setOtpReference: (reference: string | null) => void;
  setNotice: (notice: StepOneNotice | null) => void;
  addRole: (roleId: string) => void;
  removeRole: (roleId: string) => void;
  setPrimaryRole: (roleId: string) => void;
  /** Back to step one with the answers kept; a fresh code is needed. */
  returnToDetails: (notice: StepOneNotice | null) => void;
  reset: () => void;
}

const initialState: SignupData = {
  email: '',
  phone: '',
  fullName: '',
  password: '',
  method: 'email',
  selectedRoles: [],
  isVerified: false,
  referralCode: '',
};

// Earlier builds kept the sign-up draft in localStorage, where it outlived the tab.
if (typeof window !== 'undefined') {
  try {
    window.localStorage.removeItem('signup-storage');
  } catch {
    // Storage blocked: nothing was saved there either.
  }
}

export const useSignupStore = create<SignupStore>()(
  persist(
    (set) => ({
      data: initialState,
      step: 'signup',
      channel: 'email',
      otpReference: null,
      notice: null,

      setData: (newData) =>
        set((state) => ({
          data: { ...state.data, ...newData },
        })),

      setStep: (step) => set({ step }),

      setChannel: (channel) => set({ channel }),

      setOtpReference: (reference) => set({ otpReference: reference }),

      setNotice: (notice) => set({ notice }),

      addRole: (roleId) =>
        set((state) =>
          state.data.selectedRoles.includes(roleId)
            ? state
            : { data: { ...state.data, selectedRoles: [...state.data.selectedRoles, roleId] } }
        ),

      removeRole: (roleId) =>
        set((state) => ({
          data: {
            ...state.data,
            selectedRoles: state.data.selectedRoles.filter((id) => id !== roleId),
          },
        })),

      setPrimaryRole: (roleId) =>
        set((state) => ({
          data: {
            ...state.data,
            selectedRoles: [roleId, ...state.data.selectedRoles.filter((id) => id !== roleId)],
          },
        })),

      returnToDetails: (notice) =>
        set((state) => ({
          step: 'signup',
          otpReference: null,
          notice,
          data: { ...state.data, isVerified: false },
        })),

      reset: () =>
        set({
          data: initialState,
          step: 'signup',
          channel: 'email',
          otpReference: null,
          notice: null,
        }),
    }),
    {
      name: 'signup-storage',
      // Session storage, so the draft ends with the tab; the password is never written.
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        data: { ...state.data, password: '' },
        step: state.step,
        channel: state.channel,
        otpReference: state.otpReference,
        notice: state.notice,
      }),
    }
  )
);
