import type { UserProfile } from '@/shared/schemas/enums.schema';
import {
  clearSession,
  getSession,
  saveSession,
  type StoredSession,
} from '../storage/session-storage';
import type { LoginFormData, RegisterFormData } from '../schemas/auth.schema';
import { httpClient } from '@/shared/api/http-client';
import { ApiError } from '@/shared/api/api-error';

export type AuthSession = StoredSession;

interface LoginResponse {
  token: string;
  id: number;
  profile: UserProfile;
}

export async function login(data: LoginFormData): Promise<AuthSession> {
  try {
    const { data: response } = await httpClient.post<LoginResponse>(
      '/auth/login',
      data,
    );
    const session: AuthSession = {
      token: response.token,
      user: { id: response.id, profile: response.profile },
    };
    saveSession(session);
    return session;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw new ApiError('E-mail ou senha inválidos.', 401, error.traceId);
    }
    throw error;
  }
}

export async function register(data: RegisterFormData): Promise<void> {
  const phone = data.phone.replace(/\D/g, '');

  await httpClient.post('/auth/register', {
    name: data.name,
    email: data.email,
    password: data.password,
    phone: phone || undefined,
    affiliationType: data.affiliationType,
    courseId:
      data.affiliationType === 'STUDENT' ? Number(data.courseId) : undefined,
  });
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  return getSession();
}

export async function logout(): Promise<void> {
  clearSession();
}
