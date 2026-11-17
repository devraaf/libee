import {
  userProfileSchema,
  type UserProfile,
} from '@/shared/schemas/enums.schema';

export interface StoredSession {
  token: string;
  user: { id: number; profile: UserProfile };
}

export const SESSION_STORAGE_KEY = 'libee.session';

function isStoredSession(value: unknown): value is StoredSession {
  if (typeof value !== 'object' || value === null) return false;

  const session = value as Record<string, unknown>;
  if (typeof session.token !== 'string' || session.token.length === 0) {
    return false;
  }

  if (typeof session.user !== 'object' || session.user === null) {
    return false;
  }

  const user = session.user as Record<string, unknown>;
  return (
    typeof user.id === 'number' &&
    Number.isInteger(user.id) &&
    user.id > 0 &&
    userProfileSchema.safeParse(user.profile).success
  );
}

export function saveSession(session: StoredSession): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function getSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;

    const value: unknown = JSON.parse(raw);
    return isStoredSession(value) ? value : null;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return getSession()?.token ?? null;
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}
