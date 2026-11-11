import { z } from 'zod';
import { dateFromToday } from '../../../../shared/utils/date';

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

export const registerLoanSchema = z.object({
  readerId: z.number().int().positive('Selecione um leitor.'),
  accessionNumber: z.string().trim().min(1, 'Informe o tombo do exemplar.'),
  dueDate: z
    .string()
    .min(1, 'A data de devolução é obrigatória.')
    .refine(isValidDate, 'Informe uma data válida.')
    .refine(
      (value) => value > dateFromToday(0),
      'A data de devolução deve ser posterior à data atual.',
    ),
});

export type RegisterLoanFormData = z.infer<typeof registerLoanSchema>;
