import { User } from '@src/entities/user.entity';
import { genUser } from 'test/prefab/user';
import { prisma } from '..';
import PasswordUtil from '@src/util/password';

export async function usersSeed() {
  console.log('Creating admin users...');

  const data: User[] = [
    genUser({
      email: 'admin@example.com',
      password: await PasswordUtil.hashPassword('Password123!'),
      name: 'admin',
      userCpf: 'XXX.XXX.XXX-XX',
    }),
  ];

  await prisma.user.createMany({ data });
}
