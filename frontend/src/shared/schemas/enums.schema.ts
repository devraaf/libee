import { z } from 'zod';

export const affiliationTypeSchema = z.enum(
  ['STUDENT', 'EMPLOYEE', 'PROFESSOR'],
  {
    error: 'Selecione seu tipo de vínculo.',
  },
);
export const affiliationTypes = affiliationTypeSchema.options;
export type AffiliationType = z.infer<typeof affiliationTypeSchema>;

export const userProfileSchema = z.enum([
  'READER',
  'LIBRARIAN',
  'ADMINISTRATOR',
]);
export type UserProfile = z.infer<typeof userProfileSchema>;

export const copyStatusSchema = z.enum(['AVAILABLE', 'ON_LOAN']);
export type CopyStatus = z.infer<typeof copyStatusSchema>;

export const loanStatusSchema = z.enum(['ON_TIME', 'OVERDUE', 'RETURNED']);
export type LoanStatus = z.infer<typeof loanStatusSchema>;
