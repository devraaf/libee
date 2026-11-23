import { z } from 'zod';
export const returnFormSchema = z.object({
  copyCode: z
    .string()
    .trim()
    .min(1, 'Informe o tombo do exemplar.')
    .max(30, 'O tombo deve ter no máximo 30 dígitos.'),
});

export type ReturnFormValues = z.infer<typeof returnFormSchema>;
export type ReturnFormErrors = Partial<Record<keyof ReturnFormValues, string>>;
