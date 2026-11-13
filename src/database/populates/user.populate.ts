import { faker } from '@faker-js/faker';
import { prisma } from '..';
import PasswordUtil from '@src/util/password';

export async function populateUsers() {
  console.log('Creating users...');

  const users = await Promise.all(
    Array.from({ length: 50 }, async () => ({
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      password: await PasswordUtil.hashPassword(faker.internet.password()),
    })),
  );

  await prisma.user.createMany({ data: users, skipDuplicates: true });

  console.log(`Created ${users.length} users`);

  return users.map(user => user.id);
}
