import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PageResponse } from '@/shared/types/library';
import {
  usePaginatedManagementList,
  type ManagementListParams,
} from './usePaginatedManagementList';

describe('usePaginatedManagementList', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('debounces requests and exposes page data', async () => {
    vi.useFakeTimers();
    const resultPage: PageResponse<string> = {
      content: ['item'],
      page: 2,
      size: 10,
      totalElements: 11,
      totalPages: 2,
    };
    const loadPage = vi
      .fn<(params: ManagementListParams) => Promise<PageResponse<string>>>()
      .mockResolvedValue(resultPage);

    const { result } = renderHook(() =>
      usePaginatedManagementList({
        page: 2,
        size: 10,
        search: 'item',
        refreshKey: 0,
        loadPage,
        errorFallback: 'Falha ao carregar.',
      }),
    );

    expect(loadPage).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    expect(loadPage).toHaveBeenCalledWith({
      page: 2,
      size: 10,
      search: 'item',
    });
    expect(result.current).toMatchObject({
      items: ['item'],
      totalItems: 11,
      totalPages: 2,
      isLoading: false,
      error: null,
    });
  });
});
