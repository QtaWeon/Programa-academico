import { create } from 'zustand';
import { UserRole } from './types';
import { useAccountsStore } from './accounts-store';
import { useCoursesStore } from './courses-store';
import { usePlanillasStore } from './planillas-store';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  grade?: string;
}

interface AppState {
  currentRole: UserRole | null;
  currentUserId: string | null;
  user: User | null;
  isLoading: boolean;
  setRole: (role: UserRole, userId?: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  login: (email: string, password: string) => Promise<boolean>;
  loginAsUser: (userId: string) => Promise<boolean>;
}

export const useAppStore = create<AppState>((set) => ({
  currentRole: null,
  currentUserId: null,
  user: null,
  isLoading: false,
  setRole: (role, userId) => set({ currentRole: role, currentUserId: userId || null }),
  logout: () => {
    useAccountsStore.getState().reset();
    useCoursesStore.getState().reset();
    usePlanillasStore.getState().reset();
    set({ currentRole: null, currentUserId: null, user: null });
  },
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ isLoading: loading }),
  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      // Ensure accounts are loaded from Firestore
      const accountsStore = useAccountsStore.getState();
      if (!accountsStore.loaded) {
        await accountsStore.fetchAccounts();
      }

      const account = useAccountsStore.getState().getByEmail(email);
      // Password is validated against the account's CI (ignoring dots) + 'cpcc' suffix
      if (account && account.status === 'activo' && `${account.ci.replace(/\./g, '')}cpcc` === password) {
        const normalizedRole = account.role;
        const userName = account.firstName && account.lastName 
          ? `${account.firstName} ${account.lastName}` 
          : account.email;

        const user: User = {
          id: account.id,
          name: userName,
          email: account.email,
          role: normalizedRole as UserRole,
          grade: account.grade,
        };
        set({
          user,
          currentRole: normalizedRole as UserRole,
          currentUserId: account.id,
          isLoading: false,
        });
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (error) {
      console.error('Login error:', error);
      set({ isLoading: false });
      return false;
    }
  },
  loginAsUser: async (userId: string) => {
    set({ isLoading: true });
    try {
      const accountsStore = useAccountsStore.getState();
      if (!accountsStore.loaded) {
        await accountsStore.fetchAccounts();
      }

      const account = accountsStore.accounts.find(a => a.id === userId);
      if (account && account.status === 'activo') {
        const normalizedRole = account.role;
        const userName = account.firstName && account.lastName 
          ? `${account.firstName} ${account.lastName}` 
          : account.email;

        const user: User = {
          id: account.id,
          name: userName,
          email: account.email,
          role: normalizedRole as UserRole,
          grade: account.grade,
        };
        set({
          user,
          currentRole: normalizedRole as UserRole,
          currentUserId: account.id,
          isLoading: false,
        });
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (error) {
      console.error('Auto login error:', error);
      set({ isLoading: false });
      return false;
    }
  },
}));
