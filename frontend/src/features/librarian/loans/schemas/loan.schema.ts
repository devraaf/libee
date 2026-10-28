import { z } from 'zod';
import { dateFromToday } from '../../../../shared/mocks/dates';

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export const registerLoanSchema = z
  .object({
    readerId: z.string().min(1, 'Selecione um leitor.'),
    readerName: z.string().min(1, 'O nome do leitor é obrigatório.'),
    copyCode: z.string().min(1, 'Selecione um exemplar disponível.'),
    dueDate: z
      .string()
      .min(1, 'A data de devolução é obrigatória.')
      .refine(isValidDate, 'Informe uma data válida.'),
  })
  .refine((value) => value.dueDate >= dateFromToday(0), {
    path: ['dueDate'],
    message: 'A data de devolução não pode estar no passado.',
  });

export type RegisterLoanFormData = z.infer<typeof registerLoanSchema>;