import { afterEach, describe, expect, it } from 'vitest';
import { httpClient } from './http-client';
import {
  clearSession,
  saveSession,
} from '@/features/auth/storage/session-storage';

describe('httpClient auth request headers', () => {
  afterEach(() => {
    clearSession();
  });

  it('does not send the active librarian token to public auth endpoints', async () => {
    saveSession({
      token: 'librarian-token',
      user: { id: 8, profile: 'LIBRARIAN' },
    });
    let requestAuthorization: unknown;

    await httpClient.post(
      '/auth/register',
      {},
      {
        adapter: async (config) => {
          requestAuthorization = config.headers.Authorization;
          return {
            data: {
              id: 11,
              name: 'Leitora',
              email: 'reader@example.com',
              profile: 'READER',
            },
            status: 201,
            statusText: 'Created',
            headers: {},
            config,
          };
        },
      },
    );

    expect(requestAuthorization).toBeUndefined();
  });
});
