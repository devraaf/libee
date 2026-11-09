import { useCallback, useEffect, useState } from 'react';
import {
  getBook,
  listActiveCopies,
} from '../../catalog/services/books.service';
import {
  listLoans,
  renewLoan as renewLoanService,
} from '../../../loans/services/loans.service';
import {
  getLoanStatus,
  sortActive,
  sortHistory,
  toBookInfo,
  type BookInfo,
  type ReaderLoan,
} from '../utils/readerLoans';

interface State {
  isLoading: boolean;
  error: string | null;
  active: ReaderLoan[];
  history: ReaderLoan[];
  loadedReaderId: number | null;
}

const initialState: State = {
  isLoading: true,
  error: null,
  active: [],
  history: [],
  loadedReaderId: null,
};

export function useReaderLoans(readerId?: number) {
  const [state, setState] = useState<State>(initialState);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (readerId === undefined) return;

    let current = true;

    async function load() {
      try {
        const [loans, copies] = await Promise.all([
          listLoans(),
          listActiveCopies(),
        ]);
        const mine = loans.filter((loan) => loan.readerId === readerId);
        const copiesById = new Map(copies.map((copy) => [copy.id, copy]));

        const bookIds = [
          ...new Set(
            mine
              .map((loan) => copiesById.get(loan.copyId)?.bookId)
              .filter((id): id is number => id !== undefined),
          ),
        ];
        const results = await Promise.allSettled(
          bookIds.map((id) => getBook(id)),
        );
        const booksById = new Map<number, BookInfo>();
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            booksById.set(bookIds[index], toBookInfo(result.value));
          }
        });

        const items: ReaderLoan[] = mine.map((loan) => {
          const copy = copiesById.get(loan.copyId);
          const book = copy ? booksById.get(copy.bookId) : undefined;
          return {
            id: loan.id,
            bookId: copy && book ? copy.bookId : null,
            title: book?.title ?? 'Título não informado',
            author: book?.author ?? null,
            coverUrl: book?.coverUrl ?? null,
            year: book?.year ?? null,
            tombo: copy?.accessionNumber ?? null,
            loanDate: loan.loanDate,
            dueDate: loan.dueDate,
            returnDate: loan.returnDate,
            renewalCount: loan.renewalCount,
            status: getLoanStatus(loan),
          };
        });

        if (!current) return;
        setState({
          isLoading: false,
          error: null,
          active: items
            .filter((item) => item.status !== 'returned')
            .sort(sortActive),
          history: items
            .filter((item) => item.status === 'returned')
            .sort(sortHistory),
          loadedReaderId: readerId ?? null,
        });
      } catch (error) {
        if (!current) return;
        setState({
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar os empréstimos.',
          active: [],
          history: [],
          loadedReaderId: readerId ?? null,
        });
      }
    }

    void load();
    return () => {
      current = false;
    };
  }, [readerId, attempt]);

  const reload = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    setAttempt((value) => value + 1);
  }, []);

  const renew = useCallback(async (loanId: number) => {
    const loan = await renewLoanService(loanId);
    setState((current) => ({
      ...current,
      active: current.active.map((item) =>
        item.id === loan.id
          ? {
              ...item,
              dueDate: loan.dueDate,
              renewalCount: loan.renewalCount,
              status: getLoanStatus(loan),
            }
          : item,
      ),
    }));
  }, []);

  const isLoadedForReader =
    readerId !== undefined && state.loadedReaderId === readerId;

  return {
    isLoading:
      readerId !== undefined && (state.isLoading || !isLoadedForReader),
    error: isLoadedForReader ? state.error : null,
    active: isLoadedForReader ? state.active : [],
    history: isLoadedForReader ? state.history : [],
    reload,
    renew,
  };
}
