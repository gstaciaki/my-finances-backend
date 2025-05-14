import { User } from '@src/entities/user.entity';
import { CPF } from '@src/entities/value-objects/cpf';
import { zPassword } from '@src/util/zod/zPassword';
import { z } from 'zod';

export const CreateUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: zPassword(),
  cpf: z.string().refine(CPF.isValid, 'CPF inválido'),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type CreateUserOutput = User;

export const UpdateUserSchema = z.object({
  id: z.string().uuid('ID inválido'),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UpdateUserOutput = User;

export const DeleteUserSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export type DeleteUserInput = z.infer<typeof DeleteUserSchema>;
export type DeleteUserOutput = User;

export const ListUsersSchema = z.object({});

export type ListUsersInput = z.infer<typeof ListUsersSchema>;
export type ListUsersOutput = User[];

export const ShowUserSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export type ShowUserInput = z.infer<typeof ShowUserSchema>;
export type ShowUserOutput = User;

export type UserControllerOutput =
  | CreateUserOutput
  | DeleteUserOutput
  | ListUsersOutput
  | ShowUserOutput
  | UpdateUserOutput;
