import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('@/shared/api/http-client', () => ({
  httpClient: { get },
}));

import {
  getReaderManagementSummary,
  listManagementReaders,
  searchReadersForLoan,
} from './readers.service';

describe('loan reader search', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('requests five reader options and includes their status', async () => {
    const readers = [
      {
        id: 8,
        name: 'Ana Silva',
        email: 'ana@example.com',
        status: 'REGULAR',
      },
    ];
    get.mockResolvedValue({ data: { content: readers } });

    await expect(searchReadersForLoan(' Ana ')).resolves.toEqual(readers);

    expect(get).toHaveBeenCalledWith('/readers', {
      params: { search: 'Ana', page: 0, size: 5 },
    });
  });

  it('lists management readers through the server-side filters and pagination', async () => {
    get.mockResolvedValue({
      data: {
        content: [],
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0,
      },
    });

    await listManagementReaders({
      page: 2,
      size: 10,
      search: 'Ana',
      affiliationType: 'STUDENT',
      status: 'PENDING',
    });

    expect(get).toHaveBeenCalledWith('/readers', {
      params: {
        page: 1,
        size: 10,
        search: 'Ana',
        linkType: 'STUDENT',
        status: ['PENDING'],
      },
    });
  });

  it('loads reader dashboard counts from the backend', async () => {
    const summary = {
      totalReaders: 12,
      readersWithActiveLoans: 5,
      readersWithOverdueLoans: 2,
    };
    get.mockResolvedValue({ data: summary });

    await expect(getReaderManagementSummary()).resolves.toEqual(summary);
    expect(get).toHaveBeenCalledWith('/readers/summary');
  });
});
