import { BaseEntity, BaseProps } from './_base/entity';

export interface UserProps extends BaseProps {
  name: string;
  email: string;
  password: string;
  cpf: string;
}

export class User extends BaseEntity {
  public name: string;
  public email: string;
  public password: string;
  public cpf: string;

  constructor({ name, email, password, cpf, ...base }: UserProps) {
    super(base);
    this.name = name;
    this.email = email;
    this.password = password;
    this.cpf = cpf;
  }
}
