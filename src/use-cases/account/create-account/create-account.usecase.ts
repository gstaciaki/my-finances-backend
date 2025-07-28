import { AbstractUseCase } from '@src/use-cases/_base/use-case';
import { DefaultFailOutput } from '@src/types/errors';
import { Either, right, wrong } from '@src/util/either';
import { ZodSchema } from 'zod';
import { CreateAccountInput, CreateAccountOutput, CreateAccountSchema } from '../dtos';
import { IAccountRepository } from '@src/repositories/account/account.repository';
import { Account } from '@src/entities/account.entity';
import { IUserRepository } from '@src/repositories/user/user.repository';
import { NotFoundError } from '@src/errors/generic.errors';
import { IUserAccountRepository } from '@src/repositories/user-account/user-account.repository';
import { User } from '@src/entities/user.entity';

type Input = CreateAccountInput;
type FailOutput = DefaultFailOutput;
type SuccessOutput = CreateAccountOutput;

export class CreateAccountUseCase extends AbstractUseCase<Input, FailOutput, SuccessOutput> {
  constructor(
    private readonly accountRepo: IAccountRepository,
    private readonly usersRepo: IUserRepository,
    private readonly userAccountRepo: IUserAccountRepository,
  ) {
    super();
  }

  protected validationRules(): ZodSchema<Input> {
    return CreateAccountSchema;
  }

  protected async execute(input: Input): Promise<Either<FailOutput, SuccessOutput>> {
    const users: User[] = [];

    for (const id of input.usersIds) {
      const user = await this.usersRepo.findById(id);
      if (!user) return wrong(new NotFoundError('usuário', 'id', id));
      users.push(new User(user));
    }

    const account = new Account({ ...input, users });
    const { users: accountUsers, ...accountData } = account;

    await this.accountRepo.create(accountData);

    await this.linkUsersToAccount(input.usersIds, account.id);

    return right(account);
  }

  private async linkUsersToAccount(userIds: string[], accountId: string) {
    await Promise.all(userIds.map(id => this.userAccountRepo.create({ userId: id, accountId })));
  }
}
