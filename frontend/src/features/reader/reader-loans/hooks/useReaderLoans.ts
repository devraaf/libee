import { useCallback, useEffect, useState } from 'react';
import type { PageResponse } from '@/shared/types/library';
import {
  listMyLoans,
  renewMyLoan,
} from '@/features/reader/services/reader-api.service';
import type { ReaderLoan } from '../utils/readerLoans';

export type ReaderLoanStatusFilter = 'all' | 'on_time' | 'overdue';

const PAGE_SIZE = 10;

function emptyPage<T>(page: number): PageResponse<T> {
  return {
    content: [],
    page,
    size: PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
  };
}

interface State {
  isLoading: boolean;
  error: string | null;
  active: PageResponse<ReaderLoan>;
  history: PageResponse<ReaderLoan>;
}

function initialState(): State {
  return {
    isLoading: true,
    error: null,
    active: emptyPage(1),
    history: emptyPage(1),
  };
}

export function useReaderLoans(
  search: string,
  status: ReaderLoanStatusFilter,
  activePage: number,
  historyPage: number,
) {
  const [state, setState] = useState<State>(initialState);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;

    async function load() {
      setState((previous) => ({ ...previous, isLoading: true, error: null }));
      try {
        const activeStatuses =
          status === 'on_time'
            ? ['ON_TIME' as const]
            : status === 'overdue'
              ? ['OVERDUE' as const]
              : (['ON_TIME', 'OVERDUE'] as const);
        const [active, history] = await Promise.all([
          listMyLoans({
            statuses: [...activeStatuses],
            page: activePage,
            size: PAGE_SIZE,
            search,
          }),
          listMyLoans({
            statuses: ['RETURNED'],
            page: historyPage,
            size: PAGE_SIZE,
            search,
          }),
        ]);
        if (!current) return;
        setState({ isLoading: false, error: null, active, history });
      } catch (error) {
        if (!current) return;
        setState((previous) => ({
          ...previous,
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar os empréstimos.',
        }));
      }
    }

    void load();
    return () => {
      current = false;
    };
  }, [activePage, attempt, historyPage, search, status]);

  const reload = useCallback(() => {
    setState((previous) => ({ ...previous, isLoading: true, error: null }));
    setAttempt((value) => value + 1);
  }, []);

  const renew = useCallback(async (loanId: number) => {
    const updatedLoan = await renewMyLoan(loanId);
    setState((current) => ({
      ...current,
      active: {
        ...current.active,
        content: current.active.content.map((loan) =>
          loan.id === updatedLoan.id ? updatedLoan : loan,
        ),
      },
    }));
  }, []);

  return {
    ...state,
    reload,
    renew,
  };
}
