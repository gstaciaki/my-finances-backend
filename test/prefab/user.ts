import { User } from '@src/entities/user.entity';
import { cpf } from './cpf';
import { faker } from '@faker-js/faker/.';

type UserInput = {
  name?: string;
  email?: string;
  password?: string;
  userCpf?: string;
};

export const genPassword = (): string => {
  return faker.internet.password();
};

export const genUser = ({
  name = faker.person.fullName(),
  email = faker.internet.email(),
  password = genPassword(),
  userCpf = cpf(),
}: UserInput = {}): User =>
  new User({
    id: faker.string.uuid(),
    name,
    email,
    password,
    cpf: userCpf,
  });
