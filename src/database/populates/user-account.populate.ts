import { prisma } from '..';
import { faker } from '@faker-js/faker';

export async function populateUserAccounts(userIds: string[], accountIds: string[]) {
  console.log('Creating user-account relationships...');

  const userAccounts = accountIds.flatMap(accountId => {
    // Cada account terá entre 0 e 3 users
    const userCount = faker.number.int({ min: 0, max: 3 });

    if (userCount === 0) {
      return [];
    }

    // Seleciona users aleatórios
    const selectedUsers = faker.helpers.arrayElements(userIds, userCount);

    return selectedUsers.map(userId => ({
      userId,
      accountId,
    }));
  });

  await prisma.userAccount.createMany({ data: userAccounts });

  console.log(`Created ${userAccounts.length} user-account relationships`);
}
