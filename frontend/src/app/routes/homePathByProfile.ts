import type { UserProfile } from '@/shared/schemas/enums.schema';

export const homePathByProfile: Record<UserProfile, string> = {
  READER: '/acervo',
  LIBRARIAN: '/gerenciamento/acervo',
  ADMINISTRATOR: '/administracao/leitores',
};
