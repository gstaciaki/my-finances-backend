import { Transaction } from '@src/entities/transaction.entity';
import { Paginated } from '@src/types/paginator';
import { BasePaginatorSchema } from '@src/util/zod/paginator';
import z from 'zod';

export const CreateTransactionSchema = z.object({
  amount: z.number(),
  accountId: z.uuid(),
  description: z.string().nullable().optional(),
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type CreateTransactionOutput = Transaction;

export const ListTransactionsSchema = BasePaginatorSchema.extend({
  accountId: z.uuid(),
});

export type ListTransactionsInput = z.infer<typeof ListTransactionsSchema>;
export type ListTransactionsOutput = Paginated<Transaction>;

export const GetTransactionSchema = z.object({
  id: z.uuid('ID Inválido'),
});

export type GetTransactionInput = z.infer<typeof GetTransactionSchema>;
export type GetTransactionOutput = Transaction;

export const UpdateTransactionSchema = z.object({
  id: z.uuid('ID Inválido'),
  amount: z.number().optional(),
  description: z.string().nullable().optional(),
});

export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;
export type UpdateTransactionOutput = Transaction;

export const DeleteTransactionSchema = z.object({
  id: z.uuid('ID Inválido'),
});

export type DeleteTransactionInput = z.infer<typeof DeleteTransactionSchema>;
export type DeleteTransactionOutput = Transaction;

export type TransactionControllerOutput =
  | CreateTransactionOutput
  | ListTransactionsOutput
  | GetTransactionOutput
  | UpdateTransactionOutput
  | DeleteTransactionOutput;
