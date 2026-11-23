import { httpClient } from '@/shared/api/http-client';
import { toApiPageParams } from '@/shared/api/request-params';
import type { PageResponse } from '@/shared/types/library';

export type ManagementLoanStatus = 'ON_TIME' | 'OVERDUE';

export interface ActiveLoanDto {
  id: number;
  readerName: string;
  title: string;
  accessionNumber: string;
  loanDate: string;
  dueDate: string;
  renewalCount: number;
  status: ManagementLoanStatus;
}

export interface ReturnedLoanDto {
  id: number;
  readerName: string;
  title: string;
  accessionNumber: string;
  returnDate: string;
}

export interface LoanSummaryDto {
  activeLoans: number;
  onTimeLoans: number;
  overdueLoans: number;
}

export interface CreateLoanRequest {
  readerId: number;
  accessionNumber: string;
  dueDate: string;
}

export interface ListManagementLoansParams {
  page: number;
  size: number;
  search?: string;
  status?: ManagementLoanStatus;
}

export interface ListReturnedLoansParams {
  page: number;
  size: number;
  search?: string;
}

export async function listManagementLoans({
  page,
  size,
  search,
  status,
}: ListManagementLoansParams): Promise<PageResponse<ActiveLoanDto>> {
  const { data } = await httpClient.get<PageResponse<ActiveLoanDto>>(
    '/loans/management',
    {
      params: {
        ...toApiPageParams({ page, size }),
        search: search?.trim() || undefined,
        status: status ? [status] : undefined,
      },
    },
  );
  return { ...data, page: data.page + 1 };
}

export async function getLoanManagementSummary(): Promise<LoanSummaryDto> {
  const { data } = await httpClient.get<LoanSummaryDto>(
    '/loans/management/summary',
  );
  return data;
}

export async function listReturnedLoans({
  page,
  size,
  search,
}: ListReturnedLoansParams): Promise<PageResponse<ReturnedLoanDto>> {
  const { data } = await httpClient.get<PageResponse<ReturnedLoanDto>>(
    '/loans/management/returns',
    {
      params: {
        ...toApiPageParams({ page, size }),
        search: search?.trim() || undefined,
      },
    },
  );
  return { ...data, page: data.page + 1 };
}

export async function createLoan(
  input: CreateLoanRequest,
): Promise<ActiveLoanDto> {
  const { data } = await httpClient.post<ActiveLoanDto>('/loans', input);
  return data;
}

export async function returnLoan(
  accessionNumber: string,
): Promise<ReturnedLoanDto> {
  const { data } = await httpClient.post<ReturnedLoanDto>('/loans/returns', {
    accessionNumber,
  });
  return data;
}
