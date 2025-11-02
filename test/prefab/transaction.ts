import { faker } from '@faker-js/faker';
import { Transaction } from '@src/entities/transaction.entity';
import { Account } from '@src/entities/account.entity';
import { genAccount } from './account';

type TransactionInput = {
  id?: string;
  description?: string;
  amount?: number;
  account?: Account;
  createdAt?: Date;
  updatedAt?: Date;
};

export const genTransaction = ({
  id = faker.string.uuid(),
  description = faker.finance.transactionDescription(),
  amount = faker.number.int({ min: 100, max: 100000 }), // Valor em centavos
  account = genAccount(),
  createdAt = new Date(),
  updatedAt = new Date(),
}: TransactionInput = {}): Transaction =>
  new Transaction({
    id,
    description,
    amount,
    account,
    createdAt,
    updatedAt,
  });

