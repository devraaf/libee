import { httpClient } from '@/shared/api/http-client';
import { toApiPageParams } from '@/shared/api/request-params';
import type { PageResponse } from '@/shared/types/library';
import type {
  AddCopiesRequest,
  BookLookupDto,
  BookManagementDto,
  BookManagementSummaryDto,
  RegisterCopyRequest,
  RegisterBookRequest,
  RegisteredBookDto,
  UpdateBookRequest,
} from '../types/book-management';

export async function listManagedBooks({
  page,
  size,
  search,
  categoryId,
}: {
  page: number;
  size: number;
  search?: string;
  categoryId?: number;
}): Promise<PageResponse<BookManagementDto>> {
  const { data } = await httpClient.get<PageResponse<BookManagementDto>>(
    '/books/management',
    {
      params: {
        ...toApiPageParams({ page, size }),
        q: search?.trim() || undefined,
        categoryId,
      },
    },
  );
  return { ...data, page: data.page + 1 };
}

export async function getBookManagementSummary(): Promise<BookManagementSummaryDto> {
  const { data } = await httpClient.get<BookManagementSummaryDto>(
    '/books/management/summary',
  );
  return data;
}

export async function lookupBookByIsbn(isbn: string): Promise<BookLookupDto> {
  const { data } = await httpClient.get<BookLookupDto>(
    '/books/management/lookup',
    { params: { isbn } },
  );
  return data;
}

export async function registerManagedBook(
  request: RegisterBookRequest,
): Promise<RegisteredBookDto> {
  const { data } = await httpClient.post<RegisteredBookDto>('/books', request);
  return data;
}

export async function updateManagedBook(
  bookId: number,
  request: UpdateBookRequest,
): Promise<void> {
  await httpClient.put(`/books/${bookId}`, request);
}

export async function addManagedCopy(
  bookId: number,
  request: RegisterCopyRequest,
): Promise<void> {
  const body: AddCopiesRequest = { copies: [request] };
  await httpClient.post(`/books/${bookId}/copies`, body);
}

export async function deleteManagedBook(bookId: number): Promise<void> {
  await httpClient.delete(`/books/${bookId}`);
}

export async function deleteManagedCopy(
  bookId: number,
  copyId: number,
): Promise<void> {
  await httpClient.delete(`/books/${bookId}/copies/${copyId}`);
}
