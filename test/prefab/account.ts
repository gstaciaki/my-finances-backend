import { faker } from '@faker-js/faker';
import { Account } from '@src/entities/account.entity';
import { User } from '@src/entities/user.entity';
import { genUser } from './user';

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
  users = [genUser()],
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
