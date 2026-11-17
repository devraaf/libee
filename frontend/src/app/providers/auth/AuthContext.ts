import { createContext } from 'react';
import type { StoredSession } from '@/features/auth/storage/session-storage';
import type { login } from '@/features/auth/services/auth.service';

export type LoginData = Parameters<typeof login>[0];

export interface AuthContextValue {
  session: StoredSession | null;
  login: (data: LoginData) => Promise<StoredSession>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
