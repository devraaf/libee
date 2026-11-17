export interface PaginationParams {
  page: number;
  size: number;
}

export interface SearchablePaginationParams extends PaginationParams {
  search?: string;
}

export function toApiPageParams({ page, size }: PaginationParams) {
  return { page: page - 1, size };
}
