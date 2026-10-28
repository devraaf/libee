import {
  mockCourses,
  mockReaders,
  mockUsers,
} from '../../../shared/mocks/data';
import {
  MockServiceError,
  simulateServiceDelay,
} from '../../../shared/mocks/service-utils';
import type { User } from '../../../shared/types/library';
import type { LoginFormData, RegisterFormData } from '../schemas/auth.schema';

export type AuthenticatedUser = Omit<User, 'password'>;
export interface AuthSession {
  user: AuthenticatedUser;
}

let currentSession: AuthSession | null = null;

function publicUser(user: User): AuthenticatedUser {
  const { password: _password, ...result } = user;
  return result;
}

export async function login(data: LoginFormData): Promise<AuthSession> {
  await simulateServiceDelay();
  const user = mockUsers.find(
    (candidate) =>
      candidate.email.toLowerCase() === data.email.trim().toLowerCase() &&
      candidate.password === data.password,
  );
  if (!user) {
    throw new MockServiceError(
      'E-mail ou senha inválidos.',
      'VALIDATION_ERROR',
    );
  }
  currentSession = { user: publicUser(user) };
  return currentSession;
}

export async function register(data: RegisterFormData): Promise<AuthSession> {
  await simulateServiceDelay();
  const email = data.email.trim().toLowerCase();
  if (mockUsers.some((user) => user.email.toLowerCase() === email)) {
    throw new MockServiceError('Este e-mail já está cadastrado.', 'CONFLICT');
  }
  if (
    data.affiliationType === 'STUDENT' &&
    !mockCourses.some(({ id }) => id === Number(data.courseId))
  ) {
    throw new MockServiceError(
      'Selecione um curso válido.',
      'VALIDATION_ERROR',
    );
  }

  const user: User = {
    id: Math.max(0, ...mockUsers.map(({ id }) => id)) + 1,
    name: data.name.trim(),
    email,
    password: data.password,
    phone: data.phone.trim() || null,
    affiliationType: data.affiliationType,
    profile: 'READER',
  };
  mockUsers.push(user);
  if (user.affiliationType === 'STUDENT') {
    const reader = {
      ...user,
      profile: 'READER' as const,
      courseId: Number(data.courseId),
    };
    mockReaders.push(reader);
  } else {
    mockReaders.push({ ...user, profile: 'READER' });
  }
  currentSession = { user: publicUser(user) };
  return currentSession;
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  await simulateServiceDelay();
  return currentSession;
}

export async function logout(): Promise<void> {
  await simulateServiceDelay();
  currentSession = null;
}
