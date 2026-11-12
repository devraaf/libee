import { httpClient } from '@/shared/api/http-client';
import {
  toApiPageParams,
  type SearchablePaginationParams,
} from '@/shared/api/request-params';
import type { PageResponse } from '@/shared/types/library';
import type {
  ReaderBookDto,
  ReaderLoanDto,
  UpcomingReturn,
  UpcomingReturnDto,
} from './reader-api.mapper';
import type { BookDisplay } from '@/shared/types/library';
import {
  mapReaderBook,
  mapReaderLoan,
  mapReaderPage,
  mapUpcomingReturn,
} from './reader-api.mapper';
import type { ReaderLoan } from '../reader-loans/utils/readerLoans';

export interface ListReaderBooksParams extends SearchablePaginationParams {
  categoryId?: number;
}

export interface ListReaderLoansParams extends SearchablePaginationParams {
  statuses: Array<'ON_TIME' | 'OVERDUE' | 'RETURNED'>;
}

export async function listReaderBooks({
  page,
  size,
  search,
  categoryId,
}: ListReaderBooksParams): Promise<PageResponse<BookDisplay>> {
  const { data } = await httpClient.get<PageResponse<ReaderBookDto>>('/books', {
    params: {
      ...toApiPageParams({ page, size }),
      q: search || undefined,
      categoryId,
    },
  });
  return mapReaderPage(data, mapReaderBook);
}

export async function listMyLoans({
  statuses,
  page,
  size,
  search,
}: ListReaderLoansParams): Promise<PageResponse<ReaderLoan>> {
  const { data } = await httpClient.get<PageResponse<ReaderLoanDto>>('/loans', {
    params: {
      status: statuses,
      ...toApiPageParams({ page, size }),
      search: search || undefined,
    },
  });
  return mapReaderPage(data, mapReaderLoan);
}

export async function listUpcomingReturns(): Promise<UpcomingReturn[]> {
  const { data } = await httpClient.get<UpcomingReturnDto[]>(
    '/loans/upcoming-returns',
  );
  return data.map(mapUpcomingReturn);
}

export async function renewMyLoan(loanId: number): Promise<ReaderLoan> {
  const { data } = await httpClient.patch<ReaderLoanDto>(`/loans/${loanId}`);
  return mapReaderLoan(data);
}
