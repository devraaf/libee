import { dateFromToday } from '../../../../shared/utils/date';
import type { Loan, BookListItem } from '../../../../shared/types/library';
import { formatLibraryDate } from '@/shared/utils/format-date';

export type LoanStatus = 'on_time' | 'overdue' | 'returned';

export interface BookInfo {
  title: string;
  author: string | null;
  coverUrl: string | null;
  year: string | null;
}

export interface ReaderLoan {
  id: number;
  bookId: number | null;
  title: string;
  author: string | null;
  coverUrl: string | null;
  year: string | null;
  tombo: string | null;
  loanDate: string;
  dueDate: string;
  returnDate: string | null;
  renewalCount: number;
  status: LoanStatus;
}

export const getBookPath = (bookId: number) => `/livros/${bookId}`;

export function toBookInfo(book: BookListItem): BookInfo {
  return {
    title: book.title,
    author: book.authors.map(({ name }) => name).join(', ') || null,
    coverUrl: book.coverImageUrl,
    year: book.publicationDate?.slice(0, 4) ?? null,
  };
}

export function getLoanStatus(loan: Loan): LoanStatus {
  if (loan.returnDate) return 'returned';
  return loan.dueDate < dateFromToday(0) ? 'overdue' : 'on_time';
}

export function formatDate(value: string | null): string {
  return formatLibraryDate(value);
}

const compareDates = (a: string | null, b: string | null): number => {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b);
};

export const sortActive = (a: ReaderLoan, b: ReaderLoan): number =>
  compareDates(a.dueDate, b.dueDate);

export const sortHistory = (a: ReaderLoan, b: ReaderLoan): number =>
  compareDates(b.returnDate, a.returnDate);
