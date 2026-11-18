import { z } from 'zod';

export type CollaboratorRole = 'admin' | 'librarian';

export const roleLabels: Record<CollaboratorRole, string> = {
  admin: 'Administrador',
  librarian: 'Bibliotecário',
};

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: CollaboratorRole;
  avatarUrl?: string;
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export const createCollaboratorSchema = z.object({
  name: z.string().trim().min(3, 'Informe o nome completo.'),
  email: z.string().trim().email('Informe um e-mail válido.'),
  phone: z.string().trim().min(14, 'Informe um telefone válido com DDD.'),
  role: z.enum(['admin', 'librarian'], 'Selecione o perfil de acesso.'),
});
export type CollaboratorFormValues = z.infer<typeof createCollaboratorSchema>;