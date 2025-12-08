import { genUser } from 'test/prefab/user';
import { prisma } from '..';
import { User } from '@prisma/client';
import PasswordUtil from '@src/util/password';

export async function populateUsers() {
  console.log('Creating users...');

  const users: User[] = await Promise.all(Array.from({ length: 50 }, () => genUser()));

  const usersWithHashedPasswords = await Promise.all(
    users.map(async u => ({
      ...u,
      password: await PasswordUtil.hashPassword(u.password),
    })),
  );

  await prisma.user.createMany({
    data: usersWithHashedPasswords,
  });

  console.log(`Created ${users.length} users`);

  return users.map(user => user.id);
}
