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
  accessionNumber: z.string().min(1, 'Informe o número do tombo.'),
  physicalLocation: z.string().min(1, 'Informe a localização física.'),
});

export const registerBookSchema = z
  .object({
    isbn: z
      .string()
      .min(1, 'O ISBN é obrigatório.')
      .refine((val) => isValidISBN(val), {
        message: 'Digite um ISBN-10 ou ISBN-13 válido.',
      }),
    title: z.string().min(1, 'O título da obra é obrigatório.'),
    authors: z
      .array(z.string())
      .min(1, 'Adicione pelo menos um autor.'),
    categoryId: z.number().min(1, 'Selecione uma categoria.'),
    publisher: z.string().min(1, 'A editora é obrigatória.'),
    publicationPlace: z.string().min(1, 'O local de publicação é obrigatório.'),
    edition: z.string().min(1, 'A edição é obrigatória.'),
    publicationDate: z
      .string()
      .min(1, 'A data de publicação é obrigatória.')
      .refine((val) => isValidBRDate(val), {
        message: 'Informe uma data válida no formato DD/MM/AAAA.',
      }),
    pageCount: z.coerce
      .number('Digite apenas números para as páginas.')
      .min(1, 'O número de páginas é obrigatório.'),
    coverImageUrl: z.string().optional(),
    summary: z.string().optional(), 
    copies: z
      .array(copyItemSchema)
      .min(1, 'Adicione ao menos 1 exemplar.'),
  })
  .superRefine((data, ctx) => {
    const accessionNumbers = data.copies.map((c) => c.accessionNumber.trim());
    const duplicates = accessionNumbers.filter(
      (num, index) => num !== '' && accessionNumbers.indexOf(num) !== index
    );

    if (duplicates.length > 0) {
      data.copies.forEach((copy, index) => {
        if (duplicates.includes(copy.accessionNumber.trim())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Tombo duplicado nesta lista.',
            path: ['copies', index, 'accessionNumber'],
          });
        }
      });
    }
  });

export type RegisterBookFormData = z.infer<typeof registerBookSchema>;