import { BaseEntity, BaseProps } from './_base/entity';
import { Account } from './account.entity';

export interface UserProps extends BaseProps {
  name: string;
  email: string;
  password: string;
  cpf: string;
  accounts?: Account[];
}

export class User extends BaseEntity {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly cpf: string;

  readonly accounts?: Account[];

  constructor({ name, email, password, cpf, accounts, ...base }: UserProps) {
    super(base);
    this.name = name;
    this.email = email;
    this.password = password;
    this.cpf = cpf;
    this.accounts = accounts;
  }
}
