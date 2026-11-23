import { z } from 'zod';

export function isValidISBN(isbn: string): boolean {
  const cleaned = isbn.replace(/[\s-]/g, '');
  return /^(?:\d{9}[\dX]|\d{13})$/i.test(cleaned);
}

export const copyItemSchema = z
  .object({
    copyId: z.number().optional(),
    accessionNumber: z
      .string()
      .trim()
      .max(30, 'O número do tombo deve ter até 30 caracteres.'),
    physicalLocation: z
      .string()
      .trim()
      .max(100, 'A localização deve ter até 100 caracteres.'),
  })
  .superRefine((copy, ctx) => {
    if (copy.copyId === undefined && !copy.accessionNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe o número do tombo.',
        path: ['accessionNumber'],
      });
    }
    if (!copy.physicalLocation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe a localização física do exemplar.',
        path: ['physicalLocation'],
      });
    }
  });

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength, `Este campo deve ter até ${maxLength} caracteres.`)
    .transform((value) => value || null);

const bookFieldsSchema = z.object({
  isbn: z
    .string()
    .min(1, 'O ISBN é obrigatório.')
    .refine((val) => isValidISBN(val), {
      message: 'Digite um ISBN-10 ou ISBN-13 válido.',
    }),
  title: z
    .string()
    .trim()
    .min(1, 'O título da obra é obrigatório.')
    .max(255, 'O título deve ter até 255 caracteres.'),
  authors: z.array(z.string().trim().min(1).max(255)),
  categoryId: z.number().min(1, 'Selecione uma categoria.'),
  publisher: optionalText(150),
  publicationPlace: optionalText(100),
  edition: optionalText(50),
  publicationDate: z.preprocess(
    (value) =>
      typeof value === 'string' && value.trim() ? Number(value) : null,
    z
      .number()
      .int()
      .min(1000, 'Informe um ano válido.')
      .max(
        new Date().getFullYear(),
        `O ano de publicação não pode ser maior que ${new Date().getFullYear()}.`,
      )
      .nullable(),
  ),
  pageCount: z.preprocess(
    (value) => (value === '' || value === undefined ? null : Number(value)),
    z.number().int().nullable(),
  ),
  coverImageUrl: optionalText(500),
  summary: optionalText(Number.MAX_SAFE_INTEGER),
});

function validateDuplicateCopyNumbers(
  data: { copies: Array<{ accessionNumber: string }> },
  ctx: z.RefinementCtx,
) {
  const accessionNumbers = data.copies.map((copy) =>
    copy.accessionNumber.trim().toLocaleLowerCase(),
  );
  const duplicates = accessionNumbers.filter(
    (number, index) =>
      number !== '' && accessionNumbers.indexOf(number) !== index,
  );

  data.copies.forEach((copy, index) => {
    if (duplicates.includes(copy.accessionNumber.trim().toLocaleLowerCase())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tombo duplicado nesta lista.',
        path: ['copies', index, 'accessionNumber'],
      });
    }
  });
}

export const bookFormSchema = bookFieldsSchema
  .extend({ copies: z.array(copyItemSchema) })
  .superRefine(validateDuplicateCopyNumbers);

export const registerBookSchema = bookFieldsSchema
  .extend({
    copies: z.array(copyItemSchema).min(1, 'Informe ao menos um exemplar.'),
  })
  .superRefine(validateDuplicateCopyNumbers);

export type BookFormInput = z.input<typeof bookFormSchema>;
export type BookFormData = z.output<typeof bookFormSchema>;
export type RegisterBookFormInput = z.input<typeof registerBookSchema>;
export type RegisterBookFormData = z.output<typeof registerBookSchema>;
