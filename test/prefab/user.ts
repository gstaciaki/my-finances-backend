import { User } from '@src/entities/user.entity';
import { cpf } from './cpf';
import { faker } from '@faker-js/faker/.';

type UserInput = {
  id?: string;
  name?: string;
  email?: string;
  password?: string;
  userCpf?: string;
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
}: UserInput = {}): User =>
  new User({
    id,
    name,
    email,
    password,
    cpf: userCpf,
  });
