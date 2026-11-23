import { describe, expect, it } from 'vitest';
import { bookFormSchema } from './book.schema';

const currentYear = new Date().getFullYear();

const validBook = {
  isbn: '9780132350884',
  title: 'Clean Code',
  authors: ['Robert C. Martin'],
  categoryId: 3,
  publisher: '',
  publicationPlace: '',
  edition: '',
  publicationDate: String(currentYear),
  pageCount: null,
  coverImageUrl: '',
  summary: '',
  copies: [
    {
      copyId: 24,
      accessionNumber: 'T-024',
      physicalLocation: 'A-01',
    },
  ],
};

describe('bookFormSchema publication year', () => {
  it('accepts the current year', () => {
    expect(bookFormSchema.safeParse(validBook).success).toBe(true);
  });

  it('rejects a future publication year', () => {
    const result = bookFormSchema.safeParse({
      ...validBook,
      publicationDate: String(currentYear + 1),
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues).toContainEqual(
      expect.objectContaining({
        path: ['publicationDate'],
        message: `O ano de publicação não pode ser maior que ${currentYear}.`,
      }),
    );
  });
});
