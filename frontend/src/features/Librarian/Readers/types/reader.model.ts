import { z } from 'zod';

export type ReaderBond = 'student' | 'teacher' | 'staff';

export const bondLabels: Record<ReaderBond, string> = {
  student: 'Aluno',
  teacher: 'Professor',
  staff: 'Colaborador',
};

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 2) {
    return digits.length > 0 ? `(${digits}` : '';
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export const createReaderSchema = z
  .object({
    name: z.string().min(1, 'Informe o nome.'),
    email: z
      .string()
      .min(1, 'Informe o e-mail.')
      .email('Informe um e-mail válido.'),
    phone: z
      .string()
      .min(1, 'Informe o telefone.')
      .refine(
        (val) => {
          const numbersOnly = val.replace(/\D/g, '');
          // Valida se tem 10 (fixo) ou 11 (celular) dígitos
          return numbersOnly.length === 10 || numbersOnly.length === 11;
        },
        {
          message: 'Informe um telefone válido com DDD (10 ou 11 dígitos).',
        },
      ),
    bond: z.enum(['student', 'teacher', 'staff'], {
      message: 'Selecione o tipo de vínculo.',
    }),
    course: z.string(),
  })
  .superRefine((values, context) => {
    if (values.bond === 'student' && !values.course) {
      context.addIssue({
        code: 'custom',
        path: ['course'],
        message: 'Selecione um curso.',
      });
    }
  });

export type ReaderFormValues = z.infer<typeof createReaderSchema>;
