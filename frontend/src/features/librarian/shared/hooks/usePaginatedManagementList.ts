import { useEffect, useState } from 'react';
import type { PageResponse } from '@/shared/types/library';
import { getErrorMessage } from '../utils/error-message';

export interface ManagementListParams {
  page: number;
  size: number;
  search: string;
}

interface UsePaginatedManagementListOptions<T> extends ManagementListParams {
  refreshKey: number;
  loadPage: (params: ManagementListParams) => Promise<PageResponse<T>>;
  errorFallback: string;
}

export function usePaginatedManagementList<T>({
  page,
  size,
  search,
  refreshKey,
  loadPage,
  errorFallback,
}: UsePaginatedManagementListOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timeoutId = window.setTimeout(() => {
      async function load() {
        setIsLoading(true);
        setError(null);
        try {
          const result = await loadPage({ page, size, search });
          if (!active) return;
          setItems(result.content);
          setTotalItems(result.totalElements);
          setTotalPages(Math.max(1, result.totalPages));
        } catch (requestError) {
          if (active) {
            setError(getErrorMessage(requestError, errorFallback));
          }
        } finally {
          if (active) setIsLoading(false);
        }
      }

      void load();
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [errorFallback, loadPage, page, refreshKey, search, size]);

  return { items, totalItems, totalPages, isLoading, error };
}
