import { faker } from '@faker-js/faker';
import { Account } from '@src/entities/account.entity';
import { User } from '@src/entities/user.entity';

type AccountInput = {
  id?: string;
  name?: string;
  users?: User[];
  createdAt?: Date;
  updatedAt?: Date;
};

export const genAccount = ({
  id = faker.string.uuid(),
  name = faker.company.name(),
  users,
  createdAt = new Date(),
  updatedAt = new Date(),
}: AccountInput = {}): Account =>
  new Account({
    id,
    name,
    users,
    createdAt,
    updatedAt,
  });
