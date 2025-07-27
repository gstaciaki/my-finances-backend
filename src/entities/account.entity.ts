import { BaseEntity, BaseProps } from './_base/entity';
import { User } from './user.entity';

export interface AccountProps extends BaseProps {
  name: string;
  users: User[];
}

export class Account extends BaseEntity {
  readonly name: string;
  readonly users: User[];

  constructor({ name, users, ...base }: AccountProps) {
    super(base);
    this.name = name;
    this.users = users;
  }
}
