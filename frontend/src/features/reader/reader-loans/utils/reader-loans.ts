import { dateFromToday } from '../../../../shared/mocks/dates';
import type { Loan } from '../../../../shared/types/library';

export type LoanStatus = 'on_time' | 'overdue' | 'returned';

export interface BookInfo {
  title: string;
  author: string | null;
  coverUrl: string | null;
}

export interface ReaderLoan {
  id: number;
  bookId: number | null;
  title: string;
  author: string | null;
  coverUrl: string | null;
  tombo: string | null;
  loanDate: string;
  dueDate: string;
  returnDate: string | null;
  renewalCount: number;
  status: LoanStatus;
}

export const getBookPath = (bookId: number) => `/livros/${bookId}`;

export function toBookInfo(book: unknown): BookInfo {
  const raw = book as Record<string, unknown>;
  const text = (value: unknown) =>
    typeof value === 'string' && value ? value : null;
  return {
    title: text(raw.title) ?? 'Título não informado',
    author: text(raw.author),
    coverUrl: text(raw.coverUrl),
  };
}

export function getLoanStatus(loan: Loan): LoanStatus {
  if (loan.returnDate) return 'returned';
  return loan.dueDate < dateFromToday(0) ? 'overdue' : 'on_time';
}

export function formatDate(value: string | null): string {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})/.exec(value) : null;
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '—';
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