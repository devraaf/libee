import type { BookDisplay, Copy } from '@/shared/types/library';
import { mapAuthorNames } from '@/shared/utils/book-authors';

export interface BookDetailsDto {
  id: number;
  title: string;
  authors: Array<{ name: string }>;
  category: string;
  isbn: string;
  coverImageUrl: string | null;
  publisher: string | null;
  publicationPlace: string | null;
  edition: string | null;
  publicationYear: number | null;
  pageCount: number | null;
  summary: string | null;
  copies: BookCopyDto[];
}

export interface BookCopyDto {
  copyId: number;
  accessionNumber: string;
  physicalLocation: string | null;
  status: 'AVAILABLE' | 'ON_LOAN';
}

export function mapBookDetails(dto: BookDetailsDto): {
  book: BookDisplay;
  copies: Copy[];
} {
  const copies = dto.copies.map((copy) => ({
    id: copy.copyId,
    bookId: dto.id,
    accessionNumber: copy.accessionNumber,
    physicalLocation: copy.physicalLocation,
    status: copy.status,
  }));
  const year = dto.publicationYear;

  return {
    book: {
      id: dto.id,
      title: dto.title,
      authors: mapAuthorNames(dto.authors),
      category: { id: 0, name: dto.category },
      isbn: dto.isbn,
      publisher: dto.publisher,
      publicationPlace: dto.publicationPlace,
      edition: dto.edition,
      coverImageUrl: dto.coverImageUrl,
      publicationDate: year ? String(year) : null,
      pageCount: dto.pageCount,
      summary: dto.summary,
      available: copies.some((copy) => copy.status === 'AVAILABLE'),
    },
    copies,
  };
}
