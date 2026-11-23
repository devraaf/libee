import { z } from 'zod';
import { normalizePhone } from '@/shared/utils/format-phone';

export type ReaderBond = 'student' | 'teacher' | 'staff';

export const bondLabels: Record<ReaderBond, string> = {
  student: 'Aluno',
  teacher: 'Professor',
  staff: 'Colaborador',
};

export const createReaderSchema = z
  .object({
    name: z.string().min(1, 'Informe o nome.'),
    email: z
      .string()
      .min(1, 'Informe o e-mail.')
      .email('Informe um e-mail válido.'),
    phone: z.string().refine(
      (val) => {
        if (val.trim() === '') return true;
        const numbersOnly = normalizePhone(val);
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
