import { httpClient } from '@/shared/api/http-client';
import { toApiPageParams } from '@/shared/api/request-params';
import type { AffiliationType, PageResponse } from '@/shared/types/library';

export type ManagementReaderStatus = 'REGULAR' | 'PENDING';

export interface LoanReaderOption {
  id: number;
  name: string;
  email: string;
  status: ManagementReaderStatus;
}

export interface ManagementReaderDto extends LoanReaderOption {
  phone: string | null;
  affiliationType: AffiliationType;
  courseName: string | null;
  activeLoans: number;
}

export interface ReaderManagementSummaryDto {
  totalReaders: number;
  readersWithActiveLoans: number;
  readersWithOverdueLoans: number;
}

export interface ListManagementReadersParams {
  page: number;
  size: number;
  search?: string;
  affiliationType?: AffiliationType;
  status?: ManagementReaderStatus;
}

export async function searchReadersForLoan(
  search: string,
): Promise<LoanReaderOption[]> {
  const { data } = await httpClient.get<PageResponse<LoanReaderOption>>(
    '/readers',
    {
      params: { search: search.trim(), page: 0, size: 5 },
    },
  );
  return data.content;
}

export async function listManagementReaders({
  page,
  size,
  search,
  affiliationType,
  status,
}: ListManagementReadersParams): Promise<PageResponse<ManagementReaderDto>> {
  const { data } = await httpClient.get<PageResponse<ManagementReaderDto>>(
    '/readers',
    {
      params: {
        ...toApiPageParams({ page, size }),
        search: search?.trim() || undefined,
        linkType: affiliationType,
        status: status ? [status] : undefined,
      },
    },
  );
  return { ...data, page: data.page + 1 };
}

export async function getReaderManagementSummary(): Promise<ReaderManagementSummaryDto> {
  const { data } =
    await httpClient.get<ReaderManagementSummaryDto>('/readers/summary');
  return data;
}
