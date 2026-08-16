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
}

export type SignupStep = 'signup' | 'otp' | 'roles' | 'verification';

interface SignupStore {
  data: SignupData;
  step: SignupStep;
  /** Reference from /auth/otp/send, needed again at /auth/signup. Must survive
   * navigation from /signup to /role-selection, so it lives here rather than
   * in a hook's local state. */
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
  // Every new account defaults to Renter until the user explicitly picks a
  // different role card during role selection.
  selectedRoles: ['renter'],
  isVerified: false,
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
          // If multi-role is disabled, only allow one role
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
      partialize: (state) => ({
        data: state.data,
        otpReference: state.otpReference,
        // Don't persist step and canAddMoreRoles
      }),
    }
  )
);
