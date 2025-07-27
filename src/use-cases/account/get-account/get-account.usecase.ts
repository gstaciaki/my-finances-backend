import { User } from '@src/entities/user.entity';
import { NotFoundError } from '@src/errors/generic.errors';
import { AbstractUseCase } from '@src/use-cases/_base/use-case';
import { Either, right, wrong } from '@src/util/either';
import { ZodSchema } from 'zod';
import { DefaultFailOutput } from '@src/types/errors';
import { GetAccountInput, GetAccountOutput, GetAccountSchema } from '../dtos';
import { IAccountRepository } from '@src/repositories/account/account.repository';
import { Account } from '@src/entities/account.entity';

type Input = GetAccountInput;
type FailOutput = DefaultFailOutput;
type SuccessOutput = GetAccountOutput;

export class GetAccountUseCase extends AbstractUseCase<Input, FailOutput, SuccessOutput> {
  constructor(private readonly accountRepo: IAccountRepository) {
    super();
  }

  protected validationRules(): ZodSchema<Input> {
    return GetAccountSchema;
  }

  protected async execute(input: Input): Promise<Either<FailOutput, SuccessOutput>> {
    const account = await this.accountRepo.findById(input.id);

    if (!account) {
      return wrong(new NotFoundError('conta', 'id', input.id));
    }

    const domainAccount = new Account({
      ...account,
      users: account.users.map(user => new User(user.user)),
    });

    return right(domainAccount);
  }
}
