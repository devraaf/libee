import { z } from 'zod';

export interface Course {
  id: string;
  name: string;
}

export const createCourseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Informe o nome do curso (mínimo 3 caracteres).'),
});

export type CourseFormValues = z.infer<typeof createCourseSchema>;