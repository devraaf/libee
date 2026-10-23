import { z } from 'zod'

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
    .max(128)
    .transform((val) => val.trim()),
})

export const registerSchema = z.object({
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
    .max(128)
    .transform((val) => val.trim()),
  confirmPassword: z
    .string()
    .min(1, 'Confirme sua senha.')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem.',
  path: ['confirmPassword'],
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>