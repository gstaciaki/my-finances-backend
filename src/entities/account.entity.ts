import { BaseEntity, BaseProps } from './_base/entity';

export interface AccountProps extends BaseProps {
  name: string;
  usersIds: string[];
}

export class Account extends BaseEntity {
  readonly name: string;
  readonly usersIds: string[];

  constructor({ name, usersIds, ...base }: AccountProps) {
    super(base);
    this.name = name;
    this.usersIds = usersIds;
  }
}
