import { BaseEntity, BaseProps } from '../core/entity';
import { Account } from './account.entity';

export interface UserProps extends BaseProps {
  name: string;
  email: string;
  password: string;
  accounts?: Account[];
}

export class User extends BaseEntity {
  readonly name: string;
  readonly email: string;
  readonly password: string;

  readonly accounts?: Account[];

  constructor({ name, email, password, accounts, ...base }: UserProps) {
    super(base);
    this.name = name;
    this.email = email;
    this.password = password;
    this.accounts = accounts;
  }
}
