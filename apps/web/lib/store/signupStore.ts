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
  setData: (data: Partial<SignupData>) => void;
  setStep: (step: SignupStep) => void;
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
  selectedRoles: [],
  isVerified: false,
};

export const useSignupStore = create<SignupStore>()(
  persist(
    (set) => ({
      data: initialState,
      step: 'signup',
      canAddMoreRoles: false,

      setData: (newData) =>
        set((state) => ({
          data: { ...state.data, ...newData },
        })),

      setStep: (step) => set({ step }),

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
          canAddMoreRoles: false,
        }),
    }),
    {
      name: 'signup-storage',
      partialize: (state) => ({
        data: state.data,
        // Don't persist step and canAddMoreRoles
      }),
    }
  )
);
