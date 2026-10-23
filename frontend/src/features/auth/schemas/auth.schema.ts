import { z } from 'zod';
import { affiliationTypes } from '../types/affiliation-type';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Informe seu e-mail.')
    .email('Informe um e-mail válido.')
    .max(254, 'O e-mail excedeu o limite de caracteres.')
    .transform((val) => val.trim().toLowerCase()),
  password: z
    .string()
    .min(1, 'Informe sua senha.')
    .min(8, 'A senha deve ter no mínimo 8 caracteres.')
    .max(70)
    .transform((val) => val.trim()),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Informe seu nome completo.')
      .max(254, 'O nome excedeu o limite de caracteres.'),
    phone: z
      .string()
      .trim()
      .max(15, 'O telefone excedeu o limite de caracteres.')
      .refine(
        (value) =>
          value === '' || /^(?:\(\d{2}\)\s?|\d{2})\d{4,5}-?\d{4}$/.test(value),
        'Informe um telefone válido com DDD.',
      ),
    affiliationType: z.enum(affiliationTypes, {
      error: 'Selecione seu tipo de vínculo.',
    }),
    courseId: z.string(),
    email: z
      .string()
      .min(1, 'Informe seu e-mail.')
      .email('Informe um e-mail válido.')
      .max(254, 'O e-mail excedeu o limite de caracteres.')
      .transform((val) => val.trim().toLowerCase()),
    password: z
      .string()
      .min(1, 'Informe sua senha.')
      .min(8, 'A senha deve ter no mínimo 8 caracteres.')
      .max(70)
      .transform((val) => val.trim()),
    confirmPassword: z
      .string()
      .min(1, 'Confirme sua senha.')
      .max(70, 'A confirmação excedeu o limite de caracteres.'),
  })
  .superRefine((data, context) => {
    if (
      data.affiliationType === 'STUDENT' &&
      !/^[1-9]\d*$/.test(data.courseId)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Selecione um curso.',
        path: ['courseId'],
      });
    }

    if (data.password !== data.confirmPassword) {
      context.addIssue({
        code: 'custom',
        message: 'As senhas não coincidem.',
        path: ['confirmPassword'],
      });
    }
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
