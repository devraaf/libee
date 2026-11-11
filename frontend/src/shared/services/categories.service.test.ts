import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, post } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('@/shared/api/http-client', () => ({
  httpClient: { get, post },
}));

import { createCategory, listCategories } from './categories.service';

describe('categories service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('lists categories through the shared endpoint', async () => {
    get.mockResolvedValue({ data: [{ id: 1, name: 'Literatura' }] });

    await expect(listCategories()).resolves.toEqual([
      { id: 1, name: 'Literatura' },
    ]);
    expect(get).toHaveBeenCalledWith('/categories');
  });

  it('creates a category through the shared endpoint', async () => {
    post.mockResolvedValue({ data: { id: 2, name: 'História' } });

    await expect(createCategory(' História ')).resolves.toEqual({
      id: 2,
      name: 'História',
    });
    expect(post).toHaveBeenCalledWith('/categories', { name: 'História' });
  });
});
