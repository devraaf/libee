import { z } from 'zod';

export type CourseStatus = 'active' | 'inactive';

export const statusLabels: Record<CourseStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
};

export interface Course {
  id: string;
  name: string;
  status: CourseStatus;
}

export const createCourseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Informe o nome do curso (mínimo 3 caracteres).'),
  status: z.enum(['active', 'inactive'], 'Selecione o status do curso.'),
});

export type CourseFormValues = z.infer<typeof createCourseSchema>;