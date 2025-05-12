import { User } from '@src/entities/user.entity';

export type UserControllerOutput =
  | CreateUserOutput
  | DeleteUserOutput
  | ListUsersOutput
  | ShowUserOutput
  | UpdateUserOutput;

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  cpf: string;
};

export type CreateUserOutput = User;

export type DeleteUserInput = {
  id: string;
};

export type DeleteUserOutput = User;

export type ListUsersInput = void;

export type ListUsersOutput = User[];

export type ShowUserInput = {
  id: string;
};

export type ShowUserOutput = User;

export type UpdateUserInput = {
  id: string;
  name?: string;
  email?: string;
  password?: string;
};

export type UpdateUserOutput = User;
