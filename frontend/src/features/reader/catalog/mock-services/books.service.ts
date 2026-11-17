import {
  mockAuthors,
  mockBooks,
  mockCategories,
  mockCopies,
  mockDeletedBookIds,
  mockLoans,
} from '../../../../shared/mocks/data';
import {
  MockServiceError,
  simulateSearchError,
  simulateServiceDelay,
} from '../../../../shared/mocks/service-utils';
import type {
  Book,
  BookListItem,
  Copy,
  CreateBookInput,
  PageResponse,
} from '../../../../shared/types/library';
import type { SearchablePaginationParams } from '../../../../shared/api/request-params';

export interface ListBooksParams extends SearchablePaginationParams {
  categoryId?: number;
}

export interface RegisterBookWithCopiesInput {
  isbn: string;
  title: string;
  authors: string[];
  categoryId: number;
  publisher: string | null;
  publicationPlace: string | null;
  edition: string | null;
  publicationDate: string | null;
  pageCount: number | null;
  coverImageUrl: string | null;
  summary: string | null;
  copies: Array<{
    copyId?: number;
    accessionNumber: string;
    physicalLocation: string | null;
  }>;
}

export interface RegisteredBook extends BookListItem {
  copiesCount: number;
}

function normalizeIsbn(isbn: string): string {
  return isbn.replace(/[\s-]/g, '').toUpperCase();
}

function resolveAuthors(names: string[]) {
  const newAuthors: typeof mockAuthors = [];
  const authors = names.map((name) => {
    const normalizedName = name.trim().toLocaleLowerCase();
    const existing = [...mockAuthors, ...newAuthors].find(
      (author) => author.name.toLocaleLowerCase() === normalizedName,
    );
    if (existing) return existing;

    const author = {
      id:
        Math.max(
          0,
          ...mockAuthors.map(({ id }) => id),
          ...newAuthors.map(({ id }) => id),
        ) + 1,
      name: name.trim(),
    };
    newAuthors.push(author);
    return author;
  });
  return { authors, newAuthors };
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

export async function registerBookWithCopies(
  input: RegisterBookWithCopiesInput,
): Promise<RegisteredBook> {
  await simulateServiceDelay();
  const isbn = normalizeIsbn(input.isbn);
  simulateSearchError(isbn);

  if (!/^(\d{9}[\dX]|\d{13})$/.test(isbn)) {
    throw new MockServiceError(
      'Digite um ISBN-10 ou ISBN-13 válido.',
      'VALIDATION_ERROR',
    );
  }
  if (mockBooks.some((book) => normalizeIsbn(book.isbn) === isbn)) {
    throw new MockServiceError(
      'Este ISBN já está cadastrado.',
      'ISBN_ALREADY_REGISTERED',
    );
  }
  const category = mockCategories.find(({ id }) => id === input.categoryId);
  if (!category) {
    throw new MockServiceError(
      'Selecione uma categoria válida.',
      'VALIDATION_ERROR',
    );
  }

  const accessionNumbers = input.copies.map(({ accessionNumber }) =>
    accessionNumber.trim().toLocaleLowerCase(),
  );
  const hasDuplicateAccessionNumbers =
    new Set(accessionNumbers).size !== accessionNumbers.length;
  const hasExistingAccessionNumber = accessionNumbers.some((accessionNumber) =>
    mockCopies.some(
      (copy) =>
        copy.accessionNumber.trim().toLocaleLowerCase() === accessionNumber,
    ),
  );
  if (hasDuplicateAccessionNumbers || hasExistingAccessionNumber) {
    throw new MockServiceError(
      'Um ou mais tombos já estão cadastrados.',
      'CONFLICT',
    );
  }

  const { authors, newAuthors } = resolveAuthors(input.authors);
  const bookId = Math.max(0, ...mockBooks.map(({ id }) => id)) + 1;
  const book: Book = {
    id: bookId,
    isbn,
    title: input.title.trim(),
    publisher: input.publisher?.trim() || null,
    publicationPlace: input.publicationPlace?.trim() || null,
    edition: input.edition?.trim() || null,
    coverImageUrl: input.coverImageUrl?.trim() || null,
    publicationDate: input.publicationDate,
    pageCount: input.pageCount,
    summary: input.summary?.trim() || null,
    category: { ...category },
    authors: authors.map((author) => ({ ...author })),
  };
  const firstCopyId = Math.max(0, ...mockCopies.map(({ id }) => id)) + 1;
  const copies: Copy[] = input.copies.map((copy, index) => ({
    id: firstCopyId + index,
    bookId,
    accessionNumber: copy.accessionNumber.trim(),
    physicalLocation: copy.physicalLocation?.trim() || null,
    status: 'AVAILABLE',
  }));

  mockAuthors.push(...newAuthors);
  mockBooks.unshift(book);
  mockCopies.push(...copies);
  return { ...withAvailability(book), copiesCount: copies.length };
}

export async function updateBookWithCopies(
  bookId: number,
  input: RegisterBookWithCopiesInput,
): Promise<RegisteredBook> {
  await simulateServiceDelay();
  const bookIndex = mockBooks.findIndex(({ id }) => id === bookId);
  if (bookIndex < 0) {
    throw new MockServiceError('Livro não encontrado.', 'NOT_FOUND');
  }
  if (mockDeletedBookIds.has(bookId)) {
    throw new MockServiceError('Livro não encontrado.', 'NOT_FOUND');
  }

  const isbn = normalizeIsbn(input.isbn);
  if (!/^(\d{9}[\dX]|\d{13})$/.test(isbn)) {
    throw new MockServiceError(
      'Digite um ISBN-10 ou ISBN-13 válido.',
      'VALIDATION_ERROR',
    );
  }
  if (
    mockBooks.some(
      (book) => book.id !== bookId && normalizeIsbn(book.isbn) === isbn,
    )
  ) {
    throw new MockServiceError(
      'Este ISBN já está cadastrado.',
      'ISBN_ALREADY_REGISTERED',
    );
  }
  const category = mockCategories.find(({ id }) => id === input.categoryId);
  if (!category) {
    throw new MockServiceError(
      'Selecione uma categoria válida.',
      'VALIDATION_ERROR',
    );
  }

  const existingCopies = mockCopies.filter((copy) => copy.bookId === bookId);
  const accessionNumbers = input.copies.map(({ accessionNumber }) =>
    accessionNumber.trim().toLocaleLowerCase(),
  );
  if (new Set(accessionNumbers).size !== accessionNumbers.length) {
    throw new MockServiceError(
      'Um ou mais tombos estão repetidos.',
      'CONFLICT',
    );
  }
  if (
    accessionNumbers.some((accessionNumber) =>
      mockCopies.some(
        (copy) =>
          copy.bookId !== bookId &&
          copy.accessionNumber.trim().toLocaleLowerCase() === accessionNumber,
      ),
    )
  ) {
    throw new MockServiceError(
      'Um ou mais tombos já pertencem a outro exemplar.',
      'CONFLICT',
    );
  }

  const matchedCopyIds = new Set<number>();
  const copyUpdates = input.copies.map((inputCopy, index) => {
    const existing =
      inputCopy.copyId === undefined
        ? existingCopies.find(
            (copy) =>
              !matchedCopyIds.has(copy.id) &&
              copy.accessionNumber.trim().toLocaleLowerCase() ===
                inputCopy.accessionNumber.trim().toLocaleLowerCase(),
          )
        : existingCopies.find((copy) => copy.id === inputCopy.copyId);
    if (inputCopy.copyId !== undefined && !existing) {
      throw new MockServiceError(
        'Exemplar não pertence a este livro.',
        'VALIDATION_ERROR',
      );
    }
    if (existing) matchedCopyIds.add(existing.id);
    return { inputCopy, existing, index };
  });
  const removedCopies = existingCopies.filter(
    (copy) => !matchedCopyIds.has(copy.id),
  );
  if (
    removedCopies.some((copy) =>
      mockLoans.some((loan) => loan.copyId === copy.id),
    )
  ) {
    throw new MockServiceError(
      'Não é possível remover exemplares vinculados a empréstimos.',
      'CONFLICT',
    );
  }
  for (const { inputCopy, existing } of copyUpdates) {
    if (
      existing?.status === 'ON_LOAN' &&
      (inputCopy.accessionNumber.trim() !== existing.accessionNumber ||
        (inputCopy.physicalLocation?.trim() || null) !==
          existing.physicalLocation)
    ) {
      throw new MockServiceError(
        'Não é possível alterar um exemplar emprestado.',
        'CONFLICT',
      );
    }
  }

  const { authors, newAuthors } = resolveAuthors(input.authors);
  const updatedBook: Book = {
    ...mockBooks[bookIndex],
    isbn,
    title: input.title.trim(),
    publisher: input.publisher?.trim() || null,
    publicationPlace: input.publicationPlace?.trim() || null,
    edition: input.edition?.trim() || null,
    coverImageUrl: input.coverImageUrl?.trim() || null,
    publicationDate: input.publicationDate,
    pageCount: input.pageCount,
    summary: input.summary?.trim() || null,
    category: { ...category },
    authors: authors.map((author) => ({ ...author })),
  };
  const nextCopyId = Math.max(0, ...mockCopies.map(({ id }) => id)) + 1;
  const updatedCopies = copyUpdates.map(({ inputCopy, existing, index }) => {
    return {
      id: existing?.id ?? nextCopyId + index,
      bookId,
      accessionNumber: inputCopy.accessionNumber.trim(),
      physicalLocation: inputCopy.physicalLocation?.trim() || null,
      status: existing?.status ?? 'AVAILABLE',
    } satisfies Copy;
  });

  mockAuthors.push(...newAuthors);
  mockBooks[bookIndex] = updatedBook;
  for (let index = mockCopies.length - 1; index >= 0; index -= 1) {
    if (mockCopies[index].bookId === bookId) mockCopies.splice(index, 1);
  }
  mockCopies.push(...updatedCopies);
  return {
    ...withAvailability(updatedBook),
    copiesCount: updatedCopies.length,
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
}: ListBooksParams): Promise<PageResponse<BookListItem>> {
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
    if (mockDeletedBookIds.has(book.id)) return false;
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
    content: filtered.slice(start, start + size).map(withAvailability),
    page,
    size,
    totalElements: filtered.length,
    totalPages: Math.ceil(filtered.length / size),
  };
}

export async function listAllBooks(): Promise<BookListItem[]> {
  const size = 100;
  const firstPage = await listBooks({ page: 1, size });
  if (firstPage.totalPages <= 1) return firstPage.content;

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      listBooks({ page: index + 2, size }),
    ),
  );
  return [
    ...firstPage.content,
    ...remainingPages.flatMap((result) => result.content),
  ];
}

export async function getBook(bookId: number): Promise<BookListItem> {
  await simulateServiceDelay();
  const book = mockBooks.find(
    ({ id }) => id === bookId && !mockDeletedBookIds.has(id),
  );
  if (!book) throw new MockServiceError('Livro não encontrado.', 'NOT_FOUND');
  return withAvailability(book);
}

export async function listCopies(bookId?: number): Promise<Copy[]> {
  await simulateServiceDelay();
  return mockCopies
    .filter((copy) => bookId === undefined || copy.bookId === bookId)
    .map((copy) => ({ ...copy }));
}

export async function listActiveCopies(bookId?: number): Promise<Copy[]> {
  await simulateServiceDelay();
  return mockCopies
    .filter(
      (copy) =>
        !mockDeletedBookIds.has(copy.bookId) &&
        (bookId === undefined || copy.bookId === bookId),
    )
    .map((copy) => ({ ...copy }));
}

export async function createBook(
  input: CreateBookInput,
): Promise<BookListItem> {
  await simulateServiceDelay();
  const isbn = normalizeIsbn(input.isbn);
  simulateSearchError(isbn);
  if (mockBooks.some((book) => normalizeIsbn(book.isbn) === isbn)) {
    throw new MockServiceError(
      'Este ISBN já está cadastrado.',
      'ISBN_ALREADY_REGISTERED',
    );
  }
  const book = mapBookInput(Math.max(0, ...mockBooks.map(({ id }) => id)) + 1, {
    ...input,
    isbn,
  });
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
  if (mockDeletedBookIds.has(bookId))
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
  const book = mockBooks.find(({ id }) => id === bookId);
  if (!book || mockDeletedBookIds.has(bookId))
    throw new MockServiceError('Livro não encontrado.', 'NOT_FOUND');
  const bookCopyIds = new Set(
    mockCopies.filter((copy) => copy.bookId === bookId).map((copy) => copy.id),
  );
  if (
    mockLoans.some(
      (loan) => bookCopyIds.has(loan.copyId) && loan.returnDate === null,
    )
  ) {
    throw new MockServiceError(
      'Não é possível excluir um livro com empréstimo ativo.',
      'CONFLICT',
    );
  }
  mockDeletedBookIds.add(bookId);
}
