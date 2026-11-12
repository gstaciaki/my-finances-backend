import { BaseEntity, BaseProps } from '../core/entity';

export interface UserProps extends BaseProps {
  name: string;
  email: string;
  password: string;
}

export class User extends BaseEntity {
  readonly name: string;
  readonly email: string;
  readonly password: string;

  constructor({ name, email, password, ...base }: UserProps) {
    super(base);
    this.name = name;
    this.email = email;
    this.password = password;
  }
}
