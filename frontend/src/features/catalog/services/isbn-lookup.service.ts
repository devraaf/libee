import { mockBooks } from '../../../shared/mocks/data';
import {
  MockServiceError,
  simulateServiceDelay,
} from '../../../shared/mocks/service-utils';
import type { Book } from '../../../shared/types/library';

export const isbnLookupExamples = {
  found: ['9786500000001', '9786500000002', '9786500000003'],
  notFound: '9786500000004',
  unavailable: '9786500000005',
  alreadyRegistered: mockBooks[0].isbn,
} as const;

function normalizeIsbn(isbn: string): string {
  return isbn.replace(/[\s-]/g, '').toUpperCase();
}

const lookupBooks: Record<string, Book> = {
  [isbnLookupExamples.found[0]]: {
    ...mockBooks[8],
    id: 0,
    isbn: isbnLookupExamples.found[0],
    title: 'Descobertas da Programação',
  },
  [isbnLookupExamples.found[1]]: {
    ...mockBooks[11],
    id: 0,
    isbn: isbnLookupExamples.found[1],
    title: 'Pequeno Atlas das Ciências',
  },
  [isbnLookupExamples.found[2]]: {
    ...mockBooks[13],
    id: 0,
    isbn: isbnLookupExamples.found[2],
    title: 'Narrativas de um Lugar Distante',
  },
};

export async function lookupBookByIsbn(isbn: string): Promise<Book | null> {
  await simulateServiceDelay();
  const normalizedIsbn = normalizeIsbn(isbn);
  if (normalizedIsbn === isbnLookupExamples.unavailable) {
    throw new MockServiceError(
      'O serviço de consulta de ISBN está temporariamente indisponível.',
      'SERVICE_UNAVAILABLE',
    );
  }
  if (
    mockBooks.some((book) => normalizeIsbn(book.isbn) === normalizedIsbn) ||
    normalizedIsbn === normalizeIsbn(isbnLookupExamples.alreadyRegistered)
  ) {
    throw new MockServiceError(
      'Este ISBN já está cadastrado.',
      'ISBN_ALREADY_REGISTERED',
    );
  }
  return lookupBooks[normalizedIsbn]
    ? {
        ...lookupBooks[normalizedIsbn],
        authors: [...lookupBooks[normalizedIsbn].authors],
      }
    : null;
}
