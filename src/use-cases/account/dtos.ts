import { Account } from '@src/entities/account.entity';
import { Paginated } from '@src/types/paginator';
import { BasePaginatorSchema } from '@src/util/zod/paginator';
import { z } from 'zod';

export const CreateAccountSchema = z.object({
  name: z.string().min(1, 'Nome da conta é obrigatório'),
  usersIds: z.array(z.string().uuid('ID de usuário inválido')),
});

export type CreateAccountInput = z.infer<typeof CreateAccountSchema>;
export type CreateAccountOutput = Account;

export const ListAccountsSchema = BasePaginatorSchema.extend({
  name: z.string().optional(),
});

export type ListAccountsInput = z.infer<typeof ListAccountsSchema>;
export type ListAccountsOutput = Paginated<Account>;

export const GetAccountSchema = z.object({
  id: z.string().uuid('ID Inválido'),
});

export type GetAccountInput = z.infer<typeof GetAccountSchema>;
export type GetAccountOutput = Account;
