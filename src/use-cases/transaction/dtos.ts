import { Transaction } from '@src/entities/transaction.entity';
import z from 'zod';

export const CreateTransactionSchema = z.object({
  amount: z.number(),
  accountId: z.uuid(),
  description: z.string().nullable().optional(),
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type CreateTransactionOutput = Transaction;
