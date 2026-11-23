import type { FieldPath } from 'react-hook-form';
import type {
  BookFormData,
  RegisterBookFormData,
  RegisterBookFormInput,
} from '../schemas/book.schema';
import type {
  RegisterBookRequest,
  UpdateBookRequest,
} from '../types/book-management';

export function toUpdateBookRequest(data: BookFormData): UpdateBookRequest {
  return {
    title: data.title,
    authors: data.authors,
    categoryId: data.categoryId,
    isbn: data.isbn.replace(/[\s-]/g, '').toUpperCase(),
    coverUrl: data.coverImageUrl,
    publisher: data.publisher,
    place: data.publicationPlace,
    edition: data.edition,
    publicationYear: data.publicationDate,
    pageCount: data.pageCount,
    description: data.summary,
    copies: data.copies.flatMap((copy) =>
      copy.copyId === undefined
        ? []
        : [
            {
              id: copy.copyId,
              physicalLocation: copy.physicalLocation.trim(),
            },
          ],
    ),
  };
}

export function toRegisterBookRequest(
  data: RegisterBookFormData,
): RegisterBookRequest {
  return {
    ...toUpdateBookRequest(data),
    copies: data.copies.map((copy) => ({
      accessionNumber: copy.accessionNumber.trim(),
      physicalLocation: copy.physicalLocation,
    })),
  };
}

export function mapBookRequestField(
  field: string,
): FieldPath<RegisterBookFormInput> | undefined {
  const copyMatch =
    /^copies\[(\d+)\]\.(accessionNumber|physicalLocation)$/.exec(field);
  if (copyMatch) {
    return `copies.${copyMatch[1]}.${copyMatch[2]}` as FieldPath<RegisterBookFormInput>;
  }

  const fields: Record<string, FieldPath<RegisterBookFormInput>> = {
    title: 'title',
    authors: 'authors',
    categoryId: 'categoryId',
    isbn: 'isbn',
    coverUrl: 'coverImageUrl',
    publisher: 'publisher',
    place: 'publicationPlace',
    edition: 'edition',
    publicationYear: 'publicationDate',
    pageCount: 'pageCount',
    description: 'summary',
  };
  return fields[field];
}
