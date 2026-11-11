import { z } from 'zod';

export function isValidISBN(isbn: string): boolean {
  const cleaned = isbn.replace(/[\s-]/g, '');
  return /^(?:\d{9}[\dX]|\d{13})$/i.test(cleaned);
}

function isValidBRDate(dateStr: string): boolean {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return false;
  const [day, month, year] = dateStr.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export const copyItemSchema = z.object({
  copyId: z.number().optional(),
  accessionNumber: z
    .string()
    .trim()
    .min(1, 'Informe o número do tombo.')
    .max(30, 'O número do tombo deve ter até 30 caracteres.'),
  physicalLocation: z
    .string()
    .trim()
    .min(1, 'Informe a localização física do exemplar.')
    .max(100, 'A localização deve ter até 100 caracteres.'),
});

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength, `Este campo deve ter até ${maxLength} caracteres.`)
    .transform((value) => value || null);

export const registerBookSchema = z
  .object({
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
      (value) => (typeof value === 'string' && !value.trim() ? null : value),
      z
        .string()
        .refine(isValidBRDate, {
          message: 'Informe uma data válida no formato DD/MM/AAAA.',
        })
        .nullable(),
    ),
    pageCount: z.preprocess(
      (value) => (value === '' || value === undefined ? null : Number(value)),
      z.number().int().nullable(),
    ),
    coverImageUrl: optionalText(500),
    summary: optionalText(Number.MAX_SAFE_INTEGER),
    copies: z.array(copyItemSchema).min(1, 'Informe ao menos um exemplar.'),
  })
  .superRefine((data, ctx) => {
    const accessionNumbers = data.copies.map((c) =>
      c.accessionNumber.trim().toLocaleLowerCase(),
    );
    const duplicates = accessionNumbers.filter(
      (num, index) => num !== '' && accessionNumbers.indexOf(num) !== index,
    );

    if (duplicates.length > 0) {
      data.copies.forEach((copy, index) => {
        if (
          duplicates.includes(copy.accessionNumber.trim().toLocaleLowerCase())
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Tombo duplicado nesta lista.',
            path: ['copies', index, 'accessionNumber'],
          });
        }
      });
    }
  });

export type RegisterBookFormInput = z.input<typeof registerBookSchema>;
export type RegisterBookFormData = z.output<typeof registerBookSchema>;
