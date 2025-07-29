import { User } from '@src/entities/user.entity';
import { cpf } from './cpf';
import { faker } from '@faker-js/faker/.';
import { Account } from '@src/entities/account.entity';

type UserInput = {
  id?: string;
  name?: string;
  email?: string;
  password?: string;
  userCpf?: string;
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
  userCpf = cpf(),
  accounts,
}: UserInput = {}): User =>
  new User({
    id,
    name,
    email,
    password,
    cpf: userCpf,
    accounts,
  });
