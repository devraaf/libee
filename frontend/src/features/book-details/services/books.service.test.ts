import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get } = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock('@/shared/api/http-client', () => ({
  httpClient: { get },
}));

import { getBookDetails } from '@/features/book-details/services/books.service';

describe('book details API service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('loads and adapts book details and copies by book id', async () => {
    get.mockResolvedValue({
      data: {
        id: 21,
        title: 'The Pragmatic Programmer',
        authors: [{ name: 'Andrew Hunt' }, { name: 'David Thomas' }],
        category: 'Tecnologia',
        isbn: '9780135957059',
        coverImageUrl: null,
        publisher: 'Addison-Wesley',
        publicationPlace: 'Boston',
        edition: '2',
        publicationYear: 2019,
        pageCount: 352,
        summary: 'A practical guide.',
        copies: [
          {
            copyId: 31,
            accessionNumber: 'T-031',
            physicalLocation: 'A-2',
            status: 'AVAILABLE',
          },
        ],
      },
    });

    const result = await getBookDetails(21);

    expect(get).toHaveBeenCalledWith('/books/21');
    expect(result.book).toMatchObject({
      title: 'The Pragmatic Programmer',
      authors: ['Andrew Hunt', 'David Thomas'],
      category: { name: 'Tecnologia' },
      coverImageUrl: null,
    });
    expect(result.copies).toEqual([
      {
        id: 31,
        bookId: 21,
        accessionNumber: 'T-031',
        physicalLocation: 'A-2',
        status: 'AVAILABLE',
      },
    ]);
  });
});
