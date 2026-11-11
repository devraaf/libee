import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { post } = vi.hoisted(() => ({
  post: vi.fn(),
}));

vi.mock('@/shared/api/http-client', () => ({
  httpClient: { post },
}));

import { register } from './auth.service';
import {
  getSession,
  saveSession,
  SESSION_STORAGE_KEY,
} from '../storage/session-storage';

describe('register', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('posts the registration payload and leaves the librarian session untouched', async () => {
    const librarianSession = {
      token: 'librarian-token',
      user: { id: 9, profile: 'LIBRARIAN' as const },
    };
    saveSession(librarianSession);
    const response = {
      id: 42,
      name: 'Ana Silva',
      email: 'ana@example.com',
      profile: 'READER' as const,
    };
    post.mockResolvedValue({ data: response });

    const createdReader = await register({
      name: 'Ana Silva',
      phone: '(11) 99999-9999',
      affiliationType: 'EMPLOYEE',
      courseId: '',
      email: 'ana@example.com',
      password: 'SenhaInicial1',
      confirmPassword: 'SenhaInicial1',
    });

    expect(post).toHaveBeenCalledWith('/auth/register', {
      name: 'Ana Silva',
      email: 'ana@example.com',
      password: 'SenhaInicial1',
      phone: '11999999999',
      affiliationType: 'EMPLOYEE',
      courseId: undefined,
    });
    expect(createdReader).toEqual(response);
    expect(getSession()).toEqual(librarianSession);
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toContain(
      'librarian-token',
    );
  });
});
