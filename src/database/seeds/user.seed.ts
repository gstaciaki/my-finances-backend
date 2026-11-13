import { prisma } from '..';
import PasswordUtil from '@src/util/password';

export async function usersSeed() {
  console.log('Creating admin users...');

  await prisma.user.createMany({
    data: [
      {
        email: 'admin@example.com',
        password: await PasswordUtil.hashPassword('Password123!'),
        name: 'admin',
      },
    ],
  });
}
