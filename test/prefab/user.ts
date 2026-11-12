import { User } from '@src/entities/user.entity';
import { faker } from '@faker-js/faker';
import { Account } from '@src/entities/account.entity';

type UserInput = {
  id?: string;
  name?: string;
  email?: string;
  password?: string;
  accounts?: Account[];
};

export const genPassword = (): string => {
  return faker.internet.password();
};

export const genUser = ({
  id = faker.string.uuid(),
  name = faker.person.fullName(),
  email = faker.internet.email(),
  password = genPassword(),
  accounts,
}: UserInput = {}): User =>
  new User({
    id,
    name,
    email,
    password,
    accounts,
  });
