import { AccountController } from '@src/controllers/account/account.controller';
import { prisma } from '@src/database';
import { GetAccountWithUsersQuery } from '@src/queries/account/get-account-with-users.query';
import { ListAccountsWithUsersQuery } from '@src/queries/account/list-accounts-with-users.query';
import { AccountRepository } from '@src/repositories/account/account.repository';
import { UserAccountRepository } from '@src/repositories/user-account/user-account.repository';
import { UserRepository } from '@src/repositories/user/user.repository';
import { CreateAccountUseCase } from '@src/use-cases/account/create-account/create-account.usecase';
import { DeleteAccountUseCase } from '@src/use-cases/account/delete-account/delete-account.usecase';
import { GetAccountUseCase } from '@src/use-cases/account/get-account/get-account.usecase';
import { ListAccountsUseCase } from '@src/use-cases/account/list-accounts/list-accounts.usecase';
import { UpdateAccountUseCase } from '@src/use-cases/account/update-account/update-account.usecase';

export function makeAccountController(): AccountController {
  const accountRepository = new AccountRepository(prisma);
  const userRepository = new UserRepository(prisma);
  const userAccountRepository = new UserAccountRepository(prisma);
  const getAccountWithUsersQuery = new GetAccountWithUsersQuery(prisma);
  const listAccountsWithUsersQuery = new ListAccountsWithUsersQuery(prisma);
  const createAccountUseCase = new CreateAccountUseCase(
    accountRepository,
    userRepository,
    userAccountRepository,
  );
  const listAccountsUseCase = new ListAccountsUseCase(listAccountsWithUsersQuery);
  const getAccountUseCase = new GetAccountUseCase(getAccountWithUsersQuery);
  const updateAccountUseCase = new UpdateAccountUseCase(accountRepository);
  const deleteAccountUseCase = new DeleteAccountUseCase(accountRepository);

  return new AccountController(
    createAccountUseCase,
    listAccountsUseCase,
    getAccountUseCase,
    updateAccountUseCase,
    deleteAccountUseCase,
  );
}
