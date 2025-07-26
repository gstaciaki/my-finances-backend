import { faker } from '@faker-js/faker';
import { Account } from '@src/entities/account.entity';

type AccountInput = {
  id?: string;
  name?: string;
  usersIds?: string[];
  createdAt?: Date;
  updatedAt?: Date;
};

export const genAccount = ({
  id = faker.string.uuid(),
  name = faker.company.name(),
  usersIds = [faker.string.uuid()],
  createdAt = new Date(),
  updatedAt = new Date(),
}: AccountInput = {}): Account =>
  new Account({
    id,
    name,
    usersIds,
    createdAt,
    updatedAt,
  });
