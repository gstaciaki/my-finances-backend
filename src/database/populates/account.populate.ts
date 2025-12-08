import { genAccount } from 'test/prefab/account';
import { prisma } from '..';
import { Account } from '@prisma/client';

export async function populateAccounts() {
  console.log('Creating accounts...');

  const accounts: Account[] = await Promise.all(
    Array.from({ length: 20 }, () => genAccount()),
  );

  await prisma.account.createMany({ data: accounts });

  return accounts;
}
