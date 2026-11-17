import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  getSession,
  type StoredSession,
} from '@/features/auth/storage/session-storage';
import {
  login as loginRequest,
  logout as logoutRequest,
} from '@/features/auth/services/auth.service';
import type { AuthContextValue, LoginData } from './AuthContext';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  // A leitura síncrona restaura a sessão antes de os guards renderizarem.
  const [session, setSession] = useState<StoredSession | null>(() =>
    getSession(),
  );

  const login = useCallback(async (data: LoginData) => {
    // O service persiste a sessão; o provider atualiza o estado do React.
    const next = await loginRequest(data);
    setSession(next);
    return next;
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, login, logout }),
    [session, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
