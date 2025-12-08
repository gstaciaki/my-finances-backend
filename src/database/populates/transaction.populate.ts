import { genTransaction } from 'test/prefab/transaction';
import { prisma } from '..';
import { faker } from '@faker-js/faker';

export async function populateTransactions(accountIds: string[]) {
  console.log('Creating transactions...');

  const transactions = accountIds.flatMap(accountId => {
    const transactionCount = faker.number.int({ min: 5, max: 15 });

    return Array.from({ length: transactionCount }, () => {
      const transaction = genTransaction();
      return {
        id: transaction.id,
        description: transaction.description,
        amount: transaction.amount,
        accountId: accountId,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      };
    });
  });

  await prisma.transaction.createMany({ data: transactions });

  console.log(`Created ${transactions.length} transactions`);
}
