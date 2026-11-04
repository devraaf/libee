import { z } from 'zod';

export function getTodayISO(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export const returnFormSchema = z.object({
  copyCode: z
    .string()
    .trim()
    .min(1, 'Informe o tombo do exemplar.')
    .regex(/^\d+$/, 'O tombo deve conter apenas números.')
    .max(20, 'O tombo deve ter no máximo 20 dígitos.'),
  returnDate: z
    .string()
    .min(1, 'Informe a data de devolução.')
    .refine(isRealDate, 'Informe uma data válida.')
    .refine(
      (value) => value <= getTodayISO(),
      'A data de devolução não pode ser futura.',
    ),
});

export type ReturnFormValues = z.infer<typeof returnFormSchema>;
export type ReturnFormErrors = Partial<Record<keyof ReturnFormValues, string>>;
