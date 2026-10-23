export const affiliationTypes = ['STUDENT', 'EMPLOYEE', 'PROFESSOR'] as const;

export type AffiliationType = (typeof affiliationTypes)[number];
