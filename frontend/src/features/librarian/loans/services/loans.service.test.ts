import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, post } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('@/shared/api/http-client', () => ({
  httpClient: { get, post },
}));

import {
  createLoan,
  getLoanManagementSummary,
  listManagementLoans,
  listReturnedLoans,
  returnLoan,
} from './loans.service';

describe('loan management API service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('loads active loans using backend pagination, search, and status parameters', async () => {
    get.mockResolvedValue({
      data: {
        content: [],
        page: 1,
        size: 10,
        totalElements: 0,
        totalPages: 0,
      },
    });

    await listManagementLoans({
      page: 2,
      size: 10,
      search: '  Camila  ',
      status: 'OVERDUE',
    });

    expect(get).toHaveBeenCalledWith('/loans/management', {
      params: {
        page: 1,
        size: 10,
        search: 'Camila',
        status: ['OVERDUE'],
      },
    });
  });

  it('loads loan summary cards', async () => {
    const summary = { activeLoans: 4, onTimeLoans: 3, overdueLoans: 1 };
    get.mockResolvedValue({ data: summary });

    await expect(getLoanManagementSummary()).resolves.toEqual(summary);
    expect(get).toHaveBeenCalledWith('/loans/management/summary');
  });

  it('searches returned loans through the management endpoint', async () => {
    get.mockResolvedValue({
      data: {
        content: [],
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0,
      },
    });

    const page = await listReturnedLoans({
      page: 1,
      size: 10,
      search: 'T-001',
    });

    expect(get).toHaveBeenCalledWith('/loans/management/returns', {
      params: { page: 0, size: 10, search: 'T-001' },
    });
    expect(page.page).toBe(1);
  });

  it('creates a loan without sending a librarian id', async () => {
    const request = {
      readerId: 7,
      accessionNumber: 'T-007',
      dueDate: '2026-11-17',
    };
    post.mockResolvedValue({ data: { id: 12, ...request } });

    await createLoan(request);

    expect(post).toHaveBeenCalledWith('/loans', request);
    expect(post.mock.calls[0][1]).not.toHaveProperty('librarianId');
  });

  it('registers a return using only the accession number', async () => {
    post.mockResolvedValue({ data: { id: 12 } });

    await returnLoan('T-007');

    expect(post).toHaveBeenCalledWith('/loans/returns', {
      accessionNumber: 'T-007',
    });
  });
});
