import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toApiPageParams } from '@/shared/api/request-params';

const { get, patch } = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
}));

vi.mock('@/shared/api/http-client', () => ({
  httpClient: { get, patch },
}));

import {
  listReaderBooks,
  listMyLoans,
  listUpcomingReturns,
  renewMyLoan,
} from '@/features/reader/services/reader-api.service';
import { listCategories } from '@/shared/services/categories.service';

describe('reader API service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('converts the shared UI pagination parameters to the backend convention', () => {
    expect(toApiPageParams({ page: 3, size: 20 })).toEqual({
      page: 2,
      size: 20,
    });
  });

  it('queries the book catalog with search, category, and pagination filters', async () => {
    get.mockResolvedValue({
      data: {
        content: [],
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0,
      },
    });

    await listReaderBooks({
      page: 1,
      size: 10,
      search: 'clean',
      categoryId: 7,
    });

    expect(get).toHaveBeenCalledWith('/books', {
      params: {
        page: 0,
        size: 10,
        q: 'clean',
        categoryId: 7,
      },
    });
  });

  it('loads categories from the shared categories endpoint', async () => {
    get.mockResolvedValue({ data: [] });

    await listCategories();

    expect(get).toHaveBeenCalledWith('/categories');
  });

  it('queries a reader loan page by status and search without a reader id', async () => {
    get.mockResolvedValue({
      data: {
        content: [],
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0,
      },
    });

    await listMyLoans({
      statuses: ['ON_TIME', 'OVERDUE'],
      page: 1,
      size: 10,
      search: 'clean',
    });

    expect(get).toHaveBeenCalledWith('/loans', {
      params: {
        status: ['ON_TIME', 'OVERDUE'],
        page: 0,
        size: 10,
        search: 'clean',
      },
    });
    expect(get.mock.calls[0][1].params).not.toHaveProperty('readerId');
  });

  it('uses the backend default limit for upcoming returns', async () => {
    get.mockResolvedValue({ data: [] });

    await listUpcomingReturns();

    expect(get).toHaveBeenCalledWith('/loans/upcoming-returns');
  });

  it('renews a reader loan through PATCH without sending a reader id', async () => {
    patch.mockResolvedValue({
      data: {
        id: 8,
        book: {
          id: 12,
          title: 'Clean Code',
          authors: ['Robert C. Martin'],
          coverImageUrl: null,
        },
        accessionNumber: 'T-012',
        loanDate: '2026-11-01',
        dueDate: '2026-12-01',
        returnDate: null,
        renewalCount: 1,
        status: 'ON_TIME',
      },
    });

    const loan = await renewMyLoan(8);

    expect(patch).toHaveBeenCalledWith('/loans/8');
    expect(loan).toMatchObject({
      id: 8,
      bookId: 12,
      status: 'on_time',
      renewalCount: 1,
    });
  });
});
