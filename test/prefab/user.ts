import { User } from '@src/entities/user.entity';
import { cpf } from './cpf';
import { faker } from '@faker-js/faker/.';

export const genUser = (): User =>
  new User({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    cpf: cpf(),
  });
