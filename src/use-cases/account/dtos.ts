import { Account } from '@src/entities/account.entity';
import { Paginated } from '@src/types/paginator';
import { BasePaginatorSchema } from '@src/util/zod/paginator';
import { z } from 'zod';
import { OutputUser } from '../user/dtos';
import { BaseProps } from '@src/entities/_base/entity';

export const CreateAccountSchema = z.object({
  name: z.string().min(1, 'Nome da conta é obrigatório'),
  usersIds: z.array(z.string().uuid('ID de usuário inválido')),
});

export type OutputAccount = BaseProps & {
  name: string;
  users: OutputUser[];
};

export type CreateAccountInput = z.infer<typeof CreateAccountSchema>;
export type CreateAccountOutput = Account;

export const ListAccountsSchema = BasePaginatorSchema.extend({
  name: z.string().optional(),
});

export type ListAccountsInput = z.infer<typeof ListAccountsSchema>;
export type ListAccountsOutput = Paginated<OutputAccount>;

export const GetAccountSchema = z.object({
  id: z.string().uuid('ID Inválido'),
});

export type GetAccountInput = z.infer<typeof GetAccountSchema>;
export type GetAccountOutput = OutputAccount;

export const UpdateAccountSchema = z.object({
  id: z.string().uuid('ID Inválido'),
  name: z.string().optional(),
});

export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>;
export type UpdateAccountOutput = Account;

export const DeleteAccountSchema = z.object({
  id: z.string().uuid('ID Inválido'),
});

export type DeleteAccountInput = z.infer<typeof DeleteAccountSchema>;
export type DeleteAccountOutput = Account;

export type AccountControllerOutput =
  | CreateAccountOutput
  | ListAccountsOutput
  | GetAccountOutput
  | UpdateAccountOutput
  | DeleteAccountOutput;
