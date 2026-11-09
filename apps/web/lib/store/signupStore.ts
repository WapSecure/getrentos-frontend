import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface SignupStore {
  data: SignupData;
  step: SignupStep;
  /** Needed again at /auth/signup, after navigating to /role-selection. */
  otpReference: string | null;
  setData: (data: Partial<SignupData>) => void;
  setStep: (step: SignupStep) => void;
  setOtpReference: (reference: string | null) => void;
  addRole: (roleId: string) => void;
  removeRole: (roleId: string) => void;
  reset: () => void;
  canAddMoreRoles: boolean;
  setCanAddMoreRoles: (value: boolean) => void;
}

const initialState: SignupData = {
  email: '',
  phone: '',
  fullName: '',
  password: '',
  method: 'email',
  selectedRoles: ['renter'],
  isVerified: false,
  referralCode: '',
};

export const useSignupStore = create<SignupStore>()(
  persist(
    (set) => ({
      data: initialState,
      step: 'signup',
      otpReference: null,
      canAddMoreRoles: false,

      setData: (newData) =>
        set((state) => ({
          data: { ...state.data, ...newData },
        })),

      setStep: (step) => set({ step }),

      setOtpReference: (reference) => set({ otpReference: reference }),

      addRole: (roleId) =>
        set((state) => {
          const selectedRoles = state.canAddMoreRoles
            ? [...state.data.selectedRoles, roleId]
            : [roleId];
          return {
            data: {
              ...state.data,
              selectedRoles,
            },
          };
        }),

      removeRole: (roleId) =>
        set((state) => ({
          data: {
            ...state.data,
            selectedRoles: state.data.selectedRoles.filter((id) => id !== roleId),
          },
        })),

      setCanAddMoreRoles: (value) => set({ canAddMoreRoles: value }),

      reset: () =>
        set({
          data: initialState,
          step: 'signup',
          otpReference: null,
          canAddMoreRoles: false,
        }),
    }),
    {
      name: 'signup-storage',
      // The password stays in memory only: never written to localStorage.
      partialize: (state) => ({
        data: { ...state.data, password: '' },
        otpReference: state.otpReference,
      }),
    }
  )
);
