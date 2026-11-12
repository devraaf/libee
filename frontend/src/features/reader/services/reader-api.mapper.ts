import type { BookDisplay, PageResponse } from '@/shared/types/library';
import { mapAuthorNames } from '@/shared/utils/book-authors';
import type { LoanStatus, ReaderLoan } from '../reader-loans/utils/readerLoans';

export interface ReaderBookDto {
  id: number;
  title: string;
  authors: string[];
  publicationYear: number | null;
  category: string;
  coverImageUrl: string | null;
  available: boolean;
}

export interface ReaderLoanDto {
  id: number;
  book: {
    id: number;
    title: string;
    authors: string[];
    coverImageUrl: string | null;
  };
  accessionNumber: string;
  loanDate: string;
  dueDate: string;
  returnDate: string | null;
  renewalCount: number;
  status: 'ON_TIME' | 'OVERDUE' | 'RETURNED';
}

export interface UpcomingReturnDto {
  id: number;
  bookId: number;
  title: string;
  authors: string[];
  publicationYear: number | null;
  coverImageUrl: string | null;
  dueDate: string;
}

export interface UpcomingReturn {
  id: number;
  bookId: number;
  title: string;
  author: string | null;
  coverUrl: string | null;
  year: string | null;
  dueDate: string;
}

export function mapReaderBook(dto: ReaderBookDto): BookDisplay {
  return {
    id: dto.id,
    title: dto.title,
    authors: mapAuthorNames(dto.authors),
    category: { id: 0, name: dto.category },
    isbn: '',
    publisher: null,
    publicationPlace: null,
    edition: null,
    coverImageUrl: dto.coverImageUrl,
    publicationDate: dto.publicationYear ? String(dto.publicationYear) : null,
    pageCount: null,
    summary: null,
    available: dto.available,
  };
}

export function mapReaderLoan(dto: ReaderLoanDto): ReaderLoan {
  const statusMap: Record<ReaderLoanDto['status'], LoanStatus> = {
    ON_TIME: 'on_time',
    OVERDUE: 'overdue',
    RETURNED: 'returned',
  };

  return {
    id: dto.id,
    bookId: dto.book.id,
    title: dto.book.title,
    author: dto.book.authors.join(', ') || null,
    coverUrl: dto.book.coverImageUrl,
    year: null,
    tombo: dto.accessionNumber,
    loanDate: dto.loanDate,
    dueDate: dto.dueDate,
    returnDate: dto.returnDate,
    renewalCount: dto.renewalCount,
    status: statusMap[dto.status],
  };
}

export function mapUpcomingReturn(dto: UpcomingReturnDto): UpcomingReturn {
  return {
    id: dto.id,
    bookId: dto.bookId,
    title: dto.title,
    author: dto.authors.join(', ') || null,
    coverUrl: dto.coverImageUrl,
    year: dto.publicationYear ? String(dto.publicationYear) : null,
    dueDate: dto.dueDate,
  };
}

export function mapReaderPage<TDto, TModel>(
  dto: PageResponse<TDto>,
  mapItem: (item: TDto) => TModel,
): PageResponse<TModel> {
  return {
    content: dto.content.map(mapItem),
    page: dto.page + 1,
    size: dto.size,
    totalElements: dto.totalElements,
    totalPages: dto.totalPages,
  };
}
