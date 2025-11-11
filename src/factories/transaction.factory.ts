import { TransactionController } from '@src/controllers/transaction/transaction.controller';
import { prisma } from '@src/database';
import { AccountRepository } from '@src/repositories/account/account.repository';
import { TransactionRepository } from '@src/repositories/transaction/transaction.repository';
import { CreateTransactionUseCase } from '@src/use-cases/transaction/create-transaction/create-transaction.usecase';
import { ListTransactionsUseCase } from '@src/use-cases/transaction/list-transactions/list-transaction.usecase';
import { GetTransactionUseCase } from '@src/use-cases/transaction/get-transaction/get-transaction.usecase';
import { UpdateTransactionUseCase } from '@src/use-cases/transaction/update-transaction/update-transaction.usecase';
import { DeleteTransactionUseCase } from '@src/use-cases/transaction/delete-transaction/delete-transaction.usecase';

export function makeTransactionController(): TransactionController {
  const transactionRepository = new TransactionRepository(prisma);
  const accountRepository = new AccountRepository(prisma);

  const createTransactionUseCase = new CreateTransactionUseCase(
    transactionRepository,
    accountRepository,
  );
  const listTransactionsUseCase = new ListTransactionsUseCase(
    transactionRepository,
    accountRepository,
  );
  const getTransactionUseCase = new GetTransactionUseCase(transactionRepository);
  const updateTransactionUseCase = new UpdateTransactionUseCase(transactionRepository);
  const deleteTransactionUseCase = new DeleteTransactionUseCase(transactionRepository);

  return new TransactionController(
    createTransactionUseCase,
    listTransactionsUseCase,
    getTransactionUseCase,
    updateTransactionUseCase,
    deleteTransactionUseCase,
  );
}
