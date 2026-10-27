import { z } from 'zod';

export const registerLoanSchema = z.object({
  readerId: z.string().min(1, 'Selecione ou cadastre um leitor.'),
  readerName: z.string().min(1, 'O nome do leitor é obrigatório.'),
  copyCode: z.string().min(1, 'O tombo do exemplar é obrigatório.'),
  dueDate: z.string().min(1, 'A data de devolução é obrigatória.'),
});

export type RegisterLoanFormData = z.infer<typeof registerLoanSchema>;