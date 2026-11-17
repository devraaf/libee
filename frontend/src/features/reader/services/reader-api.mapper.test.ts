import { describe, expect, it } from 'vitest';
import {
  mapReaderBook,
  mapReaderLoan,
  mapReaderPage,
  mapUpcomingReturn,
} from '@/features/reader/services/reader-api.mapper';
import { mapBookDetails } from '@/features/book-details/utils/book-details.mapper';

describe('reader API adapters', () => {
  it('maps a book list DTO to the catalog model', () => {
    expect(
      mapReaderBook({
        id: 12,
        title: 'Clean Code',
        authors: ['Robert C. Martin'],
        publicationYear: 2008,
        category: 'Tecnologia',
        coverImageUrl: null,
        available: true,
      }),
    ).toMatchObject({
      id: 12,
      title: 'Clean Code',
      authors: ['Robert C. Martin'],
      publicationDate: '2008',
      category: { name: 'Tecnologia' },
      coverImageUrl: null,
      available: true,
    });
  });

  it('maps book detail copies and availability', () => {
    const mapped = mapBookDetails({
      id: 8,
      title: 'Domain-Driven Design',
      authors: [{ name: 'Eric Evans' }],
      category: 'Software',
      isbn: '9780321125217',
      coverImageUrl: null,
      publisher: 'Addison-Wesley',
      publicationPlace: 'Boston',
      edition: '1',
      publicationYear: 2003,
      pageCount: 560,
      summary: 'A software design book.',
      copies: [
        {
          copyId: 51,
          accessionNumber: 'T-051',
          physicalLocation: 'A-1',
          status: 'AVAILABLE',
        },
        {
          copyId: 52,
          accessionNumber: 'T-052',
          physicalLocation: null,
          status: 'ON_LOAN',
        },
      ],
    });

    expect(mapped.book).toMatchObject({
      id: 8,
      isbn: '9780321125217',
      authors: ['Eric Evans'],
      available: true,
      category: { name: 'Software' },
    });
    expect(mapped.copies).toEqual([
      {
        id: 51,
        bookId: 8,
        accessionNumber: 'T-051',
        physicalLocation: 'A-1',
        status: 'AVAILABLE',
      },
      {
        id: 52,
        bookId: 8,
        accessionNumber: 'T-052',
        physicalLocation: null,
        status: 'ON_LOAN',
      },
    ]);
  });

  it.each([
    ['ON_TIME', 'on_time'],
    ['OVERDUE', 'overdue'],
    ['RETURNED', 'returned'],
  ] as const)('maps loan status %s to %s', (apiStatus, status) => {
    expect(
      mapReaderLoan({
        id: 4,
        book: {
          id: 9,
          title: 'Book',
          authors: ['A. Author'],
          coverImageUrl: null,
        },
        accessionNumber: 'T-009',
        loanDate: '2026-10-01',
        dueDate: '2026-10-10',
        returnDate: apiStatus === 'RETURNED' ? '2026-10-09' : null,
        renewalCount: 1,
        status: apiStatus,
      }),
    ).toMatchObject({
      id: 4,
      bookId: 9,
      author: 'A. Author',
      tombo: 'T-009',
      status,
    });
  });

  it('converts the backend zero-based page to the UI one-based page', () => {
    expect(
      mapReaderPage(
        { content: [2, 4], page: 1, size: 2, totalElements: 5, totalPages: 3 },
        String,
      ),
    ).toEqual({
      content: ['2', '4'],
      page: 2,
      size: 2,
      totalElements: 5,
      totalPages: 3,
    });
  });

  it('maps upcoming return data with its book identifier', () => {
    expect(
      mapUpcomingReturn({
        id: 3,
        bookId: 12,
        title: 'Book',
        authors: [],
        publicationYear: 2020,
        coverImageUrl: null,
        dueDate: '2026-11-15',
      }),
    ).toEqual({
      id: 3,
      bookId: 12,
      title: 'Book',
      author: null,
      coverUrl: null,
      year: '2020',
      dueDate: '2026-11-15',
    });
  });
});
