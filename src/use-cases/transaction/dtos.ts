import { BaseProps } from '@src/entities/_base/entity';
import { Paginated } from '@src/types/paginator';
import { zCurrency } from '@src/util/zod/currency';
import { BasePaginatorSchema } from '@src/util/zod/paginator';
import z from 'zod';

export const CreateTransactionSchema = z.object({
  amount: zCurrency,
  accountId: z.uuid(),
  description: z.string().nullable().optional(),
});

export type OutputTransaction = BaseProps & {
  amount: string;
  description: string | null;
};

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type CreateTransactionOutput = OutputTransaction;

export const ListTransactionsSchema = BasePaginatorSchema.extend({
  accountId: z.uuid(),
});

export type ListTransactionsInput = z.infer<typeof ListTransactionsSchema>;
export type ListTransactionsOutput = Paginated<OutputTransaction>;

export const GetTransactionSchema = z.object({
  id: z.uuid('ID Inválido'),
  accountId: z.uuid('ID Inválido'),
});

export type GetTransactionInput = z.infer<typeof GetTransactionSchema>;
export type GetTransactionOutput = OutputTransaction;

export const UpdateTransactionSchema = z.object({
  id: z.uuid('ID Inválido'),
  accountId: z.uuid('ID Inválido'),
  amount: zCurrency.optional(),
  description: z.string().nullable().optional(),
});

export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;
export type UpdateTransactionOutput = OutputTransaction;

export const DeleteTransactionSchema = z.object({
  id: z.uuid('ID Inválido'),
  accountId: z.uuid('ID Inválido'),
});

export type DeleteTransactionInput = z.infer<typeof DeleteTransactionSchema>;
export type DeleteTransactionOutput = OutputTransaction;

export type TransactionControllerOutput =
  | CreateTransactionOutput
  | ListTransactionsOutput
  | GetTransactionOutput
  | UpdateTransactionOutput
  | DeleteTransactionOutput;
