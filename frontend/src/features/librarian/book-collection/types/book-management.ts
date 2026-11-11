export interface BookManagementDto {
  id: number;
  title: string;
  authors: string[];
  isbn: string;
  category: string;
  coverImageUrl: string | null;
  totalCopies: number;
  availableCopies: number;
}

export interface BookManagementSummaryDto {
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  onLoanCopies: number;
}

export interface BookLookupDto {
  title: string;
  authors: string[];
  publisher: string | null;
  publicationYear: number | null;
  pageCount: number | null;
  categorySuggestions: string[];
  place: string | null;
  edition: string | null;
  description: string | null;
  coverUrl: string | null;
}

export interface RegisterBookRequest {
  title: string;
  authors: string[];
  categoryId: number;
  isbn: string;
  coverUrl: string | null;
  publisher: string | null;
  place: string | null;
  edition: string | null;
  publicationYear: number | null;
  pageCount: number | null;
  description: string | null;
  copies: Array<{
    accessionNumber: string;
    physicalLocation: string;
  }>;
}

export interface RegisteredBookDto {
  id: number;
  title: string;
}
