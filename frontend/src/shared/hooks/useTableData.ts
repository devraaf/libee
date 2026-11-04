import { useMemo, useState } from 'react';

export const TABLE_PAGE_SIZE = 5;

export interface UseTableDataOptions<T> {
  data: readonly T[];
  search: string;
  getSearchText: (item: T) => string | readonly string[];
  filters?: Readonly<Record<string, string>>;
  matchesFilters?: (
    item: T,
    filters: Readonly<Record<string, string>>,
  ) => boolean;
}

export function useTableData<T>({
  data,
  search,
  getSearchText,
  filters = {},
  matchesFilters,
}: UseTableDataOptions<T>) {
  const [pagination, setPagination] = useState({
    page: 1,
    search: '',
    filtersKey: '{}',
  });
  const filtersKey = JSON.stringify(filters);
  const query = search.trim().toLocaleLowerCase();

  const filteredData = useMemo(
    () =>
      data.filter((item) => {
        const searchText = getSearchText(item);
        const searchableValues = Array.isArray(searchText)
          ? searchText
          : [searchText];
        const matchesSearch =
          !query ||
          searchableValues.some((value) =>
            value.toLocaleLowerCase().includes(query),
          );
        return (
          matchesSearch &&
          (!matchesFilters || matchesFilters(item, filters))
        );
      }),
    [data, filters, getSearchText, matchesFilters, query],
  );

  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / TABLE_PAGE_SIZE));
  const requestedPage =
    pagination.search === query && pagination.filtersKey === filtersKey
      ? pagination.page
      : 1;
  const currentPage = Math.min(requestedPage, totalPages);
  const setPage = (nextPage: number) => {
    setPagination({
      page: Math.min(Math.max(nextPage, 1), totalPages),
      search: query,
      filtersKey,
    });
  };

  const items = useMemo(
    () =>
      filteredData.slice(
        (currentPage - 1) * TABLE_PAGE_SIZE,
        currentPage * TABLE_PAGE_SIZE,
      ),
    [currentPage, filteredData],
  );

  return {
    items,
    filteredData,
    page: currentPage,
    setPage,
    totalItems,
    totalPages,
  };
}
