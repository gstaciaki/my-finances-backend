import { Account } from '@src/entities/account.entity';
import { z } from 'zod';

export const CreateAccountSchema = z.object({
  name: z.string().min(1, 'Nome da conta é obrigatório'),
  usersIds: z.array(z.string().uuid('ID de usuário inválido')),
});

export type CreateAccountInput = z.infer<typeof CreateAccountSchema>;
export type CreateAccountOutput = Account;
