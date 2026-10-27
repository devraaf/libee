import {
  mockAuthors,
  mockBooks,
  mockCategories,
  mockCopies,
  mockLoans,
} from '../../../shared/mocks/data';
import {
  MockServiceError,
  simulateSearchError,
  simulateServiceDelay,
} from '../../../shared/mocks/service-utils';
import type {
  Book,
  BookListItem,
  Copy,
  CreateBookInput,
  PaginatedResult,
} from '../../../shared/types/library';

export interface ListBooksParams {
  page: number;
  size: number;
  search?: string;
  categoryId?: number;
}

function withAvailability(book: Book): BookListItem {
  return {
    ...book,
    authors: [...book.authors],
    category: { ...book.category },
    available: mockCopies.some(
      (copy) => copy.bookId === book.id && copy.status === 'AVAILABLE',
    ),
  };
}

function mapBookInput(id: number, input: CreateBookInput): Book {
  if (!/^([0-9]{9}[0-9X]|[0-9]{13})$/.test(input.isbn.trim())) {
    throw new MockServiceError('Informe um ISBN válido.', 'VALIDATION_ERROR');
  }
  const category = mockCategories.find(
    ({ id: categoryId }) => categoryId === input.categoryId,
  );
  if (!category)
    throw new MockServiceError('Categoria não encontrada.', 'VALIDATION_ERROR');
  const authors = input.authorIds.map((authorId) => {
    const author = mockAuthors.find(({ id }) => id === authorId);
    if (!author)
      throw new MockServiceError('Autor não encontrado.', 'VALIDATION_ERROR');
    return author;
  });

  return {
    id,
    isbn: input.isbn.trim(),
    title: input.title.trim(),
    publisher: input.publisher,
    publicationPlace: input.publicationPlace,
    edition: input.edition,
    coverImageUrl: input.coverImageUrl,
    publicationDate: input.publicationDate,
    pageCount: input.pageCount,
    summary: input.summary,
    category: { ...category },
    authors: authors.map((author) => ({ ...author })),
  };
}

export async function listBooks({
  page,
  size,
  search = '',
  categoryId,
}: ListBooksParams): Promise<PaginatedResult<BookListItem>> {
  await simulateServiceDelay();
  simulateSearchError(search);
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(size) ||
    size < 1
  ) {
    throw new MockServiceError(
      'A página e o tamanho devem ser positivos.',
      'VALIDATION_ERROR',
    );
  }

  const query = search.trim().toLocaleLowerCase();
  const filtered = mockBooks.filter((book) => {
    const matchesQuery =
      !query ||
      book.title.toLocaleLowerCase().includes(query) ||
      book.isbn.toLocaleLowerCase().includes(query) ||
      book.authors.some((author) =>
        author.name.toLocaleLowerCase().includes(query),
      );
    return matchesQuery && (!categoryId || book.category.id === categoryId);
  });
  const start = (page - 1) * size;

  return {
    items: filtered.slice(start, start + size).map(withAvailability),
    page,
    size,
    totalItems: filtered.length,
    totalPages: Math.ceil(filtered.length / size),
  };
}

export async function getBook(bookId: number): Promise<BookListItem> {
  await simulateServiceDelay();
  const book = mockBooks.find(({ id }) => id === bookId);
  if (!book) throw new MockServiceError('Livro não encontrado.', 'NOT_FOUND');
  return withAvailability(book);
}

export async function listCopies(bookId?: number): Promise<Copy[]> {
  await simulateServiceDelay();
  return mockCopies
    .filter((copy) => bookId === undefined || copy.bookId === bookId)
    .map((copy) => ({ ...copy }));
}

export async function createBook(
  input: CreateBookInput,
): Promise<BookListItem> {
  await simulateServiceDelay();
  simulateSearchError(input.isbn);
  if (mockBooks.some((book) => book.isbn === input.isbn.trim())) {
    throw new MockServiceError(
      'Este ISBN já está cadastrado.',
      'ISBN_ALREADY_REGISTERED',
    );
  }
  const book = mapBookInput(
    Math.max(0, ...mockBooks.map(({ id }) => id)) + 1,
    input,
  );
  mockBooks.push(book);
  return withAvailability(book);
}

export async function updateBook(
  bookId: number,
  input: Partial<CreateBookInput>,
): Promise<BookListItem> {
  await simulateServiceDelay();
  const index = mockBooks.findIndex(({ id }) => id === bookId);
  if (index < 0)
    throw new MockServiceError('Livro não encontrado.', 'NOT_FOUND');

  const current = mockBooks[index];
  if (
    input.isbn &&
    mockBooks.some((book) => book.id !== bookId && book.isbn === input.isbn)
  ) {
    throw new MockServiceError(
      'Este ISBN já está cadastrado.',
      'ISBN_ALREADY_REGISTERED',
    );
  }
  const category =
    input.categoryId !== undefined
      ? mockCategories.find(({ id }) => id === input.categoryId)
      : current.category;
  if (!category) {
    throw new MockServiceError('Categoria não encontrada.', 'VALIDATION_ERROR');
  }
  const authors = input.authorIds
    ? input.authorIds.map((id) => {
        const author = mockAuthors.find((item) => item.id === id);
        if (!author)
          throw new MockServiceError(
            'Autor não encontrado.',
            'VALIDATION_ERROR',
          );
        return author;
      })
    : current.authors;
  const isbn = input.isbn?.trim() ?? current.isbn;
  if (!/^([0-9]{9}[0-9X]|[0-9]{13})$/.test(isbn)) {
    throw new MockServiceError('Informe um ISBN válido.', 'VALIDATION_ERROR');
  }
  const next = {
    ...current,
    isbn,
    title: input.title?.trim() ?? current.title,
    publisher:
      input.publisher !== undefined ? input.publisher : current.publisher,
    publicationPlace:
      input.publicationPlace !== undefined
        ? input.publicationPlace
        : current.publicationPlace,
    edition: input.edition !== undefined ? input.edition : current.edition,
    coverImageUrl:
      input.coverImageUrl !== undefined
        ? input.coverImageUrl
        : current.coverImageUrl,
    publicationDate:
      input.publicationDate !== undefined
        ? input.publicationDate
        : current.publicationDate,
    pageCount:
      input.pageCount !== undefined ? input.pageCount : current.pageCount,
    summary: input.summary !== undefined ? input.summary : current.summary,
    category: { ...category },
    authors: authors.map((author) => ({ ...author })),
  };

  mockBooks[index] = next;
  return withAvailability(next);
}

export async function deleteBook(bookId: number): Promise<void> {
  await simulateServiceDelay();
  const bookIndex = mockBooks.findIndex(({ id }) => id === bookId);
  if (bookIndex < 0)
    throw new MockServiceError('Livro não encontrado.', 'NOT_FOUND');
  const bookCopyIds = mockCopies
    .filter(({ bookId: id }) => id === bookId)
    .map(({ id }) => id);
  if (hasLoansForCopies(bookCopyIds)) {
    throw new MockServiceError(
      'Não é possível excluir um livro com exemplares vinculados a empréstimos.',
      'CONFLICT',
    );
  }

  function hasLoansForCopies(copyIds: number[]): boolean {
    return copyIds.some((copyId) =>
      mockLoans.some((loan) => loan.copyId === copyId),
    );
  }
  for (let index = mockCopies.length - 1; index >= 0; index -= 1) {
    if (mockCopies[index].bookId === bookId) mockCopies.splice(index, 1);
  }
  mockBooks.splice(bookIndex, 1);
}
