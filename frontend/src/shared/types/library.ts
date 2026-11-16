import type {
  AffiliationType,
  CopyStatus,
  LoanStatus,
  UserProfile,
} from '../schemas/enums.schema';

export type {
  AffiliationType,
  CopyStatus,
  LoanStatus,
  UserProfile,
} from '../schemas/enums.schema';

export interface Course {
  id: number;
  name: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  phone: string | null;
  affiliationType: AffiliationType;
  profile: UserProfile;
}

export interface Reader extends User {
  profile: 'READER';
  courseId?: number;
}

export interface Author {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Book {
  id: number;
  isbn: string;
  title: string;
  publisher: string | null;
  publicationPlace: string | null;
  edition: string | null;
  coverImageUrl: string | null;
  publicationDate: string | null;
  pageCount: number | null;
  summary: string | null;
  category: Category;
  authors: Author[];
}

export interface BookListItem extends Book {
  available: boolean;
}

export type BookDisplay = Omit<BookListItem, 'authors'> & {
  authors: string[];
};

export interface Copy {
  id: number;
  bookId: number;
  accessionNumber: string;
  physicalLocation: string | null;
  status: CopyStatus;
}

export interface Loan {
  id: number;
  copyId: number;
  readerId: number;
  librarianId: number;
  loanDate: string;
  dueDate: string;
  returnDate: string | null;
  renewalCount: number;
  status: LoanStatus;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CreateBookInput extends Omit<
  Book,
  'id' | 'category' | 'authors'
> {
  categoryId: number;
  authorIds: number[];
}

export interface CreateReaderInput extends Omit<
  Reader,
  'id' | 'password' | 'profile'
> {
  profile?: 'READER';
}

export interface CreateLoanInput extends Omit<
  Loan,
  'id' | 'status' | 'returnDate' | 'renewalCount'
> {}

export interface IsbnLookupInput {
  isbn: string;
}
