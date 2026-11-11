import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, post, deleteRequest } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  deleteRequest: vi.fn(),
}));

vi.mock('@/shared/api/http-client', () => ({
  httpClient: { get, post, delete: deleteRequest },
}));

import {
  deleteManagedCopy,
  deleteManagedBook,
  getBookManagementSummary,
  listManagedBooks,
  registerManagedBook,
} from './book-management.service';

describe('book management API service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('uses the real management endpoint for search and category pagination', async () => {
    get.mockResolvedValue({
      data: {
        content: [],
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0,
      },
    });

    await listManagedBooks({
      page: 1,
      size: 10,
      search: 'Clean Code',
      categoryId: 3,
    });

    expect(get).toHaveBeenCalledWith('/books/management', {
      params: {
        page: 0,
        size: 10,
        q: 'Clean Code',
        categoryId: 3,
      },
    });
  });

  it('loads collection cards from the management summary endpoint', async () => {
    const summary = {
      totalBooks: 4,
      totalCopies: 8,
      availableCopies: 6,
      onLoanCopies: 2,
    };
    get.mockResolvedValue({ data: summary });

    await expect(getBookManagementSummary()).resolves.toEqual(summary);
    expect(get).toHaveBeenCalledWith('/books/management/summary');
  });

  it('posts the book and its copies to the backend registration endpoint', async () => {
    const request = {
      title: 'Clean Code',
      authors: ['Robert C. Martin'],
      categoryId: 3,
      isbn: '9780132350884',
      coverUrl: null,
      publisher: null,
      place: null,
      edition: null,
      publicationYear: 2008,
      pageCount: 464,
      description: null,
      copies: [{ accessionNumber: 'T-001', physicalLocation: 'A-01' }],
    };
    post.mockResolvedValue({ data: { id: 8, title: 'Clean Code' } });

    await registerManagedBook(request);

    expect(post).toHaveBeenCalledWith('/books', request);
  });

  it('deletes a book using the backend resource path', async () => {
    deleteRequest.mockResolvedValue({ data: null });

    await deleteManagedBook(8);

    expect(deleteRequest).toHaveBeenCalledWith('/books/8');
  });

  it('deletes an individual copy using both resource identifiers', async () => {
    deleteRequest.mockResolvedValue({ data: null });

    await deleteManagedCopy(8, 24);

    expect(deleteRequest).toHaveBeenCalledWith('/books/8/copies/24');
  });
});
