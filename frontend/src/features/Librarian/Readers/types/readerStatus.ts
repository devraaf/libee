import z from 'zod';

export const readerStatusSchema = z.enum(['OK', 'PENDING']);
export type ReaderStatus = z.infer<typeof readerStatusSchema>;
